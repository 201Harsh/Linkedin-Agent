console.log("[AgentX] Content Script injected successfully!");

// --- 1. THE DIRECT DOM TAP (Runs on localhost:3000) ---
if (window.location.hostname === "localhost") {
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

// --- 2. RANDOMIZED HUMAN DELAY GENERATOR ---
const humanPause = (min = 3000, max = 6000) => {
  // Generates a random delay between min and max milliseconds
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(`[AgentX] 🤖 Human pause: waiting ${ms}ms...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// --- 3. THE LINKEDIN AUTOMATION (Runs on linkedin.com) ---
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
        // Step 1: Wait for the page to fully render like a human reading the profile
        await humanPause(2000, 4000);

        // Step 2: Find the main 'Connect' button (Strictly inside the main profile area, ignoring sidebars)
        const mainArea = document.querySelector("main") || document.body;
        const buttons = Array.from(mainArea.querySelectorAll("button"));

        // Look for the exact "Connect" text
        const connectBtn = buttons.find(
          (btn) => btn.innerText.trim() === "Connect",
        );

        if (!connectBtn) {
          console.warn(
            "[AgentX] Connect button not found! They might be a 3rd degree connection or already connected.",
          );
          return;
        }

        console.log("[AgentX] Found Connect button. Clicking...");
        connectBtn.click();

        // Step 3: Wait for the modal to pop up and load
        await humanPause(3000, 5000);

        // Step 4: Click 'Add a note'
        const modalButtons = Array.from(document.querySelectorAll("button"));
        const addNoteBtn = modalButtons.find((btn) =>
          btn.innerText.includes("Add a note"),
        );

        if (addNoteBtn) {
          console.log("[AgentX] Clicking Add Note...");
          addNoteBtn.click();
          await humanPause(2000, 3500);
        }

        // Step 5: Type the personalized message
        const textarea = document.querySelector(
          'textarea[name="message"], textarea#custom-message',
        ) as HTMLTextAreaElement;
        if (textarea) {
          console.log("[AgentX] Typing personalized message...");
          textarea.value = request.note;

          // Dispatch React events so LinkedIn knows we typed
          textarea.dispatchEvent(new Event("input", { bubbles: true }));

          // Wait like a human re-reading their message before sending
          await humanPause(4000, 7000);

          // Step 6: Click Send (LIVE EXECUTION)
          const finalButtons = Array.from(document.querySelectorAll("button"));
          const sendBtn = finalButtons.find(
            (btn) => btn.innerText.trim() === "Send",
          );

          if (sendBtn) {
            console.log("[AgentX] Clicking Send!");
            sendBtn.click();
            console.log("[AgentX] ✅ Target successfully engaged.");
          } else {
            console.warn("[AgentX] Send button not found.");
          }
        }
      } catch (error) {
        console.error("[AgentX] Automation failed:", error);
      }
    }
  },
);
