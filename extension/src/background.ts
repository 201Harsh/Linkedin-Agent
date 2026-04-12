console.log("[AgentX] Background worker initialized.");

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

chrome.runtime.onMessage.addListener((request: any) => {
  if (request.action === "SAVE_AUTH_TOKEN") {
    chrome.storage.local.get("agentx_token", (res) => {
      if (res.agentx_token !== request.token) {
        chrome.storage.local.set({ agentx_token: request.token }, () => {
          console.log("[AgentX Background] Auth Token Synced.");
        });
      }
    });
  }
});

const pollQueue = async () => {
  try {
    const storage = await chrome.storage.local.get("agentx_token");
    const token = storage.agentx_token;

    if (!token) {
      setTimeout(pollQueue, 10000);
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
      console.error("[AgentX] Token expired (401). Purging dead token...");
      await chrome.storage.local.remove("agentx_token");
      setTimeout(pollQueue, 10000);
      return;
    }

    if (response.status === 404) {
      setTimeout(pollQueue, 10000);
      return;
    }

    if (!response.ok) {
      console.error("[AgentX] Polling failed! Status:", response.status);
      setTimeout(pollQueue, 10000);
      return;
    }

    const lead = await response.json();

    if (lead && lead.url) {
      console.log("[AgentX] Executing Authorized Campaign Target:", lead);

      chrome.tabs.create({ url: lead.url, active: false }, (tab) => {
        if (tab.id) {
          let sequenceTriggered = false;

          const failsafe = setTimeout(() => {
            if (!sequenceTriggered) {
              console.warn(
                "[AgentX] ⚠️ Tab load timed out. Aborting and re-polling...",
              );
              pollQueue();
            }
          }, 20000);

          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === "complete") {
              chrome.tabs.onUpdated.removeListener(listener);
              sequenceTriggered = true;
              clearTimeout(failsafe);

              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                  action: "EXECUTE_CONNECT",
                  note: lead.note,
                });

                // Wait 12 seconds for the content script to finish, then pull the next lead
                setTimeout(pollQueue, 12000);
              }, 4000);
            }
          });
        } else {
          setTimeout(pollQueue, 10000);
        }
      });

      return;
    }
  } catch (error) {
    console.error("[AgentX] Network error:", error);
  }

  setTimeout(pollQueue, 10000);
};

// Start the engine
pollQueue();
