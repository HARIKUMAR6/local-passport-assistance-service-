// Home page interactions. Every feature is opt-in via a data- attribute, so
// each homepage only runs what its markup contains.
import { $$ } from "./utils.js";

// Tabs — [data-tabs] > [role=tablist] [role=tab][aria-controls] + [role=tabpanel]
function initTabs() {
  $$("[data-tabs]").forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    };
    root.addEventListener("click", (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (tab) select(tab);
    });
    root.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const rtl = document.dir === "rtl";
      const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 }[e.key];
      let next;
      if (step) next = tabs[(i + step + tabs.length) % tabs.length];
      else if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      if (!next) return;
      e.preventDefault();
      select(next, true);
    });
  });
}

// Region filter — [data-filter] with [data-filter-value] buttons and [data-region] items
function initFilter() {
  $$("[data-filter]").forEach((root) => {
    const buttons = [...root.querySelectorAll("[data-filter-value]")];
    const items = [...root.querySelectorAll("[data-region]")];
    const count = root.querySelector("[data-filter-count]");
    root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter-value]");
      if (!btn) return;
      const value = btn.dataset.filterValue;
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      let shown = 0;
      items.forEach((item) => {
        const show = value === "all" || item.dataset.region === value;
        item.hidden = !show;
        if (show) shown++;
      });
      if (count) count.textContent = `${shown} ${shown === 1 ? "country" : "countries"} shown`;
    });
  });
}

// Checklist progress — [data-checklist] with checkboxes, [data-progress-text], [data-progress-bar]
function initChecklist() {
  $$("[data-checklist]").forEach((root) => {
    const boxes = [...root.querySelectorAll('input[type="checkbox"]')];
    const text = root.querySelector("[data-progress-text]");
    const bar = root.querySelector("[data-progress-bar]");
    const update = () => {
      const done = boxes.filter((b) => b.checked).length;
      if (text) text.textContent = `${done} of ${boxes.length} ready`;
      if (bar) bar.style.inlineSize = `${(done / boxes.length) * 100}%`;
      bar?.parentElement.setAttribute("aria-valuenow", String(done));
    };
    root.addEventListener("change", update);
    update();
  });
}

// Country checker — [data-country-check] with an input, [data-country-result], and [data-country] names
function initCountryCheck() {
  $$("[data-country-check]").forEach((root) => {
    const input = root.querySelector("input");
    const result = root.querySelector("[data-country-result]");
    const names = [...root.querySelectorAll("[data-country]")].map((el) => el.dataset.country);
    const render = () => {
      const q = input.value.trim().toLowerCase();
      result.className = "mt-4 flex min-h-12 items-center gap-3 rounded-md px-4 py-3 text-sm font-medium";
      if (!q) {
        result.classList.add("bg-surface-2", "text-ink-muted");
        result.textContent = "Type a country to check our coverage.";
        return;
      }
      const match = names.find((n) => n.toLowerCase() === q) || names.find((n) => n.toLowerCase().startsWith(q));
      if (match) {
        result.classList.add("bg-success-bg", "text-success");
        result.textContent = `Yes, we support passport applicants in ${match}.`;
      } else {
        result.classList.add("bg-warning-bg", "text-warning");
        result.textContent = "Not on our list yet. Contact us and we will confirm whether we can help.";
      }
    };
    input.addEventListener("input", render);
    root.addEventListener("submit", (e) => { e.preventDefault(); render(); });
    render();
  });
}

initTabs();
initFilter();
initChecklist();
initCountryCheck();
