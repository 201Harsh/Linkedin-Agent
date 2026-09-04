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

// 2. Realistic human pause
const humanPause = (min = 350, max = 700) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const humanScroll = async () => {
  try {
    const scrollDown = Math.floor(Math.random() * 180) + 100;
    window.scrollBy({ top: scrollDown, behavior: "smooth" });
    await humanPause(250, 450);
    window.scrollBy({ top: -scrollDown, behavior: "smooth" });
    await humanPause(200, 350);
  } catch (e) {}
};

// 3. Helper to check if an element is visible in the viewport/DOM
const isElementVisible = (el: HTMLElement): boolean => {
  if (!el || !el.isConnected) return false;
  const style = window.getComputedStyle(el);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  ) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

// 4. Exact coordinate click dispatcher ("click the exact point")
const clickExactPoint = (element: HTMLElement): boolean => {
  if (!element) return false;

  const isInsideModal = !!element.closest(
    ".artdeco-modal, [role='dialog'], dialog, [aria-modal='true'], [class*='modal']"
  );

  // Only scroll into view if NOT inside a modal to avoid jittering the background page
  if (!isInsideModal) {
    try {
      element.scrollIntoView({ behavior: "instant", block: "center" });
    } catch (e) {}
  }

  const rect = element.getBoundingClientRect();
  const clientX =
    rect.width > 0 ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const clientY =
    rect.height > 0 ? rect.top + rect.height / 2 : window.innerHeight / 2;
  const screenX = window.screenX + clientX;
  const screenY = window.screenY + clientY;

  // Resolve the exact topmost element at these coordinates (e.g. inner span or button itself)
  const hitTarget =
    (document.elementFromPoint(clientX, clientY) as HTMLElement) || element;

  console.log(
    `[AgentX] 🎯 Clicking EXACT POINT (${Math.round(clientX)}, ${Math.round(clientY)}) on <${hitTarget.tagName.toLowerCase()}> inside <${element.tagName.toLowerCase()}>`
  );

  try {
    element.focus();
  } catch (e) {}
  try {
    hitTarget.focus();
  } catch (e) {}

  const mouseInit: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX,
    clientY,
    screenX,
    screenY,
  };

  const pointerInit: PointerEventInit = {
    ...mouseInit,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    width: 1,
    height: 1,
  };

  // 1. Cursor movement to target
  try {
    hitTarget.dispatchEvent(new PointerEvent("pointermove", { ...pointerInit, buttons: 0 }));
    hitTarget.dispatchEvent(new MouseEvent("mousemove", { ...mouseInit, buttons: 0 }));
  } catch (e) {}

  // 2. Pointer down & mouse down (button 0, buttons 1)
  try {
    hitTarget.dispatchEvent(new PointerEvent("pointerdown", { ...pointerInit, button: 0, buttons: 1 }));
  } catch (e) {}
  try {
    hitTarget.dispatchEvent(new MouseEvent("mousedown", { ...mouseInit, button: 0, buttons: 1 }));
  } catch (e) {}

  // 3. Pointer up & mouse up (button 0, buttons 0)
  try {
    hitTarget.dispatchEvent(new PointerEvent("pointerup", { ...pointerInit, button: 0, buttons: 0 }));
  } catch (e) {}
  try {
    hitTarget.dispatchEvent(new MouseEvent("mouseup", { ...mouseInit, button: 0, buttons: 0 }));
  } catch (e) {}

  // 4. Click event (button 0, buttons 0)
  try {
    hitTarget.dispatchEvent(new MouseEvent("click", { ...mouseInit, button: 0, buttons: 0 }));
  } catch (e) {}

  // 5. Native DOM click triggers on both the hit target and the button container
  try {
    if (typeof hitTarget.click === "function") {
      hitTarget.click();
    }
  } catch (e) {}

  try {
    if (hitTarget !== element && typeof (element as any).click === "function") {
      (element as any).click();
    }
  } catch (e) {}

  return true;
};

// 5. Multi-Strategy "Send without a note" Button Finder
const findSendWithoutNoteButton = (): HTMLElement | null => {
  // Candidate elements across the document
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      "button, [role='button'], a.artdeco-button, a[role='button'], a"
    )
  );

  // Strategy 1: Global search for aria-label or innerText containing "without a note"
  for (const btn of candidates) {
    if (!isElementVisible(btn)) continue;
    const text = (btn.innerText || btn.textContent || "").toLowerCase().trim();
    const aria = (btn.getAttribute("aria-label") || "").toLowerCase().trim();

    if (text.includes("without a note") || aria.includes("without a note")) {
      console.log("[AgentX] 🎯 Strategy 1 matched 'without a note':", text || aria);
      return btn;
    }
  }

  // Strategy 2: Global search for aria-label or innerText matching "send now"
  for (const btn of candidates) {
    if (!isElementVisible(btn)) continue;
    const text = (btn.innerText || btn.textContent || "").toLowerCase().trim();
    const aria = (btn.getAttribute("aria-label") || "").toLowerCase().trim();

    if (
      text === "send now" ||
      aria === "send now" ||
      text.includes("send now") ||
      aria.includes("send now")
    ) {
      console.log("[AgentX] 🎯 Strategy 2 matched 'send now':", text || aria);
      return btn;
    }
  }

  // Strategy 3: Search within any active dialog / modal / overlay
  const modals = Array.from(
    document.querySelectorAll<HTMLElement>(
      "div[role='dialog'], dialog, [aria-modal='true'], .artdeco-modal, #artdeco-modal-outlet, [class*='modal'], [class*='dialog']"
    )
  ).filter((m) => {
    if (m.classList.contains("artdeco-modal-overlay")) return false;
    if (!isElementVisible(m)) return false;
    const txt = (m.innerText || m.textContent || "").toLowerCase();
    return (
      txt.includes("note") ||
      txt.includes("invit") ||
      txt.includes("send") ||
      txt.includes("connect")
    );
  });

  for (const modal of modals) {
    const modalButtons = Array.from(
      modal.querySelectorAll<HTMLElement>("button, [role='button'], a")
    ).filter(isElementVisible);

    // 3a. Sibling strategy: If modal has "Add a note" button, find the other action button in the footer
    const addNoteBtn = modalButtons.find((b) => {
      const t = (b.innerText || b.textContent || "").toLowerCase().trim();
      const a = (b.getAttribute("aria-label") || "").toLowerCase().trim();
      return t.includes("add a note") || a.includes("add a note");
    });

    if (addNoteBtn) {
      const sendCandidate = modalButtons.find((b) => {
        if (b === addNoteBtn) return false;
        const t = (b.innerText || b.textContent || "").toLowerCase().trim();
        const a = (b.getAttribute("aria-label") || "").toLowerCase().trim();
        const isDismiss =
          t.includes("dismiss") ||
          a.includes("dismiss") ||
          t.includes("cancel") ||
          a.includes("cancel") ||
          a.includes("close") ||
          t.includes("close");
        return !isDismiss;
      });

      if (sendCandidate) {
        console.log(
          "[AgentX] 🎯 Strategy 3a (Add a note sibling) matched:",
          sendCandidate.innerText || sendCandidate.getAttribute("aria-label")
        );
        return sendCandidate;
      }
    }

    // 3b. Primary button inside modal
    const primaryBtn = modal.querySelector<HTMLElement>(
      "button.artdeco-button--primary, button[data-test-modal-button='primary'], button[class*='primary'], .artdeco-button--primary"
    );
    if (primaryBtn && isElementVisible(primaryBtn)) {
      console.log("[AgentX] 🎯 Strategy 3b (primary button in modal) matched");
      return primaryBtn;
    }

    // 3c. Any button inside modal containing "send"
    for (const b of modalButtons) {
      const t = (b.innerText || b.textContent || "").toLowerCase().trim();
      const a = (b.getAttribute("aria-label") || "").toLowerCase().trim();
      const isDismiss =
        t.includes("dismiss") ||
        a.includes("dismiss") ||
        t.includes("cancel") ||
        a.includes("cancel") ||
        t.includes("add a note") ||
        a.includes("add a note") ||
        a.includes("close") ||
        t.includes("close");

      if (!isDismiss && (t.includes("send") || a.includes("send"))) {
        console.log("[AgentX] 🎯 Strategy 3c (modal send button) matched:", t || a);
        return b;
      }
    }
  }

  // Strategy 4: Deep text traversal for spans/divs with exact text
  const textElements = Array.from(
    document.querySelectorAll<HTMLElement>("span, p, div")
  );
  for (const el of textElements) {
    if (!isElementVisible(el)) continue;
    const txt = (el.textContent || "").trim();
    if (
      txt === "Send without a note" ||
      txt === "Send now" ||
      txt === "Send"
    ) {
      const parentBtn = el.closest<HTMLElement>("button, [role='button'], a");
      if (parentBtn && isElementVisible(parentBtn)) {
        console.log("[AgentX] 🎯 Strategy 4 (text element parent) matched:", txt);
        return parentBtn;
      }
    }
  }

  return null;
};

// 6. Direct status verification
const isInviteSent = (): boolean => {
  // Check main profile card buttons for "Pending" or "Withdraw"
  const mainCard =
    document.querySelector("main .pv-top-card, main section.artdeco-card, main [data-sdui-screen*='Profile'], main") ||
    document.querySelector("main");

  if (mainCard) {
    const buttons = Array.from(
      mainCard.querySelectorAll<HTMLElement>("button, [role='button'], a")
    );
    for (const b of buttons) {
      if (
        b.closest(
          "[data-testid*='carousel'], [id*='PostConnect'], [componentkey*='similar'], aside, .aside"
        )
      ) {
        continue;
      }
      const txt = (b.innerText || b.textContent || "").toLowerCase().trim();
      const aria = (b.getAttribute("aria-label") || "").toLowerCase().trim();
      if (
        txt === "pending" ||
        aria.includes("pending") ||
        txt === "withdraw" ||
        aria.includes("withdraw") ||
        txt === "invited"
      ) {
        return true;
      }
    }
  }

  // Check toast notifications
  const toast = document.querySelector<HTMLElement>(
    ".artdeco-toast-item, .artdeco-inline-feedback, [data-testid='toasts-title'], [role='alert']"
  );
  if (toast) {
    const txt = (toast.textContent || "").toLowerCase();
    if (
      txt.includes("invitation sent") ||
      txt.includes("invite sent") ||
      txt.includes("invitation is on its way")
    ) {
      return true;
    }
  }

  return false;
};

// 7. Modal Wait & Guaranteed Click strictly targeting "Send without a note"
const handleModalSend = async (): Promise<boolean> => {
  console.log("[AgentX] ⏳ Waiting for 'Send without a note' button to appear...");

  let sendBtn: HTMLElement | null = null;

  // Poll for up to 30 attempts (~7.5 seconds)
  for (let wait = 0; wait < 30; wait++) {
    sendBtn = findSendWithoutNoteButton();
    if (sendBtn) {
      console.log("[AgentX] ✅ Target 'Send without a note' button detected!");
      break;
    }

    // Direct check: maybe connection request was sent directly without requiring a note modal
    if (isInviteSent()) {
      console.log("[AgentX] ✅ Invitation already sent directly without modal!");
      return true;
    }

    await humanPause(200, 300);
  }

  if (!sendBtn) {
    if (isInviteSent()) {
      console.log("[AgentX] ✅ Verified invitation sent.");
      return true;
    }
    console.warn("[AgentX] ⚠️ 'Send without a note' button did not appear.");
    return false;
  }

  // Allow 300ms for modal slide-in animation to stabilize
  await humanPause(300, 500);

  // Click sequence: click exact coordinates until the button/modal disappears (up to 6 strikes)
  for (let strike = 0; strike < 6; strike++) {
    const currentBtn = findSendWithoutNoteButton();
    if (!currentBtn) {
      console.log("[AgentX] ✅ Send button no longer in DOM! Invitation sent successfully.");
      return true;
    }

    const label = (
      currentBtn.innerText ||
      currentBtn.textContent ||
      currentBtn.getAttribute("aria-label") ||
      "Send without a note"
    ).trim();

    console.log(`[AgentX] 🚀 Strike #${strike + 1}: Clicking '${label}' at exact point...`);
    clickExactPoint(currentBtn);
    await humanPause(600, 900);

    if (isInviteSent()) {
      console.log("[AgentX] ✅ Verified invitation is pending/sent!");
      return true;
    }
  }

  const finished = !findSendWithoutNoteButton() || isInviteSent();
  console.log(`[AgentX] Modal closed / finished status: ${finished}`);
  return finished;
};

// 8. Connect Button Finder (Profile Top Card only, excluding carousels and recommendations)
const findConnectButton = (): HTMLElement | null => {
  const topCard =
    document.querySelector("main .pv-top-card, main section.artdeco-card, main [data-sdui-screen*='Profile'], main") ||
    document.querySelector("main") ||
    document.body;

  const elements = Array.from(
    topCard.querySelectorAll<HTMLElement>("button, [role='button'], a")
  );

  for (const el of elements) {
    // Strictly ignore recommended people, drawers, and carousels
    if (
      el.closest(
        "[data-testid*='carousel'], [id*='PostConnect'], [componentkey*='PostConnect'], [componentkey*='similar'], [id*='similar'], section[aria-label*='similar' i], section[aria-label*='People also viewed' i], aside, .aside"
      )
    ) {
      continue;
    }

    const text = (el.innerText || el.textContent || "").toLowerCase().trim();
    const aria = (el.getAttribute("aria-label") || "").toLowerCase().trim();
    const href = (el.getAttribute("href") || "").toLowerCase().trim();
    const compKey = (el.getAttribute("componentkey") || "").toLowerCase().trim();

    const isConnect =
      compKey.includes("connectbutton") ||
      href.includes("custom-invite") ||
      (aria.includes("invite") && aria.includes("connect")) ||
      text === "connect" ||
      (text.includes("connect") && text.length < 25 && !text.includes("connection"));

    if (isConnect && isElementVisible(el)) {
      console.log("[AgentX] 🎯 Found profile Connect button:", text || aria || compKey);
      return el;
    }
  }

  return null;
};

// 9. "More" Button Finder (Profile Top Card only)
const findMoreButton = (): HTMLElement | null => {
  const topCard =
    document.querySelector("main .pv-top-card, main section.artdeco-card, main [data-sdui-screen*='Profile'], main") ||
    document.querySelector("main") ||
    document.body;

  const elements = Array.from(
    topCard.querySelectorAll<HTMLElement>("button, [role='button']")
  );

  for (const el of elements) {
    if (
      el.closest(
        "[data-testid*='carousel'], [id*='PostConnect'], [componentkey*='PostConnect'], [componentkey*='similar'], [id*='similar'], section[aria-label*='similar' i], aside, .aside, [data-testid*='feed']"
      )
    ) {
      continue;
    }

    const text = (el.innerText || el.textContent || "").toLowerCase().trim();
    const aria = (el.getAttribute("aria-label") || "").toLowerCase().trim();

    const isMore =
      text === "more" ||
      aria === "more" ||
      aria === "more actions" ||
      aria.includes("more actions") ||
      aria.includes("overflow");

    if (isMore && isElementVisible(el)) {
      return el;
    }
  }

  return null;
};

// 10. Find Connect in Open Dropdown
const findConnectInDropdown = (): HTMLElement | null => {
  const dropdown = document.querySelector<HTMLElement>(
    "div[role='menu'], ul[role='menu'], .artdeco-dropdown__content--is-open, .artdeco-dropdown__content, div.artdeco-dropdown"
  );
  if (!dropdown) return null;

  const items = Array.from(
    dropdown.querySelectorAll<HTMLElement>(
      "button, [role='button'], .artdeco-dropdown__item, [role='menuitem'], span, a"
    )
  );

  for (const item of items) {
    const text = (item.innerText || item.textContent || "").toLowerCase().trim();
    const aria = (item.getAttribute("aria-label") || "").toLowerCase().trim();
    const href = (item.getAttribute("href") || "").toLowerCase().trim();
    const compKey = (item.getAttribute("componentkey") || "").toLowerCase().trim();

    if (
      text.includes("connect") ||
      aria.includes("connect") ||
      href.includes("custom-invite") ||
      compKey.includes("connect")
    ) {
      const clickable =
        (item.closest(
          "button, [role='button'], [role='menuitem'], .artdeco-dropdown__item, a"
        ) as HTMLElement) || item;
      return clickable;
    }
  }

  return null;
};

// 11. Main Action Execution
chrome.runtime.onMessage.addListener(async (request: any) => {
  if (request.action === "EXECUTE_CONNECT") {
    console.log("[AgentX] ⚡ Processing profile connection for:", request.name || "Target");
    let succeeded = false;

    try {
      await humanPause(400, 800);

      // Step 1: Check if "Send without a note" or modal is ALREADY open on the page
      const existingSendBtn = findSendWithoutNoteButton();
      if (existingSendBtn) {
        console.log("[AgentX] 🎯 Modal/Send button already active on page! Sending immediately...");
        succeeded = await handleModalSend();
      } else {
        await humanScroll();

        // Step 2: Find Connect button on profile card
        let connectBtn = findConnectButton();

        if (!connectBtn) {
          console.log("[AgentX] Connect not visible in primary buttons. Checking 'More' menu...");
          const moreBtn = findMoreButton();

          if (moreBtn) {
            clickExactPoint(moreBtn);
            for (let d = 0; d < 8; d++) {
              await humanPause(200, 350);
              connectBtn = findConnectInDropdown();
              if (connectBtn) break;
            }
          }
        }

        if (!connectBtn) {
          if (isInviteSent()) {
            console.log("[AgentX] ℹ️ Profile invitation is already pending or sent.");
            succeeded = true;
          } else {
            console.log("[AgentX] ℹ️ Profile cannot be connected to (already connected, pending, or not allowed).");
          }
        } else {
          console.log("[AgentX] 🎯 Found Connect button! Clicking exact point...");
          clickExactPoint(connectBtn);

          // Step 3: Wait for modal and click "Send without a note"
          succeeded = await handleModalSend();
        }
      }
    } catch (err) {
      console.error("[AgentX] Error during connection sequence:", err);
    }

    // Step 4: Report back to background script to close tab and continue
    await humanPause(500, 800);
    chrome.runtime.sendMessage({
      action: "CONNECT_COMPLETED",
      success: succeeded,
    });
  }
});
