// Light / dark theme.
// The initial theme is applied by the inline <head> script (no flash).
// This module wires up toggles: <button data-theme-toggle>…</button>
import { STORAGE_KEYS, store, $$ } from "./utils.js";

const root = document.documentElement;
const media = window.matchMedia("(prefers-color-scheme: dark)");

const current = () => root.dataset.theme || "light";

function apply(theme) {
  root.dataset.theme = theme;
  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  $$("[data-theme-toggle]").forEach((btn) => btn.setAttribute("aria-label", label));
}

export function initTheme() {
  apply(current());

  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-theme-toggle]")) return;
    const next = current() === "dark" ? "light" : "dark";
    store.set(STORAGE_KEYS.theme, next);
    apply(next);
  });

  // Follow the OS setting until the user picks a theme explicitly.
  media.addEventListener("change", (e) => {
    if (!store.get(STORAGE_KEYS.theme)) apply(e.matches ? "dark" : "light");
  });
}
