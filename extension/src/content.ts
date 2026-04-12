console.log("[AgentX] Content Script injected successfully!");

const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:3000";
const frontendHostname = new URL(FRONTEND_URL).hostname;

// Token Sync Engine
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

// THE ULTIMATE DOM HUNTER: Uses broad inclusion to bypass SVG traps
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
      const textContent = (htmlEl.textContent || "").trim();

      // If the text explicitly includes our target (e.g. "Connect" is inside "Connect icon Connect")
      if (
        textContent === targetText ||
        textContent.includes(`\n${targetText}`) ||
        textContent.includes(`${targetText}\n`)
      ) {
        const rect = htmlEl.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0) {
          console.log(`[AgentX] Found VISIBLE '${targetText}', clicking...`);
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

// The Modal Bypass: Explicitly hunts for 'Send without a note' via Aria-Labels or Primary Classes
const executeNoteLessSend = async (maxRetries = 5) => {
  for (let i = 0; i < maxRetries; i++) {
    const modal = document.querySelector(".artdeco-modal");
    if (modal) {
      // Strategy 1: Look for the explicit aria-label (Most reliable for free accounts)
      const ariaBtn = modal.querySelector(
        "button[aria-label='Send without a note']",
      ) as HTMLElement;
      if (ariaBtn) {
        console.log(
          "[AgentX] ✅ Found 'Send without a note' via aria-label. Clicking...",
        );
        ariaBtn.click();
        return true;
      }

      // Strategy 2: Look for a button that literally says "Send without a note"
      const allButtons = Array.from(modal.querySelectorAll("button"));
      for (const btn of allButtons) {
        if ((btn.textContent || "").includes("Send without a note")) {
          console.log(
            "[AgentX] ✅ Found 'Send without a note' via text. Clicking...",
          );
          btn.click();
          return true;
        }
      }

      // Strategy 3: Just hit the primary button (Fallback)
      const primaryBtn = modal.querySelector(
        "button.artdeco-button--primary",
      ) as HTMLElement;
      if (primaryBtn) {
        console.log("[AgentX] ✅ Hitting primary modal button as fallback...");
        primaryBtn.click();
        return true;
      }
    }
    console.log(
      `[AgentX] Waiting for modal buttons to render... (${i + 1}/${maxRetries})`,
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

        // Scope to the top profile card only
        const TOP_CARD_SCOPE =
          "main > section:first-child, .pv-top-card, .ph5.pb5";

        // 1. Check for Connect button
        let clickedConnect = await clickTarget("Connect", TOP_CARD_SCOPE, 3);

        // 2. If blocked by 'Follow', hit 'More'
        if (!clickedConnect) {
          console.log(
            "[AgentX] Connect hidden by Follow. Opening 'More' menu...",
          );
          const clickedMore = await clickTarget("More", TOP_CARD_SCOPE, 3);

          if (clickedMore) {
            await humanPause(1500, 2500);
            // 3. Hunt for Connect inside the dropdown
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

        // 4. Force the Note-less send
        const modalSuccess = await executeNoteLessSend(5);

        if (!modalSuccess) {
          console.warn(
            "[AgentX] ⚠️ Failed to locate the send button inside the modal.",
          );
        }
      } catch (error) {
        console.error("[AgentX] Automation failed:", error);
      }
    }
  },
);
