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
  const opts = { bubbles: true, cancelable: true, view: window };
  btn.dispatchEvent(new MouseEvent("mousedown", opts));
  btn.dispatchEvent(new MouseEvent("mouseup", opts));
  btn.click();
};

// --- THE "SEND WITH NOTE" EXECUTION FLOW ---
const executeSendWithNote = async (noteText: string, maxRetries = 10) => {
  for (let i = 0; i < maxRetries; i++) {
    const modals = document.querySelectorAll(".artdeco-modal");

    for (const m of Array.from(modals)) {
      const modal = m as HTMLElement;

      // Ensure this is the active, visible modal
      if (modal.getBoundingClientRect().width > 0) {
        // Step 1: Find and click "Add a note"
        const addNoteBtn = modal.querySelector(
          "button[aria-label='Add a note']",
        ) as HTMLElement;

        if (addNoteBtn && addNoteBtn.getBoundingClientRect().width > 0) {
          console.log(
            "[AgentX] ✅ Found 'Add a note'. Letting animation settle...",
          );
          await humanPause(800, 1200);
          clickEmberButton(addNoteBtn);

          // Step 2: Wait for Text Area to slide down
          console.log("[AgentX] Waiting for text box...");
          await humanPause(1500, 2000);
          const textarea = modal.querySelector(
            "textarea[name='message'], textarea#custom-message",
          ) as HTMLTextAreaElement;

          if (textarea) {
            console.log("[AgentX] ✅ Textbox found. Injecting AI Note...");

            // Fallback note just in case the queue didn't pass one
            const finalNote =
              noteText ||
              "Hi, I'd love to connect and learn more about your work!";

            textarea.value = finalNote;

            // Step 3: Trick React into unlocking the Send button
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
            textarea.dispatchEvent(new Event("change", { bubbles: true }));

            await humanPause(1000, 1500);

            // Step 4: Find and click the final 'Send' button
            const sendBtn = modal.querySelector(
              "button.artdeco-button--primary",
            ) as HTMLButtonElement;

            if (sendBtn && !sendBtn.disabled) {
              console.log("[AgentX] 💥 Firing final Ember Send...");
              clickEmberButton(sendBtn);
              return true;
            } else {
              console.warn(
                "[AgentX] ⚠️ Send button is still disabled or missing.",
              );
            }
          }
        }
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

        // Execute the Add Note sequence with the payload from your backend
        const modalSuccess = await executeSendWithNote(request.note, 10);

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
