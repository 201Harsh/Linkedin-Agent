console.log("AgentX Background worker initialized.");

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "SAVE_AUTH_TOKEN") {
    chrome.storage.local.get("agentx_token", (res) => {
      if (res.agentx_token !== request.token) {
        chrome.storage.local.set({ agentx_token: request.token }, () => {
          console.log(
            "[AgentX Background] Auth Token secured in local storage.",
          );
        });
      }
    });
  }
});

setInterval(async () => {
  try {
    const storage = await chrome.storage.local.get("agentx_token");
    const token = storage.agentx_token;

    if (!token) return;

    const response = await fetch(
      "http://localhost:4000/users/campaigns/queue/next",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status === 404) return;

    if (!response.ok) {
      console.error("[AgentX] Polling failed! Status:", response.status);
      return;
    }

    const lead = await response.json();

    if (lead && lead.url) {
      console.log("[AgentX] Executing Authorized Campaign Target:", lead);

      chrome.tabs.create({ url: lead.url, active: false }, (tab) => {
        if (tab.id) {
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === "complete") {
              chrome.tabs.onUpdated.removeListener(listener);
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                  action: "EXECUTE_CONNECT",
                  note: lead.note,
                });
              }, 3000);
            }
          });
        }
      });
    }
  } catch (error) {
    console.error("[AgentX] Fatal polling error:", error);
  }
}, 10000);
