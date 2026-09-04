console.log("[AgentX] Content Script loaded.");

const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:3000";

let frontendHostname = "localhost";
try {
  frontendHostname = new URL(FRONTEND_URL).hostname;
} catch (e) {
  frontendHostname = "localhost";
}

// 1. Sync auth token from web dashboard
if (window.location.hostname === frontendHostname) {
  console.log("[AgentX] Monitoring Dashboard for Auth Token...");
  const syncToken = () => {
    let token = localStorage.getItem("accessToken");
    if (token) {
      token = token.replace(/['"]+/g, "");
      chrome.runtime.sendMessage({
        action: "SAVE_AUTH_TOKEN",
        token: token,
      });
    }
  };

  syncToken();
  setInterval(syncToken, 3000);
}

// 2. Realistic human helper functions
const humanPause = (min = 1500, max = 3500) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const humanScroll = async () => {
  try {
    const scrollDown = Math.floor(Math.random() * 300) + 150;
    window.scrollBy({ top: scrollDown, behavior: "smooth" });
    await humanPause(1500, 2500);
    window.scrollBy({ top: -Math.floor(scrollDown * 0.6), behavior: "smooth" });
    await humanPause(1000, 1800);
  } catch (e) {}
};

const humanType = async (element: HTMLTextAreaElement, text: string) => {
  element.focus();
  element.value = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    element.value += char;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));

    // Human typing cadence: slightly faster on regular chars, slight pause on spaces
    const delay = char === " " || char === "." ? Math.floor(Math.random() * 120) + 80 : Math.floor(Math.random() * 50) + 30;
    await new Promise((r) => setTimeout(r, delay));
  }

  await humanPause(800, 1500);
};

// 3. Robust button finder
const findClickableElement = (
  targetTexts: string[],
  scopeSelector = "main",
): HTMLElement | null => {
  const scope = document.querySelector(scopeSelector) || document.body;
  const elements = Array.from(
    scope.querySelectorAll<HTMLElement>(
      "button, [role='button'], .artdeco-dropdown__item, span, a",
    ),
  );

  for (const targetText of targetTexts) {
    const cleanTarget = targetText.toLowerCase().trim();

    for (const el of elements) {
      const text = (el.innerText || el.textContent || "").toLowerCase().trim();
      const aria = (el.getAttribute("aria-label") || "").toLowerCase().trim();

      const matchText = text === cleanTarget || (text.includes(cleanTarget) && text.length < cleanTarget.length + 20);
      const matchAria = aria === cleanTarget || (aria.includes(cleanTarget) && aria.length < cleanTarget.length + 30);

      if (matchText || matchAria) {
        // Exclude irrelevant buttons like "Connect with..." or "Message" or "Follow"
        if (cleanTarget === "more" && text.includes("show")) continue;

        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (style.display !== "none" && style.visibility !== "hidden" && rect.width > 0) {
          const clickable =
            (el.closest("button, [role='button'], .artdeco-dropdown__item, a") as HTMLElement) || el;
          return clickable;
        }
      }
    }
  }

  return null;
};

// 4. Modal handler with Note support
const handleConnectModal = async (note?: string): Promise<boolean> => {
  for (let attempt = 0; attempt < 8; attempt++) {
    const modal = document.querySelector<HTMLElement>(".artdeco-modal");

    if (modal) {
      console.log("[AgentX] Connect modal detected.");
      await humanPause(1200, 2000);

      // Try to add a personalized note if available
      if (note && note.trim().length > 0) {
        const addNoteBtn = Array.from(modal.querySelectorAll<HTMLElement>("button")).find((b) => {
          const t = (b.innerText || b.textContent || b.getAttribute("aria-label") || "").toLowerCase();
          return t.includes("add a note");
        });

        if (addNoteBtn) {
          console.log("[AgentX] ✍️ Clicking 'Add a note'...");
          addNoteBtn.click();
          await humanPause(1000, 1800);

          const textarea = modal.querySelector<HTMLTextAreaElement>("textarea");
          if (textarea) {
            console.log(`[AgentX] ⌨️ Typing personalized note (${note.length} chars) with human cadence...`);
            // Truncate to 295 chars if necessary to respect LinkedIn 300 char note limit
            const safeNote = note.length > 295 ? note.slice(0, 292) + "..." : note;
            await humanType(textarea, safeNote);
          }
        }
      }

      // Look for send button
      const sendButtons = Array.from(modal.querySelectorAll<HTMLElement>("button"));
      let sendBtn = sendButtons.find((b) => {
        const t = (b.innerText || b.textContent || b.getAttribute("aria-label") || "").toLowerCase();
        return t === "send" || t.includes("send now") || t.includes("send without a note") || t.includes("send invitation");
      });

      if (sendBtn) {
        console.log("[AgentX] 🚀 Clicking Send button:", sendBtn.innerText || sendBtn.getAttribute("aria-label"));
        sendBtn.click();

        // Wait for modal to dismiss
        for (let check = 0; check < 5; check++) {
          await humanPause(800, 1200);
          if (!document.querySelector(".artdeco-modal")) {
            console.log("[AgentX] ✅ Modal closed. Invitation dispatched successfully.");
            return true;
          }
          sendBtn.click();
        }
        return true;
      }
    }

    await humanPause(1000, 1500);
  }

  return false;
};

// 5. Message listener from Background Script
chrome.runtime.onMessage.addListener(async (request: any) => {
  if (request.action === "EXECUTE_CONNECT") {
    console.log("[AgentX] 🤖 Initiating human connection sequence for:", request.name || "Target");
    let succeeded = false;

    try {
      // Step A: Human warm-up pause and page exploration
      await humanPause(2500, 4000);
      await humanScroll();

      // Step B: Search for Connect button
      let connectBtn = findClickableElement(["connect", "invite to connect"], "main");

      if (!connectBtn) {
        console.log("[AgentX] Connect not visible in primary actions. Checking 'More' dropdown...");
        const moreBtn = findClickableElement(["more", "more actions"], "main");

        if (moreBtn) {
          moreBtn.click();
          await humanPause(1200, 2000);
          connectBtn = findClickableElement(["connect"], ".artdeco-dropdown__content--is-open, .artdeco-dropdown");
        }
      }

      if (!connectBtn) {
        console.log("[AgentX] ℹ️ Profile cannot be connected to (already connected, pending, or restricted).");
      } else {
        console.log("[AgentX] Found Connect button. Clicking with human pause...");
        await humanPause(800, 1600);
        connectBtn.click();

        // Step C: Handle the connection modal (with personalized note or direct send)
        succeeded = await handleConnectModal(request.note);
      }
    } catch (err) {
      console.error("[AgentX] Error during connect execution:", err);
    }

    // Step D: Report back to background script to close tab and manage human pacing
    await humanPause(1500, 2500);
    chrome.runtime.sendMessage({
      action: "CONNECT_COMPLETED",
      success: succeeded,
    });
  }
});
