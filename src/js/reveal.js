// Scroll-reveal animations with one shared IntersectionObserver.
// Usage: <div class="reveal" style="--reveal-delay:120ms">…</div>
import { $$, prefersReducedMotion } from "./utils.js";

export function initReveal() {
  const items = $$(".reveal");
  if (!items.length) return;

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target); // animate once, then stop observing
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );
  items.forEach((el) => io.observe(el));
}
