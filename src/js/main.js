// Entry point shared by all pages. Loaded as a deferred ES module.
import { initTheme } from "./theme.js";
import { initDirection } from "./direction.js";
import { initNav } from "./nav.js";
import { initReveal } from "./reveal.js";
import { initScrollTop } from "./scroll-top.js";

initTheme();
initDirection();
initNav();
initReveal();
initScrollTop();
