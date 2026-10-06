// Entry point. Each feature loads only on pages that use it.
import { initMenu } from "./menu.js";

initMenu();

if (document.querySelector(".hero__slide")) {
  import("./hero.js").then((m) => m.initHero());
}
if (document.querySelector("[data-lightbox]")) {
  import("./lightbox.js").then((m) => m.initLightbox());
}
if (document.querySelector("[data-contact-form]")) {
  import("./contact.js").then((m) => m.initContactForm());
}
