// Client portal dashboard. Front end only: files are previewed in the browser
// and never stored or sent, appointment requests are not booked anywhere, and
// activity lives in memory for the current visit.
import { store } from "./utils.js";

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
const activity = [
  { text: "Identity documents verified", icon: "i-check", tone: "is-success", when: "Nov 8, 2026 · 10:42" },
  { text: "Daniel Reyes left a note: “Photo needs a plain white background.”", icon: "i-message", when: "Nov 7, 2026 · 16:05" },
  { text: "Proof of address uploaded", icon: "i-upload", when: "Nov 5, 2026 · 09:18" },
  { text: "Application received", icon: "i-file-check", when: "Nov 3, 2026 · 14:30" },
];
function activityHtml(items, fresh = -1) {
  return items.map((a, i) => `<li class="activity__item ${i === fresh ? "is-new" : ""}"><span class="activity__dot ${a.tone || ""}">${icon(a.icon)}</span><div><p>${esc(a.text)}</p><time>${esc(a.when)}</time></div></li>`).join("");
}
function renderActivity(fresh = -1) {
  $("[data-activity]").innerHTML = activityHtml(activity, fresh);
  $("[data-activity-recent]").innerHTML = activityHtml(activity.slice(0, 4), fresh);
}
function logActivity(text, iconId = "i-activity", tone = "") {
  const d = new Date();
  const when = `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  activity.unshift({ text, icon: iconId, tone, when });
  renderActivity(0);
}

/* ---- Notifications & popovers -------------------------------------------- */
const notes = [
  { text: "Your advisor left a note about your passport photo.", when: "Nov 7", unread: true },
  { text: "Identity documents were verified.", when: "Nov 8", unread: true },
  { text: "3 documents are still needed to continue.", when: "Today", unread: true },
];
function renderNotes() {
  $("[data-notify-list]").innerHTML = notes.map((n) => `<li class="${n.unread ? "is-unread" : ""}"><p>${esc(n.text)}</p><time>${esc(n.when)}</time></li>`).join("");
  const c = notes.filter((n) => n.unread).length;
  const badge = $("[data-notify-count]");
  badge.textContent = c;
  badge.hidden = !c;
  badge.closest("button").setAttribute("aria-label", c ? `Notifications, ${c} unread` : "Notifications");
}
$("[data-notify-read]").addEventListener("click", () => { notes.forEach((n) => (n.unread = false)); renderNotes(); });

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
  const open = e.target.closest("[data-open]");
  if (open) {
    const d = document.getElementById(open.dataset.open);
    const pop = open.closest(".pop");
    d._opener = pop ? $(`[data-pop="${pop.id}"]`) : open;
    if (d.id === "dlg-profile") fillProfileForm();
    closeSidebar();
    d.showModal();
    return;
  }
  if (e.target.closest("[data-close]")) e.target.closest("dialog").close();
  else if (e.target.matches("dialog.dlg")) e.target.close();
});
$$("dialog.dlg").forEach((d) => d.addEventListener("close", () => d._opener?.focus()));

/* ---- Profile -------------------------------------------------------------- */
const USER_KEY = "mp-user";
const user = { name: "Amelia Hart", email: "amelia.hart@example.com", phone: "+1 (555) 014-3382" };
try { Object.assign(user, JSON.parse(store.get(USER_KEY) || "{}")); } catch { /* keep defaults */ }

function renderUser() {
  const parts = user.name.trim().split(/\s+/);
  const h = new Date().getHours();
  $("[data-greeting]").textContent = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  $("[data-user-first]").textContent = parts[0] || "there";
  $$("[data-user-name]").forEach((el) => (el.textContent = user.name));
  $$("[data-user-email]").forEach((el) => (el.textContent = user.email));
  $$("[data-user-phone]").forEach((el) => (el.textContent = user.phone));
  $$("[data-avatar]").forEach((el) => (el.textContent = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("") || "?"));
}
function fieldError(input, msg) {
  const w = input.closest(".field");
  w.classList.toggle("has-error", !!msg);
  $(".error-text", w).textContent = msg;
  if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
  return msg;
}
function fillProfileForm() {
  const f = $("[data-profile-form]");
  f.elements.name.value = user.name;
  f.elements.phone.value = user.phone;
  [f.elements.name, f.elements.phone].forEach((i) => fieldError(i, ""));
}
$("[data-profile-form]").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const bad = [
    fieldError(f.elements.name, f.elements.name.value.trim().length < 2 ? "Please enter your full name." : ""),
    fieldError(f.elements.phone, /^[+()\d\s.-]{7,20}$/.test(f.elements.phone.value.trim()) ? "" : "Enter a valid phone number."),
  ].some(Boolean);
  if (bad) { $("[aria-invalid]", f)?.focus(); return; }
  user.name = f.elements.name.value.trim();
  user.phone = f.elements.phone.value.trim();
  store.set(USER_KEY, JSON.stringify(user));
  renderUser();
  f.closest("dialog").close();
  logActivity("Profile details updated", "i-edit");
  toast("Profile updated.");
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("[data-signout]")) return;
  store.set(USER_KEY, "");
  location.href = "login.html";
});

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

/* ---- Progress tracker ----------------------------------------------------- */
const steps = [
  { name: "Application received", date: "Nov 3", text: "We received your renewal request and opened your file on Nov 3." },
  { name: "Document review", date: "Nov 8", text: "Your identity documents were checked and verified on Nov 8." },
  { name: "Advisor check", date: "In progress", text: "Daniel is reviewing your complete file for accuracy. Outstanding documents may slow this step." },
  { name: "Appointment", date: "Upcoming", text: "Once your documents are ready we will help you secure an appointment slot." },
  { name: "Final submission", date: "Upcoming", text: "We submit your finished application and share tracking details with you." },
];
const CURRENT = 2;
let selected = CURRENT;
function renderTrackers() {
  $$("[data-tracker]").forEach((ol) => {
    ol.innerHTML = steps.map((s, i) => {
      const state = i < CURRENT ? "is-done" : i === CURRENT ? "is-current" : "";
      const dot = i < CURRENT ? icon("i-check") : `<span>${i + 1}</span>`;
      const pressed = ol.dataset.tracker === "full" ? ` aria-pressed="${i === selected}"` : "";
      return `<li class="stepper__item ${state}"><button type="button" class="stepper__step" data-step="${i}"${pressed}${i === CURRENT ? ' aria-current="step"' : ""}><span class="stepper__dot">${dot}</span><span class="stepper__name">${esc(s.name)}</span><span class="stepper__date">${esc(s.date)}</span></button></li>`;
    }).join("");
  });
  const s = steps[selected];
  $("[data-step-detail]").innerHTML = `<strong>${esc(s.name)}</strong><p>${esc(s.text)}</p>`;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-step]");
  if (!b) return;
  selected = +b.dataset.step;
  renderTrackers();
  if (b.closest("[data-tracker='compact']")) showView("application");
});

/* ---- Documents ------------------------------------------------------------ */
const MAX = 5 * 1024 * 1024;
const OK = ["image/jpeg", "image/png", "application/pdf"];
const docs = [
  { id: "passport", name: "Current passport (photo page)", hint: "Clear colour scan, all four corners visible", status: "verified" },
  { id: "id", name: "Government-issued photo ID", hint: "Driver licence or national ID card", status: "verified" },
  { id: "address", name: "Proof of address", hint: "Utility bill or bank statement from the last 3 months", status: "review" },
  { id: "photo", name: "Passport photo", hint: "2 × 2 in, plain white background, taken in the last 6 months", status: "needed" },
  { id: "form", name: "Signed application form", hint: "Signed and dated on the final page", status: "needed" },
  { id: "payment", name: "Payment receipt", hint: "Receipt for the government processing fee", status: "needed" },
];
const labels = {
  verified: ["badge-success", "Verified"],
  review: ["badge-info", "In review"],
  needed: ["badge-warning", "Needed"],
  uploading: ["badge-info", "Uploading…"],
  uploaded: ["badge-info", "Uploaded · in review"],
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
      : d.status === "needed"
        ? `<button type="button" class="btn btn-sm btn-primary" data-doc-upload="${d.id}">${icon("i-upload")}Upload</button>`
        : "";
    return `<li class="doc ${d.status === "needed" ? "is-needed" : ""}" data-doc="${d.id}">
      <span class="doc__icon">${icon(d.status === "needed" ? "i-upload" : "i-file-check")}</span>
      <div class="doc__main"><p class="doc__name">${esc(d.name)}</p>${file}${d.status === "uploading" ? `<div class="progress doc__bar"><span style="inline-size:${d.pct || 0}%"></span></div>` : ""}</div>
      <span class="badge ${cls}">${txt}</span>
      <div class="doc__actions">${actions}</div>
    </li>`;
  }).join("");

  const needed = docs.filter((d) => d.status === "needed");
  $("[data-doc-mini]").innerHTML = needed.length
    ? needed.map((d) => `<li><span>${esc(d.name)}</span><button type="button" class="btn btn-sm" data-doc-upload="${d.id}">${icon("i-upload")}Upload</button></li>`).join("")
    : `<li class="mini-done">${icon("i-check")}<span>Everything has been received.</span></li>`;

  const ready = docs.length - needed.length;
  $$("[data-doc-count]").forEach((el) => (el.textContent = ready));
  $$("[data-doc-total]").forEach((el) => (el.textContent = docs.length));
  $("[data-doc-note]").textContent = needed.length ? `${needed.length} still needed` : "All received";
  const nb = $("[data-nav-badge='documents']");
  nb.textContent = needed.length;
  nb.hidden = !needed.length;

  const pct = Math.round(40 + (ready / docs.length) * 20);
  $$("[data-progress-pct]").forEach((el) => (el.textContent = `${pct}%`));
  const bar = $("[data-progress-bar]");
  bar.setAttribute("aria-valuenow", pct);
  $("span", bar).style.inlineSize = `${pct}%`;
  $("[data-progress-fill]").style.inlineSize = `${pct}%`;
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
  doc.status = "uploading";
  doc.pct = 0;
  showPreview(doc);
  renderDocs();
  for (const p of [18, 41, 67, 88, 100]) {
    await wait(180);
    if (doc.status !== "uploading") return;
    doc.pct = p;
    const bar = $(`[data-doc="${doc.id}"] .doc__bar span`);
    if (bar) bar.style.inlineSize = `${p}%`;
  }
  doc.status = "uploaded";
  renderDocs();
  logActivity(`${doc.name} added`, "i-upload");
  toast(`${doc.name} added.`);
}

function removeDoc(doc) {
  if (doc.url) URL.revokeObjectURL(doc.url);
  doc.file = doc.url = null;
  doc.status = "needed";
  if (current === doc) showPreview(null);
  renderDocs();
  logActivity(`${doc.name} removed`, "i-trash");
  toast(`${doc.name} removed.`);
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
  if (doc.status !== "needed") { toast(`${doc.name} has already been received.`, "error"); return; }
  attach(doc, f);
});
$("[data-preview-open]").addEventListener("click", () => current && openLarge(current));
$("[data-preview-clear]").addEventListener("click", () => current && removeDoc(current));

/* ---- Appointment request -------------------------------------------------- */
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

let request = null;
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errs = ["type", "location", "date"].map((n) => form.elements[n]).map((f) => ({ f, m: apptCheck(f) })).filter((x) => x.m);
  summarise(errs);
  if (errs.length) { errs[0].f.focus(); return; }
  const btn = $("[data-appt-submit]");
  btn.disabled = true; btn.classList.add("is-busy");
  await wait(1000);
  btn.disabled = false; btn.classList.remove("is-busy");
  const d = new Date(form.elements.date.value + "T12:00:00");
  request = {
    ref: `AP-${Math.floor(1000 + Math.random() * 9000)}`,
    type: form.elements.type.value,
    location: form.elements.location.value,
    when: `${d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}, ${form.elements.time.value.toLowerCase()}`,
    notes: form.elements.notes.value.trim(),
  };
  renderRequest();
  logActivity(`Appointment help requested (${request.ref})`, "i-calendar");
  toast("Request sent. Your advisor will follow up within one business day.");
});

const emptyAppt = `<div class="empty">${icon("i-calendar")}<p><strong>No request yet</strong></p><p>Tell us when suits you and an advisor will help.</p></div>`;
function renderRequest() {
  $("[data-appt-value]").textContent = request ? "Requested" : "Not requested";
  if (!request) {
    $("[data-appt-full]").innerHTML = emptyAppt;
    $("[data-appt-mini]").innerHTML = emptyAppt;
    return;
  }
  const rows = [["Help", request.type], ["Location", request.location], ["Preferred", request.when], request.notes && ["Notes", request.notes]].filter(Boolean);
  $("[data-appt-full]").innerHTML = `<div class="request"><span class="badge badge-warning">${icon("i-clock")}Awaiting confirmation</span><h4>Request ${esc(request.ref)}</h4><dl class="appt-summary">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl><button type="button" class="btn btn-sm" data-appt-cancel>${icon("i-close")}Cancel request</button></div>`;
  $("[data-appt-mini]").innerHTML = `<div class="request"><span class="badge badge-warning">${icon("i-clock")}Awaiting confirmation</span><p><strong>${esc(request.ref)}</strong> · ${esc(request.when)}</p><p class="muted">${esc(request.location)}</p></div>`;
}
document.addEventListener("click", (e) => {
  if (!e.target.closest("[data-appt-cancel]")) return;
  const ref = request.ref;
  request = null;
  form.reset();
  $("[data-notes-count]").textContent = "0";
  renderRequest();
  logActivity(`Appointment request ${ref} cancelled`, "i-close");
  toast("Request cancelled.");
});

/* ---- Message advisor ------------------------------------------------------ */
$("[data-message-form]").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const t = f.elements.text;
  if (fieldError(t, t.value.trim().length < 10 ? "Please write at least 10 characters." : "")) { t.focus(); return; }
  f.closest("dialog").close();
  f.reset();
  logActivity("Message sent to Daniel Reyes", "i-message");
  toast("Message sent to your advisor.");
});

/* ---- Init ----------------------------------------------------------------- */
renderUser();
renderNotes();
renderActivity();
renderTrackers();
renderDocs();
renderRequest();
showView(location.hash.slice(1), false);
