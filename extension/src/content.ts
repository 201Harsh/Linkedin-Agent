console.log("AgentX Content Script injected successfully into LinkedIn!");

chrome.runtime.onMessage.addListener(
  (request: any, _sender: any, sendResponse: any) => {
    if (request.action === "PING_DOM") {
      const name = document
        .querySelector(".text-heading-xlarge")
        ?.textContent?.trim();
      sendResponse({ name });
    }
  },
);
