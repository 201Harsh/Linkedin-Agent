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

const humanPause = (min = 2000, max = 3000) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(`[AgentX] 🤖 Human pause: waiting ${ms}ms...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const clickExactText = async (
  text: string,
  scopeSelector: string,
  requirePrimary = false,
  maxRetries = 5,
) => {
  for (let i = 0; i < maxRetries; i++) {
    // 1. Force the bot to wait until the specific menu or modal physically exists
    const scope = document.querySelector(scopeSelector);

    if (!scope) {
      console.log(
        `[AgentX] Scope '${scopeSelector}' not found yet... (${i + 1}/${maxRetries})`,
      );
      await humanPause(800, 1200);
      continue;
    }

    const elements = Array.from(
      scope.querySelectorAll(
        "button, [role='button'], .artdeco-dropdown__item",
      ),
    );

    for (const el of elements) {
      const htmlEl = el as HTMLElement;
      // textContent is safer than innerText for React animations
      const elText = htmlEl.textContent
        ? htmlEl.textContent.trim().replace(/\s+/g, " ")
        : "";

      if (elText === text) {
        const rect = htmlEl.getBoundingClientRect();

        // 2. It MUST be physically visible on the screen
        if (rect.width > 0 && rect.height > 0) {
          // 3. THE LOCK: Prevent clicking background post "Send" buttons by requiring the primary class
          if (
            requirePrimary &&
            !htmlEl.classList.contains("artdeco-button--primary")
          ) {
            continue;
          }

          console.log(`[AgentX] Found VISIBLE '${text}', clicking now...`);
          htmlEl.click();
          return true;
        }
      }
    }

    console.log(
      `[AgentX] '${text}' not physically visible inside scope yet, retrying... (${i + 1}/${maxRetries})`,
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

        // The exact selector for the top profile card (Ignores "Similar People")
        const TOP_CARD_SCOPE =
          ".ph5.pb5, .pv-top-card, main > section:first-child";

        // 1. Try to find Connect ONLY on the top profile card
        let clickedConnect = await clickExactText(
          "Connect",
          TOP_CARD_SCOPE,
          false,
          3,
        );

        // 2. If no Connect, pop the More menu ONLY on the top profile card
        if (!clickedConnect) {
          console.log("[AgentX] Connect hidden. Opening 'More' menu...");
          const clickedMore = await clickExactText(
            "More",
            TOP_CARD_SCOPE,
            false,
            3,
          );

          if (clickedMore) {
            await humanPause(1500, 2500);
            // 3. Hunt for Connect STRICTLY inside the physically open dropdown
            clickedConnect = await clickExactText(
              "Connect",
              ".artdeco-dropdown__content--is-open",
              false,
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

        // 4. Wait for the popup modal to physically render
        console.log("[AgentX] Waiting for modal to appear...");
        await humanPause(2000, 3500);

        // 5. Hunt for the Premium Bypass button inside the modal
        const clickedSendWithoutNote = await clickExactText(
          "Send without a note",
          ".artdeco-modal",
          false,
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

          // 6. REQUIRE PRIMARY = TRUE. This completely prevents the "Send Babita's Post" bug.
          const clickedSend = await clickExactText(
            "Send",
            ".artdeco-modal",
            true,
            3,
          );

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
