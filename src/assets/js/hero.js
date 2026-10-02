// Home page slideshow: a slow crossfade between featured projects.
//
// It pauses when:
//   - the visitor presses the pause button (WCAG 2.2.2),
//   - keyboard focus is inside the slideshow (not after a mouse click or a tap),
//   - the browser tab is hidden.
// It starts paused when the visitor asks the system for reduced motion.
// A click on a dot, or a swipe, shows that slide and restarts the interval.
export function initHero() {
  const hero = document.querySelector(".hero");
  const slides = [...hero.querySelectorAll(".hero__slide")];
  const dots = [...hero.querySelectorAll(".hero__dot")];
  const toggle = hero.querySelector(".hero__toggle");
  if (slides.length < 2) return;

  const interval =
    parseFloat(getComputedStyle(hero).getPropertyValue("--interval")) * 1000 || 6000;

  let current = 0;
  let timer = null;
  let startedAt = 0;
  let remaining = interval;

  const state = {
    userPaused: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    focusPaused: false,
    hidden: document.hidden,
  };
  const running = () => !state.userPaused && !state.focusPaused && !state.hidden;

  function startTimer() {
    startedAt = performance.now();
    timer = setTimeout(() => {
      timer = null;
      show(current + 1);
    }, remaining);
  }

  function stopTimer() {
    clearTimeout(timer);
    timer = null;
    remaining = Math.max(0, remaining - (performance.now() - startedAt));
  }

  // Start or stop the timer so that it matches the state.
  function update() {
    const run = running();
    hero.classList.toggle("is-paused", !run);
    if (run && !timer) startTimer();
    if (!run && timer) stopTimer();
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(state.userPaused));
      toggle.setAttribute("aria-label", state.userPaused ? toggle.dataset.play : toggle.dataset.pause);
    }
  }

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle("is-active", active);
      slide.inert = !active;
    });
    // Restart the progress line: unmark all dots, let the browser apply that,
    // then mark the current dot again.
    dots.forEach((dot) => dot.removeAttribute("aria-current"));
    void hero.offsetWidth;
    dots[current]?.setAttribute("aria-current", "true");
    // A new slide always gets the full interval.
    clearTimeout(timer);
    timer = null;
    remaining = interval;
    update();
  }

  dots.forEach((dot, i) => dot.addEventListener("click", () => show(i)));

  toggle?.addEventListener("click", () => {
    state.userPaused = !state.userPaused;
    // An explicit "play" wins over the keyboard-focus pause.
    if (!state.userPaused) state.focusPaused = false;
    update();
  });

  hero.addEventListener("focusin", (e) => {
    if (e.target === toggle) return;
    state.focusPaused = e.target.matches(":focus-visible");
    update();
  });
  hero.addEventListener("focusout", (e) => {
    if (!hero.contains(e.relatedTarget)) {
      state.focusPaused = false;
      update();
    }
  });
  document.addEventListener("visibilitychange", () => {
    state.hidden = document.hidden;
    update();
  });

  // Swipe between slides on touch screens.
  let startX = null;
  hero.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
  hero.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  });

  hero.classList.add("is-ready");
  update();
}
