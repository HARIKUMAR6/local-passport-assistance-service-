// Documents checklist extras. Progress bars live in home.js (initChecklist);
// this module adds: persistence, reset, print, and the country picker.
// Storage access is wrapped: it can throw (private mode, blocked site data).
import { $$, store } from "./utils.js";

const KEY = (id) => `mp-checklist-${id}`;

function restore(root) {
  const boxes = [...root.querySelectorAll('input[type="checkbox"]')];
  let saved;
  try { saved = JSON.parse(store.get(KEY(root.dataset.checklist)) || "null"); } catch { saved = null; }
  if (Array.isArray(saved)) boxes.forEach((b, i) => (b.checked = !!saved[i]));
  root.dispatchEvent(new Event("change", { bubbles: true })); // let home.js refresh progress
}

function initChecklists() {
  $$("[data-checklist]").forEach((root) => {
    const boxes = () => [...root.querySelectorAll('input[type="checkbox"]')];
    restore(root);
    root.addEventListener("change", (e) => {
      if (!e.isTrusted) return;
      store.set(KEY(root.dataset.checklist), JSON.stringify(boxes().map((b) => b.checked)));
    });
    root.querySelector("[data-reset]")?.addEventListener("click", () => {
      boxes().forEach((b) => (b.checked = false));
      store.set(KEY(root.dataset.checklist), JSON.stringify(boxes().map(() => false)));
      root.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
  document.addEventListener("click", (e) => { if (e.target.closest("[data-print]")) window.print(); });
}

// Country picker: sends the visitor to the contact form with country + topic pre-filled.
function initCountryPicker() {
  $$("[data-country-picker]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const country = form.elements.country.value;
      if (!country) { form.elements.country.focus(); form.querySelector("[data-picker-hint]").hidden = false; return; }
      location.href = `contact.html?topic=documents&country=${encodeURIComponent(country)}#form`;
    });
    form.elements.country.addEventListener("change", () => (form.querySelector("[data-picker-hint]").hidden = true));
  });
}

initChecklists();
initCountryPicker();
