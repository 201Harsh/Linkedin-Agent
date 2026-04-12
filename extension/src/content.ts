console.log("[AgentX] Content Script injected successfully!");

const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:3000";
const frontendHostname = new URL(FRONTEND_URL).hostname;

if (window.location.hostname === frontendHostname) {
  console.log("[AgentX] Monitoring Dashboard for Auth Token...");
  setInterval(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      chrome.runtime.sendMessage({
        action: "SAVE_AUTH_TOKEN",
        token: token,
      });
    }
  }, 2000);
}

const humanPause = (min = 2000, max = 5000) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(`[AgentX] 🤖 Human pause: waiting ${ms}ms...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const clickExactText = async (
  text: string,
  scopeSelector: string,
  maxRetries = 5,
) => {
  for (let i = 0; i < maxRetries; i++) {
    const scope = document.querySelector(scopeSelector) || document.body;
    const elements = Array.from(
      scope.querySelectorAll(
        "button, [role='button'], .artdeco-dropdown__item, span",
      ),
    );

    for (const el of elements) {
      const htmlEl = el as HTMLElement;
      if (htmlEl.innerText && htmlEl.innerText.trim() === text) {
        const style = window.getComputedStyle(htmlEl);

        if (style.display !== "none" && style.visibility !== "hidden") {
          const clickable =
            (htmlEl.closest(
              "button, [role='button'], .artdeco-dropdown__item",
            ) as HTMLElement) || htmlEl;
          console.log(`[AgentX] Found '${text}', clicking now...`);
          clickable.click();
          return true;
        }
      }
    }

    console.log(
      `[AgentX] '${text}' not found yet, retrying... (${i + 1}/${maxRetries})`,
    );
    await humanPause(800, 1200);
  }
  return false;
};

chrome.runtime.onMessage.addListener(
  async (request: any, _sender: any, sendResponse: any) => {
    if (request.action === "PING_DOM") {
      const name = document
        .querySelector(".text-heading-xlarge")
        ?.textContent?.trim();
      sendResponse({ name });
    }

    if (request.action === "EXECUTE_CONNECT") {
      console.log("[AgentX] Initiating Autonomous Connection Sequence...");

      try {
        await humanPause(2500, 4500);

        let clickedConnect = await clickExactText("Connect", "main", 3);

        if (!clickedConnect) {
          console.log("[AgentX] Connect hidden. Opening 'More' menu...");
          const clickedMore = await clickExactText("More", "main", 3);

          if (clickedMore) {
            await humanPause(1500, 2500);
            clickedConnect = await clickExactText(
              "Connect",
              ".artdeco-dropdown__content--is-open",
              5,
            );
          }
        }

        if (!clickedConnect) {
          console.warn(
            "[AgentX] ⚠️ Connect button is completely locked out. Moving on.",
          );
          return;
        }

        console.log("[AgentX] Waiting for modal to appear...");
        await humanPause(2000, 3500);

        const clickedSendWithoutNote = await clickExactText(
          "Send without a note",
          ".artdeco-modal",
          5,
        );

        if (clickedSendWithoutNote) {
          console.log(
            "[AgentX] ✅ Target successfully engaged via premium bypass.",
          );
        } else {
          console.log(
            "[AgentX] 'Send without a note' not found. Trying standard 'Send'...",
          );
          const clickedSend = await clickExactText("Send", ".artdeco-modal", 3);

          if (clickedSend) {
            console.log(
              "[AgentX] ✅ Target successfully engaged via standard send.",
            );
          } else {
            console.warn(
              "[AgentX] ⚠️ Could not find any send button in the modal.",
            );
          }
        }
      } catch (error) {
        console.error("[AgentX] Automation failed:", error);
      }
    }
  },
);
