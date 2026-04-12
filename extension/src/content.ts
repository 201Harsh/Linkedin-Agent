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

// --- YOUR ORIGINAL HOMING MISSILE (UNTOUCHED) ---
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

// --- THE KEYBOARD STRIKE (BYPASSES MOUSE BLOCKERS) ---
const executeKeyboardSend = async (maxRetries = 8) => {
  for (let i = 0; i < maxRetries; i++) {
    const modal = document.querySelector(".artdeco-modal");

    if (modal) {
      // Find the "Send without a note" button using Aria-Label or Text
      let sendBtn = modal.querySelector(
        "button[aria-label='Send without a note']",
      ) as HTMLElement;

      if (!sendBtn) {
        const buttons = Array.from(modal.querySelectorAll("button"));
        sendBtn = buttons.find((b) =>
          (b.textContent || "").toLowerCase().includes("send without a note"),
        ) as HTMLElement;
      }

      if (sendBtn) {
        console.log(
          "[AgentX] Found 'Send without a note'. Waiting 1.5s for UI to freeze...",
        );
        await humanPause(1500, 2000);

        console.log("[AgentX] Executing Keyboard Strike...");

        // 1. Physically focus the button (like hitting the Tab key)
        sendBtn.focus();

        // 2. Try a normal click just in case
        sendBtn.click();

        // 3. THE NUKE: Fire a raw 'Enter' keypress directly into the focused button
        const enterDown = new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: "Enter",
          code: "Enter",
          keyCode: 13,
        });
        const enterUp = new KeyboardEvent("keyup", {
          bubbles: true,
          cancelable: true,
          key: "Enter",
          code: "Enter",
          keyCode: 13,
        });

        sendBtn.dispatchEvent(enterDown);
        sendBtn.dispatchEvent(enterUp);

        console.log("[AgentX] 💥 Keyboard Enter dispatched.");
        return true;
      }
    }
    console.log(`[AgentX] Waiting for modal... (${i + 1}/${maxRetries})`);
    await humanPause(1000, 1500);
  }
  return false;
};

// --- THE MASTER EXECUTION SEQUENCE ---
const runConnectionSequence = async () => {
  console.log("[AgentX] Initiating Autonomous Connection Sequence...");
  try {
    await humanPause(2000, 3000);

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

    const clickedSendWithoutNote = await executeKeyboardSend(8);

    if (clickedSendWithoutNote) {
      console.log("[AgentX] ✅ Target successfully engaged.");
    } else {
      console.warn(
        "[AgentX] ⚠️ Could not find or click the send button in the modal.",
      );
    }
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

// Standard Backend Listener
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
