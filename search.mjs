import { destination, remember, readHistory, searchShortcut } from './search-utils.mjs';

const form = document.querySelector('.search-form');
const input = document.getElementById('search-input');
const widget = document.querySelector('.search-widget');
const panel = document.getElementById('search-panel');
const options = document.getElementById('search-options');
const heading = document.getElementById('search-heading');
const clear = document.getElementById('clear-history');
const key = 'star-sky-search-history';
let history = [];
try { history = readHistory(localStorage.getItem(key)); } catch { /* Storage may be unavailable. */ }
let items = [];
let active = -1;
let timer;
let controller;
let revision = 0;
let composing = false;

function persist() {
  try { localStorage.setItem(key, JSON.stringify(history)); } catch { /* Search still works without storage. */ }
}

function cancel() {
  clearTimeout(timer);
  controller?.abort();
  revision++;
}

function close() {
  cancel();
  panel.hidden = true;
  active = -1;
  input.setAttribute('aria-expanded', 'false');
  input.removeAttribute('aria-activedescendant');
}

function navigate(value) {
  const url = destination(value);
  if (!url) return;
  cancel();
  history = remember(history, value);
  persist();
  window.location.assign(url);
}

function render(values, recent) {
  items = values;
  active = -1;
  input.removeAttribute('aria-activedescendant');
  options.replaceChildren();
  heading.textContent = recent ? 'Recent searches' : 'Google suggestions';
  clear.hidden = !recent;
  values.forEach((value, index) => {
    const row = document.createElement('li');
    row.id = `search-option-${index}`;
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', 'false');
    const choose = document.createElement('button');
    choose.type = 'button';
    choose.className = 'search-choice';
    choose.tabIndex = -1;
    choose.textContent = value;
    choose.addEventListener('click', () => navigate(value));
    row.append(choose);
    if (recent) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove-history';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Remove ${value} from history`);
      remove.addEventListener('click', () => {
        history = history.filter(item => item !== value);
        persist();
        input.focus();
        update();
      });
      row.append(remove);
    }
    options.append(row);
  });
  panel.hidden = values.length === 0;
  input.setAttribute('aria-expanded', String(!panel.hidden));
}

function update() {
  cancel();
  if (composing) return close();
  const query = input.value.trim();
  if (!query) return render(history, true);
  const matches = history.filter(value => value.toLowerCase().includes(query.toLowerCase()));
  render(matches, true);
  if (query.length < 2) return;
  const current = revision;
  timer = setTimeout(async () => {
    const request = new AbortController();
    controller = request;
    const timeout = setTimeout(() => request.abort(), 4000);
    try {
      const url = new URL('https://suggestqueries.google.com/complete/search');
      url.search = new URLSearchParams({ client: 'firefox', q: query });
      const response = await fetch(url, { signal: request.signal, credentials: 'omit' });
      if (!response.ok) return;
      const data = await response.json();
      if (current !== revision || document.activeElement !== input || !Array.isArray(data[1])) return;
      const suggestions = [...new Set(data[1].filter(value => typeof value === 'string' && value.trim()))].slice(0, 8);
      if (suggestions.length) render(suggestions, false);
    } catch { /* Keep local matches when suggestions are unavailable. */ }
    finally { clearTimeout(timeout); }
  }, 250);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!composing) navigate(active >= 0 ? items[active] : input.value);
});
input.addEventListener('focus', update);
input.addEventListener('input', update);
input.addEventListener('compositionstart', () => { composing = true; close(); });
input.addEventListener('compositionend', () => { composing = false; update(); });
input.addEventListener('keydown', event => {
  if (event.isComposing || composing) return;
  if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && !panel.hidden && items.length) {
    event.preventDefault();
    active = (active + (event.key === 'ArrowDown' ? 1 : active < 0 ? 0 : -1) + items.length) % items.length;
    [...options.children].forEach((row, index) => row.setAttribute('aria-selected', String(index === active)));
    input.setAttribute('aria-activedescendant', `search-option-${active}`);
    options.children[active].scrollIntoView({ block: 'nearest' });
  }
});
clear.addEventListener('click', () => { history = []; persist(); input.focus(); update(); });
document.addEventListener('keydown', event => {
  const target = event.target;
  if (composing) return;
  const editable = target.isContentEditable || Boolean(target.closest('input, textarea, select'));
  const action = searchShortcut(event, editable);
  if (action === 'focus') {
    event.preventDefault();
    input.focus();
  } else if (action === 'close' && widget.contains(target)) {
    event.preventDefault();
    close();
    if (target === input) input.blur();
  }
});
document.addEventListener('pointerdown', event => { if (!widget.contains(event.target)) close(); });
widget.addEventListener('focusout', event => { if (!widget.contains(event.relatedTarget)) close(); });
window.addEventListener('storage', event => {
  if (event.key === key || event.key === null) {
    history = readHistory(event.newValue);
    if (document.activeElement === input) update();
  }
});
