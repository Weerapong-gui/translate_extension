# Extension_Star_Brave

Animated starfield new tab for Brave and Chrome (Manifest V3).

Animation pauses while the tab is hidden and resumes from its previous animation
time when visible again. Background tabs do not schedule drawing frames.

## Install

Open `brave://extensions` (or `chrome://extensions`), enable Developer mode,
choose **Load unpacked**, and select this folder. After updating, reload the
extension and open a new tab. Google suggestions require permission for
`https://suggestqueries.google.com/*`.

## Search

- Enter a domain or HTTP/HTTPS URL to visit it, or enter text to search Google.
- Press the physical `/` key outside an editable field to focus search,
  including `ฝ` on the Thai keyboard layout. Esc closes the list in either layout.
- The last 10 entries are stored locally. Remove individual entries with ×,
  or choose **Clear all**. This is separate from browser history.
- Google suggestions appear after at least two characters (250 ms debounce).
  Typed text is sent to Google; cookies are omitted. If the service is unavailable,
  local history matches remain available and normal search still works.
- Use ↑/↓ and Enter to select suggestions, or click one. Esc closes the list.

## Verify

Run `node --test` for URL routing and history tests. For a browser check, reload
the extension and try a domain, a Thai query, history deletion, `/`, arrow keys,
Esc, and suggestions with the network offline. Google suggestions use a public
endpoint whose availability can change.
