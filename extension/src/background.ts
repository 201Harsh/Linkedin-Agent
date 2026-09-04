console.log("[AgentX] Background worker initialized.");

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

let isProcessing = false;

chrome.runtime.onMessage.addListener((request: any, _sender: any, sendResponse: any) => {
  if (request.action === "SAVE_AUTH_TOKEN") {
    chrome.storage.local.get("agentx_token", (res) => {
      if (res.agentx_token !== request.token) {
        chrome.storage.local.set({ agentx_token: request.token }, () => {
          console.log("[AgentX Background] Auth Token Synced successfully.");
        });
      }
    });
    sendResponse?.({ status: "token_received" });
  }
});

const randomHumanDelay = (minSeconds = 6, maxSeconds = 12) => {
  const ms = Math.floor(Math.random() * ((maxSeconds - minSeconds) * 1000 + 1)) + minSeconds * 1000;
  return ms;
};

const pollQueue = async () => {
  if (isProcessing) {
    return;
  }

  try {
    const storage = await chrome.storage.local.get("agentx_token");
    const token = storage.agentx_token;

    if (!token) {
      setTimeout(pollQueue, 4000);
      return;
    }

    const response = await fetch(`${BACKEND_URL}/users/campaigns/queue/next`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      console.error("[AgentX] Token expired (401). Purging token from storage...");
      await chrome.storage.local.remove("agentx_token");
      setTimeout(pollQueue, 6000);
      return;
    }

    if (response.status === 404) {
      // Queue is empty right now, check soon
      setTimeout(pollQueue, 4000);
      return;
    }

    if (!response.ok) {
      setTimeout(pollQueue, 6000);
      return;
    }

    const lead = await response.json();

    if (lead && lead.url) {
      isProcessing = true;
      console.log("[AgentX] 🎯 Processing queued lead:", lead.name || "Target", lead.url);

      chrome.tabs.create({ url: lead.url, active: false }, (tab) => {
        if (!tab || !tab.id) {
          isProcessing = false;
          setTimeout(pollQueue, 4000);
          return;
        }

        const tabId = tab.id;
        let completed = false;

        const cleanupAndProceed = (nextDelayMs?: number) => {
          if (completed) return;
          completed = true;
          isProcessing = false;

          // Safely close the background tab
          chrome.tabs.get(tabId, (existingTab) => {
            if (existingTab && !chrome.runtime.lastError) {
              chrome.tabs.remove(tabId, () => {
                if (chrome.runtime.lastError) {}
              });
            }
          });

          const pause = nextDelayMs ?? randomHumanDelay(6, 12);
          console.log(`[AgentX] ☕ Pacing: waiting ${Math.round(pause / 1000)}s before next lead...`);
          setTimeout(pollQueue, pause);
        };

        // Failsafe timeout after 30s
        const failsafe = setTimeout(() => {
          if (!completed) {
            console.warn("[AgentX] ⏱️ Timeout on tab execution. Closing tab and continuing...");
            cleanupAndProceed(4000);
          }
        }, 30000);

        // Listen for completion response from content script
        const messageListener = (msg: any, sender: any) => {
          if (sender.tab?.id === tabId && msg.action === "CONNECT_COMPLETED") {
            clearTimeout(failsafe);
            chrome.runtime.onMessage.removeListener(messageListener);
            console.log(`[AgentX] ✅ Connection action completed (success: ${msg.success}).`);
            cleanupAndProceed();
          }
        };
        chrome.runtime.onMessage.addListener(messageListener);

        // Wait for page to finish loading
        chrome.tabs.onUpdated.addListener(function updateListener(tId, info) {
          if (tId === tabId && info.status === "complete") {
            chrome.tabs.onUpdated.removeListener(updateListener);

            // Responsive 1.8s pause for LinkedIn dynamic hydration
            setTimeout(() => {
              chrome.tabs.sendMessage(
                tabId,
                {
                  action: "EXECUTE_CONNECT",
                  note: lead.note,
                  name: lead.name,
                },
                () => {
                  if (chrome.runtime.lastError) {
                    console.warn("[AgentX] Message send notice:", chrome.runtime.lastError.message);
                  }
                },
              );
            }, 1800);
          }
        });
      });

      return;
    }
  } catch (error: any) {
    console.warn(`[AgentX] Network error:`, error?.message || error);
    isProcessing = false;
  }

  setTimeout(pollQueue, 4000);
};

// Start the queue polling engine
pollQueue();
