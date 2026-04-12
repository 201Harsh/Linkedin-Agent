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

// THE BOMB v3: Pointer Events + Coordinate Targeting + Internal Nuke
const forceClick = async (el: HTMLElement) => {
  try {
    el.focus();

    // Grab exact screen coordinates
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Construct a highly realistic hardware pointer event
    const eventParams = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
      pointerId: 1,
      pointerType: "mouse",
    };

    el.dispatchEvent(new PointerEvent("pointerenter", eventParams));
    el.dispatchEvent(new MouseEvent("mouseenter", eventParams));
    el.dispatchEvent(new PointerEvent("pointerover", eventParams));
    el.dispatchEvent(new MouseEvent("mouseover", eventParams));
    el.dispatchEvent(new PointerEvent("pointerdown", eventParams));
    el.dispatchEvent(new MouseEvent("mousedown", eventParams));

    // Standard trigger
    el.click();

    // Deep strike: find every span, icon, or SVG inside this button and click them all simultaneously
    const internalElements = el.querySelectorAll("*");
    internalElements.forEach((child) => {
      (child as HTMLElement).click();
    });

    el.dispatchEvent(new PointerEvent("pointerup", eventParams));
    el.dispatchEvent(new MouseEvent("mouseup", eventParams));
    el.dispatchEvent(new MouseEvent("click", eventParams));

    console.log("[AgentX] 💥 Coordinate Pointer-Strike dispatched.");
  } catch (error) {
    console.error("[AgentX] Force click failed:", error);
  }
};

// THE SNIPER DOM HUNTER: Skips massive wrappers, targets leaf nodes
const clickTarget = async (
  targetText: string,
  scopeSelector: string,
  maxRetries = 5,
) => {
  for (let i = 0; i < maxRetries; i++) {
    const scope = document.querySelector(scopeSelector) || document.body;

    // Broadened scope to catch whatever random list-item format LinkedIn is using today
    const elements = Array.from(
      scope.querySelectorAll(
        'button, [role="button"], .artdeco-dropdown__item, li, span.display-flex',
      ),
    );

    for (const el of elements) {
      const htmlEl = el as HTMLElement;

      const ariaLabel = (htmlEl.getAttribute("aria-label") || "").toLowerCase();
      const rawText = (htmlEl.textContent || "").toLowerCase();

      const strippedText = rawText.replace(/[^a-z]/g, "");
      const cleanTarget = targetText.toLowerCase().replace(/[^a-z]/g, "");

      if (
        ariaLabel.includes(targetText.toLowerCase()) ||
        strippedText.includes(cleanTarget)
      ) {
        // THE FIX: If the element has a massive amount of text, it's a wrapper container (like the whole dropdown menu). Skip it.
        if (strippedText.length > cleanTarget.length + 30) {
          continue;
        }

        // Prevent clicking "Show more" in about section
        if (
          targetText === "More" &&
          (ariaLabel.includes("show") || strippedText.includes("showmore"))
        ) {
          continue;
        }

        const rect = htmlEl.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0) {
          console.log(
            `[AgentX] 🎯 Locked onto exact '${targetText}' element. Executing pointer-strike...`,
          );
          await forceClick(htmlEl);
          return true;
        }
      }
    }

    console.log(
      `[AgentX] Hunting for '${targetText}'... (${i + 1}/${maxRetries})`,
    );
    await humanPause(1000, 1500);
  }
  return false;
};

// The Note-Less Modal Bypass
const executeNoteLessSend = async (maxRetries = 5) => {
  for (let i = 0; i < maxRetries; i++) {
    const modal = document.querySelector(".artdeco-modal");
    if (modal) {
      const ariaBtn = modal.querySelector(
        "button[aria-label='Send without a note']",
      ) as HTMLElement;
      if (ariaBtn) {
        console.log("[AgentX] ✅ Note-less send triggered via aria-label.");
        await forceClick(ariaBtn);
        return true;
      }

      const primaryBtn = modal.querySelector(
        "button.artdeco-button--primary",
      ) as HTMLElement;
      if (primaryBtn) {
        console.log(
          "[AgentX] ✅ Note-less send triggered via primary button fallback.",
        );
        await forceClick(primaryBtn);
        return true;
      }
    }
    console.log(`[AgentX] Waiting for modal... (${i + 1}/${maxRetries})`);
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
        await humanPause(3500, 5000);

        const MAIN_SCOPE = ".ph5.pb5, .pv-top-card, main > section:first-child";

        let clickedConnect = await clickTarget("Connect", MAIN_SCOPE, 4);

        if (!clickedConnect) {
          console.log(
            "[AgentX] Primary Connect not found. Deploying 'More' menu strategy...",
          );
          const clickedMore = await clickTarget("More", MAIN_SCOPE, 3);

          if (clickedMore) {
            await humanPause(2000, 3000);
            // Target the open dropdown specifically
            clickedConnect = await clickTarget(
              "Connect",
              ".artdeco-dropdown__content--is-open",
              5,
            );
          }
        }

        if (!clickedConnect) {
          console.warn(
            "[AgentX] ⚠️ Target is locked down. Cannot connect. Aborting.",
          );
          return;
        }

        console.log("[AgentX] Waiting for connection modal...");
        await humanPause(2500, 4000);

        const modalSuccess = await executeNoteLessSend(5);

        if (!modalSuccess) {
          console.warn("[AgentX] ⚠️ Failed to click send inside the modal.");
        } else {
          console.log("[AgentX] 🚀 SEQUENCE COMPLETE.");
        }
      } catch (error) {
        console.error("[AgentX] Fatal runtime error:", error);
      }
    }
  },
);
