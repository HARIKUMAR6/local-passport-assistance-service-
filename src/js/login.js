// Login / Register page. Authentication is not configured yet, so nothing is
// stored or sent: forms validate their fields and then report that the action
// is unavailable. Google and Apple report the same.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const status = $("[data-status]");
const UNAVAILABLE = "This service is currently unavailable. Please try again later.";

function say(msg) {
  status.hidden = !msg;
  status.textContent = msg || "";
  status.dataset.kind = "error";
}
function setError(field, msg) {
  const wrap = field.closest(".field");
  wrap.classList.toggle("has-error", !!msg);
  wrap.querySelector(".error-text").textContent = msg;
  if (msg) field.setAttribute("aria-invalid", "true"); else field.removeAttribute("aria-invalid");
  return msg;
}
const rules = {
  name: (v) => (v.trim().length < 2 ? "Please enter your full name." : ""),
  email: (v) => (!v.trim() ? "Please enter your email address." : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email address."),
  password: (v, f) => (!v ? "Please enter your password." : f.form.dataset.form === "register" && v.length < 8 ? "Use at least 8 characters." : ""),
  confirm: (v, f) => (!v ? "Please confirm your password." : v !== f.form.elements.password.value ? "The passwords do not match." : ""),
};
const check = (f) => setError(f, rules[f.name]?.(f.value, f) ?? "");

/* Login / Register switch */
const tabs = $$("[data-auth-tab]");
function show(name, focus = true) {
  say("");
  $$("[data-view]").forEach((v) => (v.hidden = v.dataset.view !== name));
  tabs.forEach((t) => {
    const on = t.dataset.authTab === name;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
  });
  if (focus) $(`[data-view="${name}"] input`)?.focus();
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => show(t.dataset.authTab));
  t.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const next = tabs[(i + 1) % tabs.length];
    next.focus();
    show(next.dataset.authTab, false);
  });
});

/* Show / hide password */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-toggle-password]");
  if (!btn) return;
  const input = document.getElementById(btn.getAttribute("aria-controls"));
  const shown = input.type === "password";
  input.type = shown ? "text" : "password";
  btn.setAttribute("aria-pressed", String(shown));
  btn.setAttribute("aria-label", shown ? "Hide password" : "Show password");
  input.focus();
});

/* Field validation */
$$("[data-form]").forEach((form) => {
  $$("input", form).forEach((f) => {
    f.addEventListener("blur", () => f.value && check(f));
    f.addEventListener("input", () => f.closest(".field").classList.contains("has-error") && check(f));
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = $$("input", form).filter((f) => check(f));
    if (bad.length) { say(""); bad[0].focus(); return; }
    say(UNAVAILABLE);
  });
});
$$("[data-social], [data-forgot]").forEach((b) => b.addEventListener("click", () => say(UNAVAILABLE)));
