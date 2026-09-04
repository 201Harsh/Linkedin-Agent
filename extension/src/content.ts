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

// 3. Reliable click dispatcher
const simulateHumanClick = (element: HTMLElement) => {
  const isInsideModal = !!element.closest(".artdeco-modal, [role='dialog']");

  // Only scroll if NOT inside a modal to prevent background page jumping
  if (!isInsideModal) {
    try {
      element.scrollIntoView({ behavior: "instant", block: "center" });
    } catch (e) {}
  }

  try {
    element.focus();
  } catch (e) {}

  const span = (element.querySelector("span") as HTMLElement) || element;
  const rect = element.getBoundingClientRect();
  const clientX =
    rect.width > 0 ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const clientY =
    rect.height > 0 ? rect.top + rect.height / 2 : window.innerHeight / 2;

  const eventOpts: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX,
    clientY,
    buttons: 1,
  };

  const dispatch = (target: EventTarget, evt: Event) => {
    try {
      target.dispatchEvent(evt);
    } catch (e) {}
  };

  // 1. Pointer events
  try {
    dispatch(element, new PointerEvent("pointerdown", eventOpts));
    dispatch(span, new PointerEvent("pointerdown", eventOpts));
  } catch (e) {}

  // 2. Mouse down
  dispatch(element, new MouseEvent("mousedown", eventOpts));
  dispatch(span, new MouseEvent("mousedown", eventOpts));

  // 3. Pointer up
  try {
    dispatch(element, new PointerEvent("pointerup", eventOpts));
    dispatch(span, new PointerEvent("pointerup", eventOpts));
  } catch (e) {}

  // 4. Mouse up
  dispatch(element, new MouseEvent("mouseup", eventOpts));
  dispatch(span, new MouseEvent("mouseup", eventOpts));

  // 5. Mouse click
  dispatch(element, new MouseEvent("click", eventOpts));
  dispatch(span, new MouseEvent("click", eventOpts));

  // 6. Native DOM clicks
  try {
    if (typeof (element as any).click === "function") {
      element.click();
    }
  } catch (e) {}

  try {
    if (span !== element && typeof (span as any).click === "function") {
      span.click();
    }
  } catch (e) {}
};

// 4. Modal finder: strictly detects the active connection dialog (ignoring background backdrop)
const getInvitationModal = (): HTMLElement | null => {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      "#artdeco-modal-outlet .artdeco-modal, div[role='dialog'].artdeco-modal, div[role='dialog'], .artdeco-modal"
    )
  );

  for (const modal of candidates) {
    // Exclude the dark backdrop overlay div
    if (modal.classList.contains("artdeco-modal-overlay")) continue;

    const text = (modal.innerText || modal.textContent || "").toLowerCase();
    const heading = modal.querySelector("h1, h2, h3, [id*='title'], [id*='header']");
    const headingText = heading ? (heading.textContent || "").toLowerCase() : "";

    if (
      headingText.includes("note") ||
      headingText.includes("invit") ||
      text.includes("send without a note") ||
      text.includes("add a note") ||
      text.includes("invitation")
    ) {
      return modal;
    }
  }

  return null;
};

// 5. Send button finder: strictly scoped INSIDE the modal dialog
const findSendButtonInModal = (modal: HTMLElement): HTMLElement | null => {
  const buttons = Array.from(
    modal.querySelectorAll<HTMLElement>("button, [role='button'], .artdeco-button")
  );

  // Strategy 1: Text or aria-label containing "without a note"
  for (const btn of buttons) {
    const text = (btn.innerText || btn.textContent || "").toLowerCase().trim();
    const aria = (btn.getAttribute("aria-label") || "").toLowerCase().trim();

    if (text.includes("without a note") || aria.includes("without a note")) {
      return btn;
    }
  }

  // Strategy 2: The primary action button inside modal actionbar
  const actionbar = modal.querySelector(".artdeco-modal__actionbar") || modal;
  const primaryBtn = actionbar.querySelector<HTMLElement>(
    "button.artdeco-button--primary, .artdeco-button--primary, button[data-test-modal-button='primary']"
  );
  if (primaryBtn) {
    return primaryBtn;
  }

  // Strategy 3: Fallback inside modal with "send" (excluding dismiss, cancel, add a note)
  for (const btn of buttons) {
    const text = (btn.innerText || btn.textContent || "").toLowerCase().trim();
    const aria = (btn.getAttribute("aria-label") || "").toLowerCase().trim();

    const isDismiss =
      text.includes("dismiss") ||
      aria.includes("dismiss") ||
      text.includes("cancel") ||
      aria.includes("cancel") ||
      text.includes("add a note") ||
      aria.includes("add a note") ||
      aria.includes("close");

    if (!isDismiss && (text.includes("send") || aria.includes("send"))) {
      return btn;
    }
  }

  return null;
};

// 6. Direct status verification (scoped to top card and toast notifications)
const isInviteSent = (): boolean => {
  const mainCard = document.querySelector("main .pv-top-card, main section.artdeco-card, main");
  if (mainCard) {
    const mainButtons = Array.from(mainCard.querySelectorAll<HTMLElement>("button, [role='button']"));
    for (const b of mainButtons) {
      if (b.closest(".aside, aside, .ad-banner, .pv-browsemap")) continue;
      const txt = (b.innerText || b.textContent || "").toLowerCase().trim();
      if (txt === "pending") return true;
    }
  }

  const toast = document.querySelector(".artdeco-toast-item, .artdeco-inline-feedback");
  if (toast) {
    const txt = (toast.textContent || "").toLowerCase();
    if (txt.includes("invitation sent") || txt.includes("invite sent")) {
      return true;
    }
  }

  return false;
};

// 7. Modal Wait & Guaranteed Click strictly targeting the modal
const handleModalSend = async (knownModal?: HTMLElement): Promise<boolean> => {
  console.log("[AgentX] ⏳ Waiting for 'Send without a note' modal dialog...");

  let targetModal: HTMLElement | null = knownModal || null;

  if (!targetModal) {
    for (let wait = 0; wait < 25; wait++) {
      targetModal = getInvitationModal();
      if (targetModal) break;
      if (isInviteSent()) {
        console.log("[AgentX] ✅ Invitation already sent directly without modal!");
        return true;
      }
      await humanPause(250, 400);
    }
  }

  if (!targetModal) {
    console.warn("[AgentX] ⚠️ Modal dialog did not appear.");
    return isInviteSent();
  }

  console.log("[AgentX] 🎯 Modal detected! Locating 'Send without a note' button inside modal...");
  await humanPause(350, 550);

  let sendBtn: HTMLElement | null = null;
  for (let bWait = 0; bWait < 15; bWait++) {
    sendBtn = findSendButtonInModal(targetModal);
    if (sendBtn) break;
    await humanPause(200, 350);
  }

  if (!sendBtn) {
    console.warn("[AgentX] ⚠️ Send button not found inside modal.");
    return false;
  }

  const label = (
    sendBtn.innerText ||
    sendBtn.textContent ||
    sendBtn.getAttribute("aria-label") ||
    "Send without a note"
  ).trim();

  console.log(`[AgentX] 🎯 Found target button inside modal: '${label}'. Executing click sequence...`);
  await humanPause(250, 450);

  // Click until modal vanishes (up to 8 strikes)
  for (let strike = 0; strike < 8; strike++) {
    const currentModal = getInvitationModal();
    if (!currentModal) {
      console.log("[AgentX] ✅ Modal closed! Invitation sent successfully.");
      return true;
    }

    const currentBtn = findSendButtonInModal(currentModal);
    if (!currentBtn) {
      console.log("[AgentX] ✅ Send button no longer in modal! Invitation sent.");
      return true;
    }

    console.log(`[AgentX] 🚀 Strike #${strike + 1}: Clicking '${label}' inside modal...`);
    simulateHumanClick(currentBtn);
    await humanPause(600, 900);
  }

  const finished = !getInvitationModal() || isInviteSent();
  console.log(`[AgentX] Modal closed status: ${finished}`);
  return finished;
};

// 8. Connect Button Finder (Profile Top Card only)
const findConnectButton = (): HTMLElement | null => {
  const topCard =
    document.querySelector("main .pv-top-card, main section.artdeco-card, main") ||
    document.querySelector("main") ||
    document.body;

  const elements = Array.from(
    topCard.querySelectorAll<HTMLElement>("button, [role='button'], a"),
  );

  for (const el of elements) {
    if (el.closest(".aside, aside, .pv-browsemap, .ad-banner")) continue;

    const text = (el.innerText || el.textContent || "").toLowerCase().trim();
    const aria = (el.getAttribute("aria-label") || "").toLowerCase().trim();

    const isConnect =
      text === "connect" ||
      (text.includes("connect") && text.length < 25 && !text.includes("connection")) ||
      (aria.includes("invite") && aria.includes("connect"));

    if (isConnect) {
      const style = window.getComputedStyle(el);
      if (style.display !== "none" && style.visibility !== "hidden") {
        return el;
      }
    }
  }

  return null;
};

// 9. "More" Button Finder
const findMoreButton = (): HTMLElement | null => {
  const topCard =
    document.querySelector("main .pv-top-card, main section.artdeco-card, main") ||
    document.querySelector("main") ||
    document.body;

  const elements = Array.from(
    topCard.querySelectorAll<HTMLElement>("button, [role='button']"),
  );

  for (const el of elements) {
    if (el.closest(".aside, aside, .pv-browsemap, .ad-banner")) continue;

    const text = (el.innerText || el.textContent || "").toLowerCase().trim();
    const aria = (el.getAttribute("aria-label") || "").toLowerCase().trim();

    if (text === "more" || aria === "more actions" || aria.includes("more actions")) {
      const style = window.getComputedStyle(el);
      if (style.display !== "none" && style.visibility !== "hidden") {
        return el;
      }
    }
  }

  return null;
};

// 10. Find Connect in Open Dropdown
const findConnectInDropdown = (): HTMLElement | null => {
  const dropdown = document.querySelector<HTMLElement>(
    ".artdeco-dropdown__content--is-open, .artdeco-dropdown__content, div.artdeco-dropdown",
  );
  if (!dropdown) return null;

  const items = Array.from(
    dropdown.querySelectorAll<HTMLElement>(
      "button, [role='button'], .artdeco-dropdown__item, span, a",
    ),
  );

  for (const item of items) {
    const text = (item.innerText || item.textContent || "").toLowerCase().trim();
    const aria = (item.getAttribute("aria-label") || "").toLowerCase().trim();

    if (text.includes("connect") || aria.includes("connect")) {
      const clickable =
        (item.closest(
          "button, [role='button'], .artdeco-dropdown__item",
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
      await humanPause(600, 1200);

      // Check if modal is ALREADY open on page
      const existingModal = getInvitationModal();
      if (existingModal) {
        console.log("[AgentX] Modal already active on page! Sending immediately...");
        succeeded = await handleModalSend(existingModal);
      } else {
        await humanScroll();

        // Step B: Find Connect button
        let connectBtn = findConnectButton();

        if (!connectBtn) {
          console.log("[AgentX] Connect not visible in primary buttons. Checking 'More' menu...");
          const moreBtn = findMoreButton();

          if (moreBtn) {
            simulateHumanClick(moreBtn);
            for (let d = 0; d < 8; d++) {
              await humanPause(200, 350);
              connectBtn = findConnectInDropdown();
              if (connectBtn) break;
            }
          }
        }

        if (!connectBtn) {
          console.log("[AgentX] ℹ️ Profile cannot be connected to (already connected, pending, or not allowed).");
        } else {
          console.log("[AgentX] Clicking Connect button...");
          simulateHumanClick(connectBtn);

          // Step C: Wait for modal and click "Send without a note"
          succeeded = await handleModalSend();
        }
      }
    } catch (err) {
      console.error("[AgentX] Error during connection sequence:", err);
    }

    // Step D: Report back to background script to close tab and continue
    await humanPause(600, 1000);
    chrome.runtime.sendMessage({
      action: "CONNECT_COMPLETED",
      success: succeeded,
    });
  }
});
