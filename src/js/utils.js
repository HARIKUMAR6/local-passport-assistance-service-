// Shared helpers. Storage access is wrapped because it can throw
// (private mode, blocked site data).

export const STORAGE_KEYS = { theme: "mp-theme", dir: "mp-dir" };

export const store = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  },
};

export const $$ = (selector, root = document) => root.querySelectorAll(selector);

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
