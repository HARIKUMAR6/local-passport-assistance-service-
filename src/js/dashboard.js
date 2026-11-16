// Application guide. Informational only: it has no accounts, collects no input
// and handles no files. The guide sections are switched client-side.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;

const h = new Date().getHours();
$("[data-greeting]").textContent = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

/* ---- Views, sidebar ------------------------------------------------------- */
const titles = { overview: "Overview", application: "Process", documents: "Documents", appointments: "Appointments", support: "Help & support" };
const sidebar = $("#sidebar");
const scrim = $("[data-sidebar-scrim]");
const menuBtn = $("[data-sidebar-open]");
const mq = window.matchMedia("(min-width: 64rem)");

function openSidebar() {
  sidebar.classList.add("is-open");
  scrim.hidden = false;
  menuBtn.setAttribute("aria-expanded", "true");
  document.body.classList.add("overflow-hidden");
  $(".side-link", sidebar).focus();
}
function closeSidebar() {
  if (!sidebar.classList.contains("is-open")) return;
  sidebar.classList.remove("is-open");
  scrim.hidden = true;
  menuBtn.setAttribute("aria-expanded", "false");
  document.body.classList.remove("overflow-hidden");
}
menuBtn.addEventListener("click", openSidebar);
$("[data-sidebar-close]").addEventListener("click", () => { closeSidebar(); menuBtn.focus(); });
scrim.addEventListener("click", closeSidebar);
mq.addEventListener("change", (e) => e.matches && closeSidebar());
document.addEventListener("keydown", (e) => e.key === "Escape" && closeSidebar());

function showView(name, push = true) {
  if (!titles[name]) name = "overview";
  $$("[data-view]").forEach((v) => (v.hidden = v.dataset.view !== name));
  $$("[data-nav]").forEach((a) => (a.dataset.nav === name ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  $("[data-view-title]").textContent = titles[name];
  document.title = `${titles[name]} — Meridian Passage`;
  if (push && location.hash !== `#${name}`) history.pushState(null, "", `#${name}`);
  closeSidebar();
  scrollTo({ top: 0, behavior: "auto" });
}
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-nav], [data-go-view]");
  if (!a) return;
  e.preventDefault();
  showView(a.dataset.nav || a.dataset.goView);
});
window.addEventListener("popstate", () => showView(location.hash.slice(1), false));

/* ---- Process steps -------------------------------------------------------- */
const steps = [
  { name: "Consultation", text: "We discuss your situation and what you need." },
  { name: "Document review", text: "We check your documents against current requirements." },
  { name: "Preparation", text: "Forms are completed accurately and reviewed with you." },
  { name: "Appointment", text: "We help you find and prepare for your appointment." },
  { name: "Submission", text: "Your application is submitted to the passport authority and followed up." },
];
let selected = 0;
function renderTrackers() {
  $$("[data-tracker]").forEach((ol) => {
    ol.innerHTML = steps.map((s, i) => {
      const pressed = ol.dataset.tracker === "full" ? ` aria-pressed="${i === selected}"` : "";
      return `<li class="stepper__item"><button type="button" class="stepper__step" data-step="${i}"${pressed}><span class="stepper__dot"><span>${i + 1}</span></span><span class="stepper__name">${esc(s.name)}</span></button></li>`;
    }).join("");
  });
  const s = steps[selected];
  $("[data-step-detail]").innerHTML = `<strong>${esc(s.name)}</strong><p>${esc(s.text)}</p>`;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-step]");
  if (!b) return;
  const compact = !!b.closest("[data-tracker='compact']");
  selected = +b.dataset.step;
  renderTrackers();
  if (compact) showView("application");
});

/* ---- Typical documents (read-only) ---------------------------------------- */
const docs = [
  { name: "Current passport (photo page)", hint: "Clear colour copy, all four corners visible" },
  { name: "Government-issued photo ID", hint: "Driver licence or national ID card" },
  { name: "Proof of address", hint: "Utility bill or bank statement from the last 3 months" },
  { name: "Passport photo", hint: "Plain white background, taken in the last 6 months" },
  { name: "Signed application form", hint: "Signed and dated on the final page" },
  { name: "Payment receipt", hint: "Receipt for the government processing fee" },
];
$("[data-doc-list]").innerHTML = docs.map((d) => `<li class="doc"><span class="doc__icon">${icon("i-file")}</span><div class="doc__main"><p class="doc__name">${esc(d.name)}</p><p class="doc__hint">${esc(d.hint)}</p></div></li>`).join("");
$("[data-doc-mini]").innerHTML = docs.map((d) => `<li><span>${esc(d.name)}</span></li>`).join("");

renderTrackers();
showView(location.hash.slice(1), false);
