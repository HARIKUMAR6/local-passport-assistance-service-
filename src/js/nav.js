// Header navigation: full-screen mobile menu, click-to-open dropdowns, Escape, scrolled state.
// Hooks (see partials/header.html):
//   [data-nav-toggle][aria-controls]   menu button        -> panel gets [data-open]
//   [data-dropdown-toggle][aria-controls] dropdown button  -> submenu gets [data-open]
//   [data-header]                      gets .is-scrolled
import { $$ } from "./utils.js";

const desktop = window.matchMedia("(min-width: 64rem)"); // Tailwind lg
const header = document.querySelector("[data-header]");
const toggle = document.querySelector("[data-nav-toggle]");
const menu = toggle && document.getElementById(toggle.getAttribute("aria-controls"));

const dropdownPanel = (btn) => document.getElementById(btn.getAttribute("aria-controls"));
const openDropdown = () => document.querySelector("[data-dropdown-toggle][aria-expanded='true']");

function setDropdown(btn, open) {
  btn.setAttribute("aria-expanded", String(open));
  dropdownPanel(btn)?.toggleAttribute("data-open", open);
}

function closeDropdowns(except) {
  $$("[data-dropdown-toggle]").forEach((btn) => btn !== except && setDropdown(btn, false));
}

function setMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  menu.toggleAttribute("data-open", open);
  document.body.classList.toggle("overflow-hidden", open);
  // Keep keyboard / screen-reader focus inside the open menu.
  $$("main, footer").forEach((el) => (el.inert = open));
  if (open) menu.querySelector("a, button")?.focus();
  else closeDropdowns();
}

export function initNav() {
  if (!header || !toggle || !menu) return;

  document.addEventListener("click", (e) => {
    const dd = e.target.closest("[data-dropdown-toggle]");
    if (dd) {
      const open = dd.getAttribute("aria-expanded") !== "true";
      closeDropdowns(dd);
      setDropdown(dd, open);
      return;
    }
    if (e.target.closest("[data-nav-toggle]")) {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
      return;
    }
    if (!e.target.closest("[data-dropdown]")) closeDropdowns();
    if (e.target.closest("#site-menu a")) setMenu(false);
  });

  document.addEventListener("keydown", (e) => {
    const dd = openDropdown();
    if (e.key === "Escape") {
      if (dd) { setDropdown(dd, false); dd.focus(); }
      else if (toggle.getAttribute("aria-expanded") === "true") { setMenu(false); toggle.focus(); }
    } else if (e.key === "ArrowDown" && e.target.matches("[data-dropdown-toggle]")) {
      e.preventDefault();
      closeDropdowns(e.target);
      setDropdown(e.target, true);
      dropdownPanel(e.target).querySelector("a")?.focus();
    }
  });

  // Close a dropdown when focus leaves it.
  document.addEventListener("focusout", (e) => {
    const wrap = e.target.closest("[data-dropdown]");
    if (wrap && !wrap.contains(e.relatedTarget)) closeDropdowns();
  });

  desktop.addEventListener("change", (e) => e.matches && setMenu(false));

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
