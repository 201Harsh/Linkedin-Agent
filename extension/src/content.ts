console.log("[AgentX] Content Script injected successfully!");

if (window.location.hostname === "localhost") {
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

const findElement = (scopeSelector: string, text: string) => {
  const scope = document.querySelector(scopeSelector) || document.body;
  const elements = Array.from(
    scope.querySelectorAll('button, [role="button"], span, div'),
  );

  const foundElement = elements.find((el) => {
    const style = window.getComputedStyle(el);
    const isVisible =
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0";

    const elText = el.textContent || "";
    return isVisible && elText.trim() === text;
  }) as HTMLElement | undefined;

  if (foundElement) {
    return (
      (foundElement.closest('button, [role="button"]') as HTMLElement) ||
      foundElement
    );
  }

  return undefined;
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
        await humanPause(2000, 4000); // Wait for the page to fully render

        let connectBtn = findElement("main", "Connect");

        if (!connectBtn) {
          console.log(
            '[AgentX] Connect button hidden. Hunting in "More" menu...',
          );
          const moreBtn = findElement("main", "More");

          if (moreBtn) {
            moreBtn.click();
            await humanPause(1500, 2500); // Wait for dropdown menu to animate

            connectBtn = findElement(
              ".artdeco-dropdown__content--is-open",
              "Connect",
            );
          }
        }

        if (!connectBtn) {
          console.warn(
            "[AgentX] ⚠️ Connect button is completely locked out. Moving on.",
          );
          return;
        }

        console.log("[AgentX] Found Connect button! Clicking...");
        connectBtn.click();

        await humanPause(2000, 4000); // Wait for the modal to pop up

        const addNoteBtn = findElement(".artdeco-modal", "Add a note");

        if (addNoteBtn) {
          console.log("[AgentX] Clicking Add Note...");
          addNoteBtn.click();
          await humanPause(1500, 2500);
        } else {
          console.log(
            '[AgentX] "Add a note" button not found, modal might have skipped directly to message input.',
          );
        }

        const textarea = document.querySelector(
          'textarea[name="message"], textarea#custom-message',
        ) as HTMLTextAreaElement;

        if (textarea) {
          console.log("[AgentX] Typing personalized message...");
          textarea.value = request.note;
          textarea.dispatchEvent(new Event("input", { bubbles: true }));

          await humanPause(3000, 6000); // Proofread like a human

          const sendBtn = findElement(".artdeco-modal", "Send");
          if (sendBtn) {
            console.log("[AgentX] Clicking Send!");
            sendBtn.click();
            console.log("[AgentX] ✅ Target successfully engaged.");
          } else {
            console.warn("[AgentX] Send button not found in modal.");
          }
        } else {
          console.warn("[AgentX] Text area not found in modal.");
        }
      } catch (error) {
        console.error("[AgentX] Automation failed:", error);
      }
    }
  },
);
