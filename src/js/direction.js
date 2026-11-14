// LTR / RTL layout direction (content stays English: lang="en").
// The initial direction is applied by the inline <head> script.
// Toggle: <button data-dir-toggle>…</button>
import { STORAGE_KEYS, store, $$ } from "./utils.js";

const root = document.documentElement;

function apply(dir) {
  root.dir = dir;
  const label = dir === "rtl" ? "Switch to LTR layout" : "Switch to RTL layout";
  $$("[data-dir-toggle]").forEach((btn) => btn.setAttribute("aria-label", label));
}

export function initDirection() {
  apply(root.dir === "rtl" ? "rtl" : "ltr");

  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-dir-toggle]")) return;
    const next = root.dir === "rtl" ? "ltr" : "rtl";
    store.set(STORAGE_KEYS.dir, next);
    apply(next);
  });
}
