// Fixed scroll-to-top button: <button data-scroll-top hidden> (see partials/footer.html).
const THRESHOLD = 400;

export function initScrollTop() {
  const btn = document.querySelector("[data-scroll-top]");
  if (!btn) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  const update = () => {
    const show = window.scrollY > THRESHOLD;
    if (show) btn.hidden = false;
    // Next frame so the opacity transition runs after un-hiding.
    requestAnimationFrame(() => btn.classList.toggle("is-visible", show));
    btn.tabIndex = show ? 0 : -1;
  };

  window.addEventListener("scroll", update, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce.matches ? "auto" : "smooth" }));
  update();
}
