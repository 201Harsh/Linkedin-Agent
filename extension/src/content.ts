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

// --- YOUR WORKING DOM HUNTER ---
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

// --- THE DIAGNOSTIC MODAL SENDER ---
const executeNoteLessSend = async (maxRetries = 10) => {
  for (let i = 0; i < maxRetries; i++) {
    const modals = Array.from(document.querySelectorAll(".artdeco-modal"));
    const activeModal = modals.find((m) => m.getBoundingClientRect().width > 0);

    if (activeModal) {
      let sendBtn = activeModal.querySelector(
        "button[aria-label='Send without a note']",
      ) as HTMLButtonElement;

      if (!sendBtn) {
        sendBtn = Array.from(activeModal.querySelectorAll("button")).find((b) =>
          (b.textContent || "").toLowerCase().includes("send without a note"),
        ) as HTMLButtonElement;
      }

      if (sendBtn && sendBtn.getBoundingClientRect().width > 0) {
        console.log("\n--------------------------------------------------");
        console.log("[DEBUG] ✅ ACTIVE 'SEND' BUTTON LOCATED!");
        console.log(`[DEBUG] Disabled State: ${sendBtn.disabled}`);
        console.log(`[DEBUG] Classes: ${sendBtn.className}`);
        console.log(`[DEBUG] HTML: ${sendBtn.outerHTML}`);
        console.log("--------------------------------------------------\n");

        await humanPause(1500, 2000); // Let UI freeze

        // THE SPY LISTENER
        sendBtn.addEventListener("click", (e) => {
          console.log(
            `🚨 [DEBUG SPY] CLICK EVENT TRIGGERED! (isTrusted: ${e.isTrusted})`,
          );
        });

        console.log("[DEBUG] 💥 FIRING CLICK COMMANDS NOW...");

        try {
          const span = sendBtn.querySelector("span");
          if (span) {
            console.log("[DEBUG] -> Clicking inner span...");
            span.click();
          }
          console.log("[DEBUG] -> Clicking outer button...");
          sendBtn.click();
          console.log("[DEBUG] -> Javascript executed without crashing.");
        } catch (err) {
          console.error(
            "❌ [FATAL DEBUG] JAVASCRIPT CRASHED DURING CLICK:",
            err,
          );
        }

        console.log("[DEBUG] Waiting 2 seconds to see if modal closes...");
        await humanPause(2000, 2500);

        const rectAfter = sendBtn.getBoundingClientRect();
        if (
          rectAfter.width === 0 ||
          !document.querySelector(".artdeco-modal")
        ) {
          console.log("[DEBUG] ✅ MODAL VANISHED. CONNECTION SENT.");
          return true;
        } else {
          console.warn(
            "❌ [FATAL DEBUG] MODAL IS STILL OPEN. LINKEDIN IGNORED THE CLICK.",
          );
          // We return true here just to stop the loop from spamming for debugging purposes
          return true;
        }
      }
    }

    console.log(
      `[AgentX] Waiting for active modal buttons to render... (${i + 1}/${maxRetries})`,
    );
    await humanPause(1000, 1500);
  }
  return false;
};

// --- THE MASTER SEQUENCE ---
const runConnectionSequence = async () => {
  console.log("[AgentX] Initiating Autonomous Connection Sequence...");
  try {
    await humanPause(2000, 3000);

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
      console.warn(
        "[AgentX] ⚠️ Connect button is completely locked out. Moving on.",
      );
      return;
    }

    console.log("[AgentX] Waiting for modal to appear...");
    await humanPause(2000, 3500);

    await executeNoteLessSend(10);
  } catch (error) {
    console.error("[AgentX] Automation failed:", error);
  }
};

// --- API-FREE TESTING HOTKEY (CTRL + SHIFT + Y) ---
document.addEventListener("keydown", (e) => {
  // Press Ctrl + Shift + Y to trigger the bot manually
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "y") {
    console.log("[AgentX] 🚨 MANUAL OVERRIDE TRIGGERED VIA HOTKEY 🚨");
    runConnectionSequence();
  }
});

chrome.runtime.onMessage.addListener(
  (request: any, _sender: any, sendResponse: any) => {
    if (request.action === "PING_DOM") {
      const name = document
        .querySelector(".text-heading-xlarge")
        ?.textContent?.trim();
      sendResponse({ name });
    }

    if (request.action === "EXECUTE_CONNECT") {
      runConnectionSequence();
    }
  },
);
