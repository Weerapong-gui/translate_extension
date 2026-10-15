export function searchShortcut(event, editable) {
  if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.key === 'Escape' || event.code === 'Escape') return 'close';
  if (!editable && (event.key === '/' || (event.code === 'Slash' && !event.shiftKey))) return 'focus';
  return null;
}

export function destination(value) {
  const query = value.trim();
  if (!query) return null;
  const explicit = /^https?:\/\//i.test(query);
  const domain = /^(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?\.)+[\p{L}]{2,}(?::\d+)?(?:[/?#][^\s]*)?$/u.test(query);
  if (!/\s/.test(query) && (explicit || domain)) {
    try {
      const url = new URL(explicit ? query : `https://${query}`);
      if (!url.username && !url.password) return url.href;
    } catch { /* Fall back to search for malformed URLs. */ }
  }
  return `https://www.google.com/search?${new URLSearchParams({ q: query })}`;
}

export function remember(history, value) {
  const query = value.trim();
  if (!query) return history;
  return [query, ...history.filter(item => item !== query)].slice(0, 10);
}

export function readHistory(raw) {
  try {
    const values = JSON.parse(raw);
    return Array.isArray(values)
      ? [...new Set(values.filter(value => typeof value === 'string' && value.trim()).map(value => value.trim()))].slice(0, 10)
      : [];
  } catch { return []; }
}
