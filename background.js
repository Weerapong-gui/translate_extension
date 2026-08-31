const TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";

async function translate(text) {
  const params = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: "th",
    dt: "t",
    q: text,
  });
  const res = await fetch(`${TRANSLATE_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`Translate request failed (HTTP ${res.status})`);
  }
  const data = await res.json();
  const translation = (data[0] || [])
    .map((seg) => seg[0])
    .filter(Boolean)
    .join("");
  return { translation, detectedLang: data[2] || "" };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "translate") return;
  translate(message.text)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((err) => sendResponse({ ok: false, error: err.message }));
  return true;
});
