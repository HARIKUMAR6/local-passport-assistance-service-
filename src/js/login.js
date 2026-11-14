// Login page: view switching (sign in / create account / reset), validation,
// show-hide password, remember me, social buttons. Front end only: no
// credentials are verified or sent anywhere. The signed-in name is kept in
// localStorage so the dashboard can greet the client.
import { store } from "./utils.js";

const KEYS = { user: "mp-user", remember: "mp-remember" };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const tabs = $$("[data-auth-tab]");
const views = $$("[data-view]");
const status = $("[data-status]");

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const rules = {
  email: (v) => (!v.trim() ? "Please enter your email address." : emailRe.test(v.trim()) ? "" : "Enter a valid email address, like name@example.com."),
  password: (v, f) =>
    !v ? "Please enter your password."
    : f.closest("[data-form='signup']") && (v.length < 8 || !/[a-z]/i.test(v) || !/\d/.test(v)) ? "Use at least 8 characters with letters and numbers."
    : v.length < 8 ? "Your password is at least 8 characters." : "",
  name: (v) => (v.trim().length < 2 ? "Please enter your full name." : ""),
  confirm: (v, f) => (!v ? "Please confirm your password." : v !== f.form.elements.password.value ? "The passwords do not match." : ""),
  terms: (v, f) => (f.checked ? "" : "Please accept the terms to continue."),
};

function setError(field, msg) {
  const wrap = field.closest(".field");
  wrap.classList.toggle("has-error", !!msg);
  wrap.querySelector(".error-text").textContent = msg;
  if (msg) field.setAttribute("aria-invalid", "true");
  else field.removeAttribute("aria-invalid");
}
const check = (field) => {
  const m = rules[field.name]?.(field.value, field) ?? "";
  setError(field, m);
  return m;
};

function say(msg, kind = "info") {
  status.hidden = !msg;
  status.textContent = msg || "";
  status.dataset.kind = kind;
}

function show(name, focus = true) {
  say("");
  views.forEach((v) => (v.hidden = v.dataset.view !== name));
  tabs.forEach((t) => {
    const on = t.dataset.authTab === name;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
  });
  if (focus) $(`[data-view="${name}"]`).querySelector("input")?.focus();
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
document.addEventListener("click", (e) => {
  const go = e.target.closest("[data-go]");
  if (go) show(go.dataset.go);
});

// Show / hide password
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

// Caps Lock hint
$$("input[type='password']").forEach((i) => {
  const hint = i.closest(".field").querySelector("[data-caps]");
  if (!hint) return;
  const upd = (e) => (hint.hidden = !e.getModifierState?.("CapsLock"));
  i.addEventListener("keydown", upd);
  i.addEventListener("keyup", upd);
  i.addEventListener("blur", () => (hint.hidden = true));
});

// Password strength meter
const pw = $("#su-password");
pw.addEventListener("input", () => {
  const v = pw.value;
  let s = 0;
  if (v.length >= 8) s++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^\w\s]/.test(v) || v.length >= 12) s++;
  if (!v) s = 0;
  $("[data-strength]").dataset.level = s;
  $("[data-strength-text]").textContent = !v ? "Use 8+ characters with letters and numbers." : ["Too weak", "Weak", "Fair", "Good", "Strong"][s] + " password";
});

// Validate on blur, re-validate while typing once an error is showing
$$("[data-form]").forEach((form) => {
  $$("input", form).forEach((f) => {
    f.addEventListener("blur", () => f.type !== "checkbox" && f.value && check(f));
    f.addEventListener("input", () => f.closest(".field").classList.contains("has-error") && check(f));
    if (f.name === "terms") f.addEventListener("change", () => check(f));
  });
});

function busy(form, on) {
  const b = $("[data-submit]", form);
  b.disabled = on;
  b.classList.toggle("is-busy", on);
  b.setAttribute("aria-busy", String(on));
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const nameFromEmail = (e) => e.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function enter(name, email, msg) {
  store.set(KEYS.user, JSON.stringify({ name, email }));
  say(msg, "success");
  setTimeout(() => (location.href = "dashboard.html"), 1100);
}

// Remember me: prefill the email
const saved = store.get(KEYS.remember);
if (saved) {
  $("#si-email").value = saved;
  $("[data-form='signin'] [name=remember]").checked = true;
}

$$("[data-form]").forEach((form) =>
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fields = $$("input", form).filter((f) => f.name !== "remember");
    const errors = fields.filter((f) => check(f));
    if (errors.length) {
      errors[0].focus();
      say(`Please fix ${errors.length} ${errors.length === 1 ? "field" : "fields"} and try again.`, "error");
      return;
    }
    say("");
    busy(form, true);
    await wait(900);
    const type = form.dataset.form;
    const email = form.elements.email.value.trim();
    if (type === "signin") {
      store.set(KEYS.remember, form.elements.remember.checked ? email : "");
      const prev = JSON.parse(store.get(KEYS.user) || "null");
      enter(prev?.email === email ? prev.name : nameFromEmail(email), email, "Signed in. Taking you to your dashboard…");
    } else if (type === "signup") {
      enter(form.elements.name.value.trim(), email, "Account created. Taking you to your dashboard…");
    } else {
      busy(form, false);
      say(`If an account exists for ${email}, a reset link is on its way.`, "success");
    }
  })
);

$$("[data-social]").forEach((b) =>
  b.addEventListener("click", async () => {
    const provider = b.dataset.social;
    $$("[data-social]").forEach((x) => (x.disabled = true));
    say(`Connecting to ${provider}…`, "info");
    await wait(1000);
    enter("Amelia Hart", `amelia.hart@${provider.toLowerCase()}.com`, `Signed in with ${provider}. Taking you to your dashboard…`);
  })
);
