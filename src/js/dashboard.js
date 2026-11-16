// Client portal dashboard. Account data, applications, appointments and
// uploads are not connected to any service yet, so every list starts empty,
// files are only previewed in the browser, and requests report that they
// cannot be submitted.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;

/* ---- Toasts --------------------------------------------------------------- */
function toast(msg, kind = "success") {
  const el = document.createElement("div");
  el.className = "toast";
  el.dataset.kind = kind;
  el.innerHTML = `${icon(kind === "error" ? "i-alert" : "i-check")}<span>${esc(msg)}</span>`;
  $("[data-toasts]").append(el);
  requestAnimationFrame(() => el.classList.add("is-in"));
  setTimeout(() => { el.classList.remove("is-in"); setTimeout(() => el.remove(), 300); }, 4200);
}

/* ---- Activity ------------------------------------------------------------- */
const activity = [];
const emptyActivity = `<li class="empty empty--pad">${icon("i-activity")}<p><strong>No activity yet</strong></p><p>Updates on your application will appear here.</p></li>`;
function activityHtml(items, fresh = -1) {
  if (!items.length) return emptyActivity;
  return items.map((a, i) => `<li class="activity__item ${i === fresh ? "is-new" : ""}"><span class="activity__dot">${icon(a.icon)}</span><div><p>${esc(a.text)}</p><time>${esc(a.when)}</time></div></li>`).join("");
}
function renderActivity(fresh = -1) {
  $("[data-activity]").innerHTML = activityHtml(activity, fresh);
  $("[data-activity-recent]").innerHTML = activityHtml(activity.slice(0, 4), fresh);
}
function logActivity(text, iconId = "i-activity") {
  const d = new Date();
  const when = `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  activity.unshift({ text, icon: iconId, when });
  renderActivity(0);
}

/* ---- Popovers ------------------------------------------------------------- */
function closePops(except) {
  $$("[data-pop]").forEach((b) => {
    if (b === except) return;
    b.setAttribute("aria-expanded", "false");
    document.getElementById(b.dataset.pop).hidden = true;
  });
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-pop]");
  if (t) {
    const panel = document.getElementById(t.dataset.pop);
    const open = panel.hidden;
    closePops(t);
    panel.hidden = !open;
    t.setAttribute("aria-expanded", String(open));
    return;
  }
  if (!e.target.closest(".pop") || e.target.closest(".pop__item")) closePops();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const open = $("[data-pop][aria-expanded='true']");
  if (open) { closePops(); open.focus(); }
  else closeSidebar();
});

/* ---- Dialogs -------------------------------------------------------------- */
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) e.target.closest("dialog").close();
  else if (e.target.matches("dialog.dlg")) e.target.close();
});
$$("dialog.dlg").forEach((d) => d.addEventListener("close", () => d._opener?.focus()));

document.addEventListener("click", (e) => {
  if (!e.target.closest("[data-signout]")) return;
  location.href = "login.html";
});

function fieldError(input, msg) {
  const w = input.closest(".field");
  w.classList.toggle("has-error", !!msg);
  $(".error-text", w).textContent = msg;
  if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
  return msg;
}

/* ---- Greeting ------------------------------------------------------------- */
const h = new Date().getHours();
$("[data-greeting]").textContent = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

/* ---- Views, sidebar ------------------------------------------------------- */
const titles = { overview: "Overview", application: "Application", documents: "Documents", appointments: "Appointments", activity: "Activity", support: "Help & support" };
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

function showView(name, push = true) {
  if (!titles[name]) name = "overview";
  $$("[data-view]").forEach((v) => (v.hidden = v.dataset.view !== name));
  $$("[data-nav]").forEach((a) => (a.dataset.nav === name ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  $("[data-view-title]").textContent = titles[name];
  document.title = `${titles[name]} — Meridian Passage`;
  if (push && location.hash !== `#${name}`) history.pushState(null, "", `#${name}`);
  closePops();
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
  { name: "Submission", text: "Your application is submitted and followed up." },
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

/* ---- Documents ------------------------------------------------------------ */
const MAX = 5 * 1024 * 1024;
const OK = ["image/jpeg", "image/png", "application/pdf"];
const docs = [
  { id: "passport", name: "Current passport (photo page)", hint: "Clear colour scan, all four corners visible" },
  { id: "id", name: "Government-issued photo ID", hint: "Driver licence or national ID card" },
  { id: "address", name: "Proof of address", hint: "Utility bill or bank statement from the last 3 months" },
  { id: "photo", name: "Passport photo", hint: "Plain white background, taken in the last 6 months" },
  { id: "form", name: "Signed application form", hint: "Signed and dated on the final page" },
  { id: "payment", name: "Payment receipt", hint: "Receipt for the government processing fee" },
].map((d) => ({ ...d, status: "needed" }));
const labels = {
  needed: ["badge-warning", "Required"],
  loading: ["badge-info", "Loading…"],
  selected: ["badge-success", "Selected"],
};
const list = $("[data-doc-list]");
const input = $("[data-file-input]");
let target = null;
let current = null;
const fmtSize = (n) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

function renderDocs() {
  list.innerHTML = docs.map((d) => {
    const [cls, txt] = labels[d.status];
    const file = d.file
      ? `<p class="doc__file">${icon("i-file")}<span>${esc(d.file.name)} · ${fmtSize(d.file.size)}</span></p>`
      : `<p class="doc__hint">${esc(d.hint)}</p>`;
    const actions = d.file
      ? `<button type="button" class="btn btn-sm" data-doc-view="${d.id}">${icon("i-eye")}View</button><button type="button" class="btn btn-sm btn-ghost" data-doc-remove="${d.id}" aria-label="Remove ${esc(d.name)}">${icon("i-trash")}</button>`
      : `<button type="button" class="btn btn-sm btn-primary" data-doc-upload="${d.id}">${icon("i-upload")}Choose file</button>`;
    return `<li class="doc ${d.status === "needed" ? "is-needed" : ""}" data-doc="${d.id}">
      <span class="doc__icon">${icon(d.status === "needed" ? "i-upload" : "i-file-check")}</span>
      <div class="doc__main"><p class="doc__name">${esc(d.name)}</p>${file}${d.status === "loading" ? `<div class="progress doc__bar"><span style="inline-size:${d.pct || 0}%"></span></div>` : ""}</div>
      <span class="badge ${cls}">${txt}</span>
      <div class="doc__actions">${actions}</div>
    </li>`;
  }).join("");

  const needed = docs.filter((d) => d.status === "needed");
  $("[data-doc-mini]").innerHTML = needed.length
    ? needed.map((d) => `<li><span>${esc(d.name)}</span><button type="button" class="btn btn-sm" data-doc-upload="${d.id}">${icon("i-upload")}Choose file</button></li>`).join("")
    : `<li class="mini-done">${icon("i-check")}<span>All documents selected.</span></li>`;

  const ready = docs.length - needed.length;
  $$("[data-doc-count]").forEach((el) => (el.textContent = ready));
  $$("[data-doc-total]").forEach((el) => (el.textContent = docs.length));
  $("[data-doc-note]").textContent = needed.length ? `${needed.length} to add` : "All added";
  const nb = $("[data-nav-badge='documents']");
  nb.textContent = needed.length;
  nb.hidden = !needed.length;
}

function validate(file) {
  if (!OK.includes(file.type)) return "That file type is not supported. Please choose a JPG, PNG or PDF.";
  if (file.size > MAX) return `That file is ${fmtSize(file.size)}. Please choose one under 5 MB.`;
  if (file.size === 0) return "That file looks empty. Please choose another.";
  return "";
}

async function attach(doc, file) {
  const err = validate(file);
  if (err) { toast(err, "error"); return; }
  if (doc.url) URL.revokeObjectURL(doc.url);
  doc.file = file;
  doc.url = URL.createObjectURL(file);
  doc.status = "loading";
  doc.pct = 0;
  showPreview(doc);
  renderDocs();
  for (const p of [25, 55, 85, 100]) {
    await wait(140);
    if (doc.status !== "loading") return;
    doc.pct = p;
    const bar = $(`[data-doc="${doc.id}"] .doc__bar span`);
    if (bar) bar.style.inlineSize = `${p}%`;
  }
  doc.status = "selected";
  renderDocs();
  logActivity(`Selected ${doc.name}`, "i-file");
  toast("File selected.");
}

function removeDoc(doc) {
  if (doc.url) URL.revokeObjectURL(doc.url);
  doc.file = doc.url = null;
  doc.status = "needed";
  if (current === doc) showPreview(null);
  renderDocs();
}

function showPreview(doc) {
  current = doc;
  $("[data-preview-empty]").hidden = !!doc;
  $("[data-preview-filled]").hidden = !doc;
  if (!doc) return;
  $("[data-preview-thumb]").innerHTML = doc.file.type.startsWith("image/")
    ? `<img src="${doc.url}" alt="Preview of ${esc(doc.file.name)}">`
    : `<div class="pdf-card">${icon("i-file")}<span>PDF</span></div>`;
  $("[data-preview-name]").textContent = doc.file.name;
  $("[data-preview-meta]").textContent = `${doc.name} · ${fmtSize(doc.file.size)}`;
}
function openLarge(doc) {
  const f = doc.file;
  $("[data-dlg-preview]").innerHTML = f.type === "application/pdf"
    ? `<iframe src="${doc.url}" title="${esc(f.name)}"></iframe>`
    : `<img src="${doc.url}" alt="${esc(f.name)}">`;
  $("#dlg-preview-title").textContent = f.name;
  const d = $("#dlg-preview");
  d._opener = document.activeElement;
  d.showModal();
}

document.addEventListener("click", (e) => {
  const find = (attr) => { const b = e.target.closest(`[${attr}]`); return b && docs.find((d) => d.id === b.getAttribute(attr)); };
  const up = find("data-doc-upload");
  if (up) { target = up; input.click(); return; }
  const view = find("data-doc-view");
  if (view) { showPreview(view); openLarge(view); return; }
  const rm = find("data-doc-remove");
  if (rm) removeDoc(rm);
});
input.addEventListener("change", () => {
  const f = input.files[0];
  if (f && target) attach(target, f);
  input.value = "";
});
["dragenter", "dragover"].forEach((t) => list.addEventListener(t, (e) => {
  const row = e.target.closest("[data-doc]");
  if (!row) return;
  e.preventDefault();
  $$(".is-drop", list).forEach((r) => r !== row && r.classList.remove("is-drop"));
  row.classList.add("is-drop");
}));
list.addEventListener("dragleave", (e) => { if (!list.contains(e.relatedTarget)) $$(".is-drop", list).forEach((r) => r.classList.remove("is-drop")); });
list.addEventListener("drop", (e) => {
  e.preventDefault();
  $$(".is-drop", list).forEach((r) => r.classList.remove("is-drop"));
  const row = e.target.closest("[data-doc]");
  const doc = row && docs.find((d) => d.id === row.dataset.doc);
  const f = e.dataTransfer.files[0];
  if (!doc || !f) return;
  if (doc.status !== "needed") { toast(`${doc.name} already has a file selected.`, "error"); return; }
  attach(doc, f);
});
$("[data-preview-open]").addEventListener("click", () => current && openLarge(current));
$("[data-preview-clear]").addEventListener("click", () => current && removeDoc(current));

/* ---- Appointment help request --------------------------------------------- */
const form = $("[data-appt-form]");
const dateInput = form.elements.date;
const iso = (d) => d.toISOString().slice(0, 10);
const now = Date.now();
dateInput.min = iso(new Date(now + 86400000));
dateInput.max = iso(new Date(now + 90 * 86400000));

const apptRules = {
  type: (v) => (v ? "" : "Please choose the type of help you need."),
  location: (v) => (v ? "" : "Please choose a location."),
  date: (v) => {
    if (!v) return "Please choose a preferred date.";
    if (v < dateInput.min) return "Please choose a date from tomorrow onwards.";
    if (v > dateInput.max) return "Please choose a date within the next 90 days.";
    const day = new Date(v + "T12:00:00").getDay();
    return day === 0 || day === 6 ? "Appointments are available on weekdays only." : "";
  },
};
const apptCheck = (f) => fieldError(f, apptRules[f.name](f.value));
["type", "location", "date"].forEach((n) => {
  const f = form.elements[n];
  f.addEventListener("change", () => apptCheck(f));
  f.addEventListener("blur", () => f.value && apptCheck(f));
});
form.elements.notes.addEventListener("input", (e) => ($("[data-notes-count]").textContent = e.target.value.length));

function summarise(errs) {
  const box = $("[data-appt-summary]");
  box.hidden = !errs.length;
  $("ul", box).replaceChildren(...errs.map(({ f, m }) => {
    const li = document.createElement("li"), a = document.createElement("a");
    a.href = `#${f.id}`; a.textContent = m;
    a.addEventListener("click", (ev) => { ev.preventDefault(); f.focus(); });
    li.append(a); return li;
  }));
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const unavailable = $("[data-appt-unavailable]");
  unavailable.hidden = true;
  const errs = ["type", "location", "date"].map((n) => form.elements[n]).map((f) => ({ f, m: apptCheck(f) })).filter((x) => x.m);
  summarise(errs);
  if (errs.length) { errs[0].f.focus(); return; }
  const btn = $("[data-appt-submit]");
  btn.disabled = true; btn.classList.add("is-busy");
  await wait(600);
  btn.disabled = false; btn.classList.remove("is-busy");
  // No appointment service is connected, so the request cannot be submitted.
  unavailable.hidden = false;
});

/* ---- Init ----------------------------------------------------------------- */
renderActivity();
renderTrackers();
renderDocs();
showView(location.hash.slice(1), false);
