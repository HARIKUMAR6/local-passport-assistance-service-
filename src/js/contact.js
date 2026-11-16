// Contact page: form validation + submission feedback, URL prefill, copy buttons.

// Integration point: set to your form-handling endpoint (it receives JSON via POST).
// While empty, submission is simulated so the front end can be reviewed without a backend.
const FORM_ENDPOINT = "";

const form = document.querySelector("[data-contact-form]");

const rules = {
  name: (v) => (v.trim().length < 2 ? "Please enter your full name." : ""),
  email: (v) => (!v.trim() ? "Please enter your email address." : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email address, like name@example.com."),
  phone: (v) => (!v.trim() ? "" : /^[+()\d\s.-]{7,20}$/.test(v.trim()) && v.replace(/\D/g, "").length >= 7 ? "" : "Enter a valid phone number, or leave this blank."),
  country: (v) => (v ? "" : "Please choose your country."),
  topic: (v) => (v ? "" : "Please choose what you need help with."),
  message: (v) => (v.trim().length < 20 ? "Please tell us a little more (at least 20 characters)." : v.length > 1000 ? "Please keep your message under 1000 characters." : ""),
};

function setError(field, message) {
  const wrap = field.closest(".field");
  const err = wrap.querySelector(".error-text");
  wrap.classList.toggle("has-error", !!message);
  if (message) { field.setAttribute("aria-invalid", "true"); err.textContent = message; }
  else { field.removeAttribute("aria-invalid"); err.textContent = ""; }
}

function validateField(field) {
  const msg = rules[field.name]?.(field.value) ?? "";
  setError(field, msg);
  return msg;
}

function validateConsent() {
  const box = form.elements.consent;
  const wrap = box.closest(".field");
  const bad = !box.checked;
  wrap.classList.toggle("has-error", bad);
  bad ? box.setAttribute("aria-invalid", "true") : box.removeAttribute("aria-invalid");
  wrap.querySelector(".error-text").textContent = bad ? "Please agree so we can reply to you." : "";
  return bad ? "Please agree so we can reply to you." : "";
}

function showSummary(errors) {
  const box = form.querySelector("[data-summary]");
  box.hidden = errors.length === 0;
  if (!errors.length) return;
  box.querySelector("strong").textContent = errors[0].field?.tagName === "BUTTON" ? "Message not sent" : "Please check these fields:";
  box.querySelector("ul").replaceChildren(...errors.map(({ field, msg }) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${field.id}`; a.textContent = msg;
    a.addEventListener("click", (e) => { e.preventDefault(); field.focus(); });
    li.append(a); return li;
  }));
}

async function send(data) {
  // No message endpoint is configured yet, so the request cannot be delivered.
  if (!FORM_ENDPOINT) throw new Error("no endpoint");
  const res = await fetch(FORM_ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

function initForm() {
  if (!form) return;
  const fields = [...form.querySelectorAll("input[name], select[name], textarea[name]")].filter((f) => rules[f.name]);
  const counter = form.querySelector("[data-count]");

  // Prefill from ?topic= and ?country= (set by the checklist page's country picker)
  const params = new URLSearchParams(location.search);
  for (const key of ["topic", "country"]) {
    const v = params.get(key);
    const opt = v && [...form.elements[key].options].find((o) => o.value.toLowerCase() === v.toLowerCase());
    if (opt) form.elements[key].value = opt.value;
  }
  if (params.get("topic") === "documents" && !form.elements.message.value) {
    const c = params.get("country");
    form.elements.message.value = `I would like help preparing my passport documents${c ? ` for ${c}` : ""}. `;
  }

  const updateCount = () => counter && (counter.textContent = `${form.elements.message.value.length} / 1000`);
  updateCount();
  form.elements.message.addEventListener("input", updateCount);

  // Validate on blur; once a field has an error, re-validate as the user types.
  fields.forEach((f) => {
    f.addEventListener("blur", () => f.value !== "" || f.closest(".field").classList.contains("has-error") ? validateField(f) : null);
    f.addEventListener("input", () => f.closest(".field").classList.contains("has-error") && validateField(f));
    f.addEventListener("change", () => f.tagName === "SELECT" && validateField(f));
  });
  form.elements.consent.addEventListener("change", validateConsent);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errors = fields.map((field) => ({ field, msg: validateField(field) })).filter((x) => x.msg);
    const consentMsg = validateConsent();
    if (consentMsg) errors.push({ field: form.elements.consent, msg: consentMsg });
    showSummary(errors);
    if (errors.length) { errors[0].field.focus(); return; }

    const btn = form.querySelector("[type=submit]");
    const label = btn.innerHTML;
    btn.disabled = true; btn.setAttribute("aria-busy", "true");
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Sending…';
    try {
      await send(Object.fromEntries(new FormData(form)));
      const ok = document.querySelector("[data-success]");
      ok.querySelector("[data-name]").textContent = form.elements.name.value.trim().split(/\s+/)[0];
      ok.querySelector("[data-topic]").textContent = form.elements.topic.selectedOptions[0].textContent;
      form.hidden = true; ok.hidden = false; ok.querySelector("h3").focus();
    } catch {
      showSummary([{ field: btn, msg: "Sorry, we couldn't send your message right now. Please try again later." }]);
    } finally {
      btn.disabled = false; btn.removeAttribute("aria-busy"); btn.innerHTML = label;
    }
  });

  document.querySelector("[data-another]")?.addEventListener("click", () => {
    form.reset(); updateCount(); form.hidden = false;
    document.querySelector("[data-success]").hidden = true;
    showSummary([]); fields.forEach((f) => setError(f, "")); form.elements.name.focus();
  });
}

function initCopy() {
  const live = document.querySelector("[data-copy-live]");
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const text = btn.dataset.copy;
    try { await navigator.clipboard.writeText(text); }
    catch {
      const t = Object.assign(document.createElement("textarea"), { value: text });
      document.body.append(t); t.select(); try { document.execCommand("copy"); } catch { /* ignore */ } t.remove();
    }
    const span = btn.querySelector("[data-label]"); const orig = span.textContent;
    btn.classList.add("is-done"); span.textContent = "Copied";
    if (live) live.textContent = `${btn.dataset.what || "Text"} copied to clipboard`;
    setTimeout(() => { btn.classList.remove("is-done"); span.textContent = orig; }, 1800);
  });
}

initForm();
initCopy();
