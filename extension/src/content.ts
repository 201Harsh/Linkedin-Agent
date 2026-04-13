console.log("[AgentX] Content Script injected successfully!");

const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:3000";
const frontendHostname = new URL(FRONTEND_URL).hostname;

if (window.location.hostname === frontendHostname) {
  console.log("[AgentX] Monitoring Dashboard for Auth Token...");

  // THE KILL SWITCH: If the extension reloads, this stops the ERR_FAILED spam.
  const syncInterval = setInterval(() => {
    try {
      let token = localStorage.getItem("accessToken");
      if (token) {
        token = token.replace(/['"]+/g, "");
        chrome.runtime.sendMessage(
          { action: "SAVE_AUTH_TOKEN", token: token },
          (response) => {
            // If Chrome throws an "invalid context" error, kill the loop immediately
            if (chrome.runtime.lastError) {
              console.warn(
                "[AgentX] Extension reloaded. Killing zombie background loop.",
              );
              clearInterval(syncInterval);
            }
          },
        );
      }
    } catch (err) {
      console.warn("[AgentX] Context invalidated. Shutting down loop.");
      clearInterval(syncInterval);
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

// --- THE HAMMER LOOP ---
const hammerButton = async (btn: HTMLElement) => {
  const span = btn.querySelector("span");

  for (let i = 0; i < 6; i++) {
    // If the button is completely gone or its width is 0, it means it successfully clicked!
    const rect = btn.getBoundingClientRect();
    if (
      rect.width === 0 ||
      rect.height === 0 ||
      !document.querySelector(".artdeco-modal")
    ) {
      console.log("[AgentX] ✅ Modal vanished. Connection sent successfully.");
      return true;
    }

    console.log(`[AgentX] 🔨 Hammer strike ${i + 1}...`);

    if (span) span.click();
    btn.click();

    await humanPause(800, 1200);
  }
  return false;
};

// --- STRICT NOTE-LESS SENDER ---
const executeNoteLessSend = async (maxRetries = 10) => {
  for (let i = 0; i < maxRetries; i++) {
    // Only grab the modal that is currently visible on the screen
    const modals = Array.from(document.querySelectorAll(".artdeco-modal"));
    const activeModal = modals.find((m) => m.getBoundingClientRect().width > 0);

    if (activeModal) {
      let sendBtn = activeModal.querySelector(
        "button[aria-label='Send without a note']",
      ) as HTMLElement;

      if (!sendBtn) {
        sendBtn = Array.from(activeModal.querySelectorAll("button")).find((b) =>
          (b.textContent || "").toLowerCase().includes("send without a note"),
        ) as HTMLElement;
      }

      if (sendBtn && sendBtn.getBoundingClientRect().width > 0) {
        console.log(
          "[AgentX] ✅ Found 'Send without a note' button. Letting animation finish...",
        );
        await humanPause(1500, 2000);

        await hammerButton(sendBtn);
        return true;
      }
    }

    console.log(
      `[AgentX] Waiting for modal buttons to render... (${i + 1}/${maxRetries})`,
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

// --- API-FREE TESTING HOTKEY ---
window.addEventListener("message", (event) => {
  if (event.data && event.data.action === "TEST_CONNECT") {
    console.log("[AgentX] 🚨 MANUAL TEST INITIATED VIA CONSOLE 🚨");
    // Trigger the flow manually
    window.postMessage({ action: "EXECUTE_CONNECT" }, "*");
  }
});
