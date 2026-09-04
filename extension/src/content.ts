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
  setInterval(syncToken, 2500);
}

// 2. Fast human pauses (responsive, not sluggish)
const humanPause = (min = 600, max = 1400) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const humanScroll = async () => {
  try {
    const scrollDown = Math.floor(Math.random() * 250) + 150;
    window.scrollBy({ top: scrollDown, behavior: "smooth" });
    await humanPause(400, 700);
    window.scrollBy({ top: -scrollDown, behavior: "smooth" });
    await humanPause(300, 600);
  } catch (e) {}
};

// 3. Robust real-click simulator (fires complete React/DOM event cycle)
const simulateRealClick = (el: HTMLElement) => {
  const innerSpan = (el.querySelector("span") as HTMLElement) || el;
  const rect = el.getBoundingClientRect();
  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height / 2;

  const eventOpts: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX,
    clientY,
  };

  try {
    el.dispatchEvent(new PointerEvent("pointerdown", eventOpts));
    el.dispatchEvent(new MouseEvent("mousedown", eventOpts));
    innerSpan.dispatchEvent(new MouseEvent("mousedown", eventOpts));

    el.dispatchEvent(new PointerEvent("pointerup", eventOpts));
    el.dispatchEvent(new MouseEvent("mouseup", eventOpts));
    innerSpan.dispatchEvent(new MouseEvent("mouseup", eventOpts));

    el.dispatchEvent(new MouseEvent("click", eventOpts));
    innerSpan.dispatchEvent(new MouseEvent("click", eventOpts));
  } catch (e) {}

  el.click();
  if (innerSpan !== el) {
    innerSpan.click();
  }
};

const humanType = async (element: HTMLTextAreaElement, text: string) => {
  element.focus();
  element.value = "";

  for (let i = 0; i < text.length; i++) {
    element.value += text[i];
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 25) + 15));
  }

  await humanPause(300, 600);
};

// 4. Find button by text or aria-label
const findButton = (
  targetTexts: string[],
  scopeSelector = "main",
): HTMLElement | null => {
  const scope = document.querySelector(scopeSelector) || document.body;
  const elements = Array.from(
    scope.querySelectorAll<HTMLElement>(
      "button, [role='button'], .artdeco-dropdown__item, a",
    ),
  );

  for (const targetText of targetTexts) {
    const clean = targetText.toLowerCase().trim();

    for (const el of elements) {
      const text = (el.innerText || el.textContent || "").toLowerCase().trim();
      const aria = (el.getAttribute("aria-label") || "").toLowerCase().trim();

      const textMatch = text === clean || (text.includes(clean) && text.length < clean.length + 25);
      const ariaMatch = aria === clean || (aria.includes(clean) && aria.length < clean.length + 30);

      if (textMatch || ariaMatch) {
        if (clean === "more" && text.includes("show")) continue;

        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (style.display !== "none" && style.visibility !== "hidden" && rect.width > 0) {
          return el;
        }
      }
    }
  }

  return null;
};

// 5. Send button hammerer (destroys modal reliably)
const hammerSendButton = async (modal: HTMLElement, note?: string): Promise<boolean> => {
  // If a note was provided, try adding it quickly
  if (note && note.trim().length > 0) {
    const addNoteBtn = Array.from(modal.querySelectorAll<HTMLElement>("button")).find((b) => {
      const t = (b.innerText || b.textContent || b.getAttribute("aria-label") || "").toLowerCase();
      return t.includes("add a note");
    });

    if (addNoteBtn) {
      console.log("[AgentX] ✍️ Clicking 'Add a note'...");
      simulateRealClick(addNoteBtn);
      await humanPause(600, 1000);

      const textarea = modal.querySelector<HTMLTextAreaElement>("textarea");
      if (textarea) {
        console.log(`[AgentX] ⌨️ Typing note (${note.length} chars)...`);
        const safeNote = note.length > 295 ? note.slice(0, 292) + "..." : note;
        await humanType(textarea, safeNote);
      }
    }
  }

  // Find the confirmation button ("Send", "Send without a note", "Send now")
  for (let strike = 0; strike < 8; strike++) {
    if (!document.querySelector(".artdeco-modal")) {
      console.log("[AgentX] ✅ Modal vanished! Request sent.");
      return true;
    }

    const buttons = Array.from(modal.querySelectorAll<HTMLElement>("button"));
    let sendBtn: HTMLElement | null | undefined = buttons.find((b) => {
      const t = (b.innerText || b.textContent || b.getAttribute("aria-label") || "").toLowerCase().trim();
      return (
        t === "send without a note" ||
        t.includes("send without a note") ||
        t === "send" ||
        t === "send now" ||
        t.includes("send invitation")
      );
    });

    // If still looking and "Send without a note" is on screen
    if (!sendBtn) {
      sendBtn = modal.querySelector<HTMLElement>("button[aria-label*='Send'], button[aria-label*='note']");
    }

    if (sendBtn) {
      console.log(`[AgentX] 🚀 Sending strike #${strike + 1} on button:`, sendBtn.innerText || sendBtn.getAttribute("aria-label"));
      simulateRealClick(sendBtn);
    }

    await humanPause(500, 800);
  }

  return !document.querySelector(".artdeco-modal");
};

// 6. Modal detection & execution
const handleConnectModal = async (note?: string): Promise<boolean> => {
  for (let attempt = 0; attempt < 6; attempt++) {
    const modal = document.querySelector<HTMLElement>(".artdeco-modal");

    if (modal) {
      console.log("[AgentX] ✅ Connect modal detected.");
      await humanPause(500, 800);
      return await hammerSendButton(modal, note);
    }

    await humanPause(500, 800);
  }

  return false;
};

// 7. Message listener from Background Script
chrome.runtime.onMessage.addListener(async (request: any) => {
  if (request.action === "EXECUTE_CONNECT") {
    console.log("[AgentX] ⚡ Fast connection sequence for:", request.name || "Target");
    let succeeded = false;

    try {
      // Step A: Brief human pause and gentle scroll
      await humanPause(1200, 2000);
      await humanScroll();

      // Step B: Find Connect button
      let connectBtn = findButton(["connect", "invite to connect"], "main");

      if (!connectBtn) {
        console.log("[AgentX] Connect not in primary buttons. Checking 'More' menu...");
        const moreBtn = findButton(["more", "more actions"], "main");

        if (moreBtn) {
          simulateRealClick(moreBtn);
          await humanPause(600, 1000);
          connectBtn = findButton(["connect"], ".artdeco-dropdown__content--is-open, .artdeco-dropdown");
        }
      }

      if (!connectBtn) {
        console.log("[AgentX] ℹ️ Profile already connected, pending, or not connectable.");
      } else {
        console.log("[AgentX] Clicking Connect button...");
        simulateRealClick(connectBtn);
        await humanPause(600, 1000);

        succeeded = await handleConnectModal(request.note);
      }
    } catch (err) {
      console.error("[AgentX] Error during connection:", err);
    }

    // Step C: Complete and notify background script
    await humanPause(800, 1400);
    chrome.runtime.sendMessage({
      action: "CONNECT_COMPLETED",
      success: succeeded,
    });
  }
});
