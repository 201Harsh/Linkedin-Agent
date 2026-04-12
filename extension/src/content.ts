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

// --- YOUR WORKING DOM HUNTER (Untouched) ---
const clickTarget = async (
  targetText: string,
  scopeSelector: string,
  maxRetries = 5,
) => {
  const cleanTarget = targetText.toLowerCase();

  for (let i = 0; i < maxRetries; i++) {
    const scope = document.querySelector(scopeSelector) || document.body;
    const elements = Array.from(
      scope.querySelectorAll(
        "button, [role='button'], .artdeco-dropdown__item, span, a",
      ),
    );

    for (const el of elements) {
      const htmlEl = el as HTMLElement;
      const text = (htmlEl.innerText || htmlEl.textContent || "").toLowerCase();
      const aria = (htmlEl.getAttribute("aria-label") || "").toLowerCase();

      if (
        text.includes(cleanTarget) ||
        (cleanTarget === "connect" &&
          aria.includes("invite") &&
          aria.includes("connect"))
      ) {
        if (text.length > cleanTarget.length + 30) continue;
        if (cleanTarget === "more" && text.includes("show")) continue;

        const style = window.getComputedStyle(htmlEl);
        const rect = htmlEl.getBoundingClientRect();

        if (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0
        ) {
          const clickable =
            (htmlEl.closest(
              "button, [role='button'], .artdeco-dropdown__item, a",
            ) as HTMLElement) || htmlEl;
          console.log(`[AgentX] Found '${text || aria}', clicking now...`);
          clickable.click();
          return true;
        }
      }
    }
    console.log(
      `[AgentX] '${targetText}' not found yet, retrying... (${i + 1}/${maxRetries})`,
    );
    await humanPause(800, 1200);
  }
  return false;
};

// --- THE EMBER.JS BUTTON BYPASS ---
const clickEmberButton = (btn: HTMLElement) => {
  // Ember requires this exact sequence to register a physical click
  const opts = { bubbles: true, cancelable: true, view: window };
  btn.dispatchEvent(new MouseEvent("mousedown", opts));
  btn.dispatchEvent(new MouseEvent("mouseup", opts));
  btn.click();
};

// --- THE STRICT "SEND WITHOUT NOTE" HANDLER ---
const executeNoteLessSend = async (maxRetries = 10) => {
  for (let i = 0; i < maxRetries; i++) {
    // Look at all modals in case LinkedIn leaves a hidden ghost modal in the DOM
    const modals = document.querySelectorAll(".artdeco-modal");

    for (const m of Array.from(modals)) {
      const modal = m as HTMLElement;

      // Ensure this is the active, visible modal
      if (modal.getBoundingClientRect().width > 0) {
        // Target the EXACT aria-label from your provided HTML snippet
        const sendBtn = modal.querySelector(
          "button[aria-label='Send without a note']",
        ) as HTMLElement;

        if (sendBtn && sendBtn.getBoundingClientRect().width > 0) {
          console.log(
            "[AgentX] ✅ Found 'Send without a note'. Letting animation settle...",
          );

          // Wait 1 second for the slide-up animation to completely finish
          await humanPause(800, 1200);

          console.log("[AgentX] 💥 Firing Ember-safe click...");
          clickEmberButton(sendBtn);

          return true;
        }
      }
    }

    console.log(
      `[AgentX] Waiting for Send button to appear... (${i + 1}/${maxRetries})`,
    );
    await humanPause(1000, 1500);
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
        await humanPause(3000, 4500);

        let clickedConnect = await clickTarget("Connect", "main", 3);

        if (!clickedConnect) {
          console.log("[AgentX] Connect hidden. Opening 'More' menu...");
          const clickedMore = await clickTarget("More", "main", 3);

          if (clickedMore) {
            await humanPause(1500, 2500);
            clickedConnect = await clickTarget(
              "Connect",
              ".artdeco-dropdown__content--is-open",
              5,
            );
          }
        }

        if (!clickedConnect) {
          console.warn("[AgentX] ⚠️ Connect completely locked out. Moving on.");
          return;
        }

        console.log("[AgentX] Waiting for modal to appear...");
        await humanPause(2000, 3500);

        // Forces the "Send Without Note" execution
        const modalSuccess = await executeNoteLessSend(10);

        if (!modalSuccess) {
          console.warn("[AgentX] ⚠️ Failed to click send inside the modal.");
        } else {
          console.log("[AgentX] 🚀 SEQUENCE COMPLETE.");
        }
      } catch (error) {
        console.error("[AgentX] Automation failed:", error);
      }
    }
  },
);
