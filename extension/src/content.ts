console.log("[AgentX] Content Script injected successfully!");

const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:3000";
const frontendHostname = new URL(FRONTEND_URL).hostname;

if (window.location.hostname === frontendHostname) {
  console.log("[AgentX] Monitoring Dashboard for Auth Token...");
  setInterval(() => {
    let token = localStorage.getItem("accessToken");
    if (token) {
      token = token.replace(/['"]+/g, "");
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

// THE UPGRADED DOM HUNTER: Uses innerText to ignore hidden SVGs
const clickTarget = async (
  targetText: string,
  scopeSelector: string,
  maxRetries = 5,
) => {
  for (let i = 0; i < maxRetries; i++) {
    const scope = document.querySelector(scopeSelector);

    if (!scope) {
      console.log(
        `[AgentX] Scope '${scopeSelector}' not found... (${i + 1}/${maxRetries})`,
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

      // CRITICAL FIX: innerText only reads visible text, ignoring hidden SVGs.
      const rawText = htmlEl.innerText || "";

      // Grab the first actual line of text (ignores secondary subtext)
      const primaryText = rawText.split("\n")[0].trim();

      if (primaryText === targetText) {
        const rect = htmlEl.getBoundingClientRect();

        // Ensure it is physically painted on the screen
        if (rect.width > 0 && rect.height > 0) {
          console.log(
            `[AgentX] Found VISIBLE '${targetText}', clicking now...`,
          );
          htmlEl.click();
          return true;
        }
      }
    }

    console.log(
      `[AgentX] '${targetText}' not physically visible yet... (${i + 1}/${maxRetries})`,
    );
    await humanPause(800, 1200);
  }
  return false;
};

// The Ultimate Modal Bypass
const clickModalPrimary = async (maxRetries = 5) => {
  for (let i = 0; i < maxRetries; i++) {
    const modal = document.querySelector(".artdeco-modal");
    if (modal) {
      // Find the main action button
      const primaryBtn = modal.querySelector(
        "button.artdeco-button--primary",
      ) as HTMLElement;

      if (primaryBtn) {
        console.log(
          "[AgentX] ✅ Primary modal button found. Executing note-less send...",
        );
        primaryBtn.click();
        return true;
      }
    }
    console.log(
      `[AgentX] Modal or primary button not ready... (${i + 1}/${maxRetries})`,
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

        // Scope to the top profile card only (Broadened to catch UI variations)
        const TOP_CARD_SCOPE =
          "main > section:first-child, .pv-top-card, .ph5.pb5";

        // 1. Try to find Connect on the top profile card
        let clickedConnect = await clickTarget("Connect", TOP_CARD_SCOPE, 3);

        // 2. If no Connect, pop the More menu
        if (!clickedConnect) {
          console.log("[AgentX] Connect hidden. Opening 'More' menu...");
          const clickedMore = await clickTarget("More", TOP_CARD_SCOPE, 3);

          if (clickedMore) {
            await humanPause(1500, 2500);
            // 3. Hunt for Connect in the open dropdown
            clickedConnect = await clickTarget(
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

        // 4. Execute the brute-force primary modal click
        const modalSuccess = await clickModalPrimary(5);

        if (!modalSuccess) {
          console.warn(
            "[AgentX] ⚠️ Failed to locate the primary send button inside the modal.",
          );
        }
      } catch (error) {
        console.error("[AgentX] Automation failed:", error);
      }
    }
  },
);
