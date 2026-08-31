(() => {
  const MAX_LENGTH = 3000;
  const DEBOUNCE_MS = 150;

  let popup = null;
  let lastText = "";
  let debounceTimer = null;
  let requestId = 0;
  let active = true;

  const LANG_NAMES = {
    en: "English",
    ja: "日本語",
    zh: "中文",
    "zh-CN": "中文",
    "zh-TW": "中文",
    ko: "한국어",
    fr: "Français",
    de: "Deutsch",
    es: "Español",
    it: "Italiano",
    pt: "Português",
    ru: "Русский",
    vi: "Tiếng Việt",
    id: "Indonesia",
    ms: "Melayu",
    ar: "العربية",
    hi: "हिन्दी",
  };

  function langLabel(code) {
    if (!code) return "แปลเป็นไทย";
    return `${LANG_NAMES[code] || code.toUpperCase()} → ไทย`;
  }

  // True only while this script can still reach its extension. After the
  // extension is reloaded or updated, the script left behind in an already-open
  // tab is orphaned: every chrome.* access throws, including this one.
  function contextAlive() {
    try {
      return !!chrome.runtime?.id;
    } catch (e) {
      return false;
    }
  }

  // An orphaned script cannot be revived — only a page reload replaces it. So
  // it unhooks itself instead of staying live and throwing on every selection.
  function teardown() {
    if (!active) return;
    active = false;
    clearTimeout(debounceTimer);
    removePopup();
    document.removeEventListener("mouseup", onMouseUp);
    document.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("scroll", removePopup);
  }

  function removePopup() {
    if (popup) {
      popup.remove();
      popup = null;
    }
    lastText = "";
  }

  function showPopup(text, rect, { label, isError = false } = {}) {
    removePopup();
    popup = document.createElement("div");
    popup.className = isError ? "__tlx-popup __tlx-popup--error" : "__tlx-popup";

    const head = document.createElement("div");
    head.className = "__tlx-head";
    head.textContent = label;
    popup.appendChild(head);

    const body = document.createElement("div");
    body.className = "__tlx-body";
    body.textContent = text;
    popup.appendChild(body);

    document.body.appendChild(popup);

    const margin = 8;
    const popupRect = popup.getBoundingClientRect();
    let top = rect.bottom + margin;
    // Flip above the selection when there is no room below.
    if (top + popupRect.height > window.innerHeight && rect.top - popupRect.height - margin > 0) {
      top = rect.top - popupRect.height - margin;
      popup.classList.add("__tlx-popup--above");
    }
    let left = rect.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - popupRect.width - margin));

    popup.style.top = `${top + window.scrollY}px`;
    popup.style.left = `${left + window.scrollX}px`;
  }

  function handleSelection() {
    if (!active) return;

    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : "";
    if (!text || text.length > MAX_LENGTH) {
      lastText = "";
      return;
    }
    if (text === lastText) return;

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    if (!contextAlive()) {
      teardown();
      return;
    }

    lastText = text;
    const id = ++requestId;
    try {
      chrome.runtime.sendMessage({ type: "translate", text }, (response) => {
        // This callback runs on a later task, so the try/catch below is already
        // unwound by the time it fires. If the extension was reloaded while the
        // request was in flight, even reading lastError throws — uncaught.
        try {
          if (!active) return;
          if (id !== requestId) return; // a newer selection superseded this one
          if (chrome.runtime.lastError || !response) return;
          if (response.ok) {
            if (response.detectedLang === "th") return;
            showPopup(response.translation, rect, { label: langLabel(response.detectedLang) });
            lastText = text; // showPopup resets it
          } else {
            showPopup(response.error, rect, { label: "แปลไม่สำเร็จ", isError: true });
            lastText = text;
          }
        } catch (e) {
          teardown();
        }
      });
    } catch (e) {
      teardown();
    }
  }

  function onMouseUp(event) {
    if (popup && popup.contains(event.target)) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(handleSelection, DEBOUNCE_MS);
  }

  function onMouseDown(event) {
    if (popup && !popup.contains(event.target)) removePopup();
  }

  function onKeyDown(event) {
    if (event.key === "Escape") removePopup();
  }

  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("keydown", onKeyDown);
  window.addEventListener("scroll", removePopup, { passive: true });
})();
