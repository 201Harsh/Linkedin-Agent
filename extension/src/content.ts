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

      // Matches "+ Connect", "Connect", or the dropdown aria-label
      if (
        text.includes(cleanTarget) ||
        (cleanTarget === "connect" &&
          aria.includes("invite") &&
          aria.includes("connect"))
      ) {
        // Skip massive wrapper containers
        if (text.length > cleanTarget.length + 30) continue;
        // Skip the "Show more" button
        if (cleanTarget === "more" && text.includes("show")) continue;

        const style = window.getComputedStyle(htmlEl);
        const rect = htmlEl.getBoundingClientRect();

        // Ensure it is visible
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
          clickable.click(); // Back to safe, standard click
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

// --- NEW: PUNCHES THROUGH REACT MODAL EVENT BLOCKERS ---
const forceModalClick = (el: HTMLElement) => {
  try {
    el.focus();
    const eventObj = { bubbles: true, cancelable: true, view: window };
    el.dispatchEvent(new MouseEvent("mousedown", eventObj));
    el.dispatchEvent(new MouseEvent("mouseup", eventObj));
    el.click();
    console.log("[AgentX] 💥 Forced click dispatched on modal button.");
  } catch (e) {
    console.error("[AgentX] Forced click failed:", e);
  }
};

// --- UPGRADED MODAL BYPASS ---
const executeNoteLessSend = async (maxRetries = 7) => {
  for (let i = 0; i < maxRetries; i++) {
    // Strategy 1: Global search for the exact aria-label
    const ariaBtn = document.querySelector(
      "button[aria-label='Send without a note']",
    ) as HTMLElement;

    if (ariaBtn && ariaBtn.getBoundingClientRect().width > 0) {
      console.log(
        "[AgentX] ✅ Found 'Send without a note' via aria-label. Waiting for animation to settle...",
      );
      await humanPause(800, 1000); // CRITICAL: Let the fade-in animation finish
      forceModalClick(ariaBtn);
      return true;
    }

    // Strategy 2: Global search for the exact span text
    const spans = Array.from(
      document.querySelectorAll("span.artdeco-button__text"),
    );
    for (const span of spans) {
      const text = (span.textContent || "").trim().toLowerCase();
      if (text === "send without a note") {
        const spanRect = span.getBoundingClientRect();
        if (spanRect.width > 0) {
          console.log(
            "[AgentX] ✅ Found send button via span text. Waiting for animation to settle...",
          );
          await humanPause(800, 1200); // CRITICAL: Let the fade-in animation finish
          const parentBtn = span.closest("button") as HTMLElement;
          forceModalClick(parentBtn || (span as HTMLElement));
          return true;
        }
      }
    }

    // Strategy 3: Primary button fallback
    const modal = document.querySelector(".artdeco-modal");
    if (modal) {
      const primaryBtn = modal.querySelector(
        "button.artdeco-button--primary",
      ) as HTMLElement;
      if (primaryBtn && primaryBtn.getBoundingClientRect().width > 0) {
        console.log(
          "[AgentX] ✅ Found primary send button fallback. Waiting for animation to settle...",
        );
        await humanPause(800, 1200);
        forceModalClick(primaryBtn);
        return true;
      }
    }

    console.log(
      `[AgentX] Waiting for modal buttons... (${i + 1}/${maxRetries})`,
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

        // Using "main" as the scope, just like your old code
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

        const modalSuccess = await executeNoteLessSend(5);

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
