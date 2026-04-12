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

// Your exact working DOM hunter
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
          clickable.click(); // Safe, standard click
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

// --- THE FIX: VERIFICATION LOOP FOR THE MODAL ---
const executeNoteLessSend = async (maxRetries = 7) => {
  for (let i = 0; i < maxRetries; i++) {
    const modal = document.querySelector(".artdeco-modal");

    if (!modal) {
      console.log(
        `[AgentX] Waiting for modal to render... (${i + 1}/${maxRetries})`,
      );
      await humanPause(1000, 1500);
      continue;
    }

    // Try finding the button via Aria Label or Primary Class
    let sendBtn = modal.querySelector(
      "button[aria-label='Send without a note']",
    ) as HTMLButtonElement;

    if (!sendBtn) {
      // Fallback to searching the spans if aria-label is missing
      const spans = Array.from(
        modal.querySelectorAll("span.artdeco-button__text"),
      );
      for (const span of spans) {
        if (
          (span.textContent || "").trim().toLowerCase() ===
          "send without a note"
        ) {
          sendBtn = span.closest("button") as HTMLButtonElement;
          break;
        }
      }
    }

    if (!sendBtn) {
      // Final fallback: just grab the primary blue button
      sendBtn = modal.querySelector(
        "button.artdeco-button--primary",
      ) as HTMLButtonElement;
    }

    // If we found the button, ensure it's fully loaded and click it
    if (sendBtn && sendBtn.getBoundingClientRect().width > 0) {
      // LinkedIn sometimes disables the button for a split second while opening
      if (sendBtn.disabled) {
        console.log("[AgentX] Button is currently disabled, waiting...");
        await humanPause(800, 1200);
        continue;
      }

      console.log("[AgentX] ✅ Found Send button. Executing click...");
      sendBtn.click();

      // VERIFICATION: Did the click actually work?
      await humanPause(1500, 2000);
      if (!document.querySelector(".artdeco-modal")) {
        console.log("[AgentX] ✅ Modal successfully closed. Send confirmed.");
        return true;
      } else {
        console.warn("[AgentX] ⚠️ Click ignored by LinkedIn. Retrying...");
        // Loop will naturally continue and click it again
      }
    } else {
      console.log(
        `[AgentX] Waiting for buttons inside modal... (${i + 1}/${maxRetries})`,
      );
    }

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

        const modalSuccess = await executeNoteLessSend(7);

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
