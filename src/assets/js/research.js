// Native, expandable topics on phones; restore the original grid on larger screens.
export function initResearchTopics() {
  const mobile = window.matchMedia("(max-width: 47.99em)");
  const themes = [...document.querySelectorAll(".research-theme")].map(theme => ({
    theme,
    head: theme.querySelector(".research-theme-head"),
    figure: theme.querySelector(".research-theme-thumbnail"),
    entries: theme.querySelector(".research-theme-entries"),
  }));
  function openLinkedTopic() {
    const id = window.location.hash.slice(1);
    const item = themes.find(item => item.theme.id === id);
    if (item?.details) item.details.open = true;
  }
  function updateLayout() {
    document.body.classList.toggle("research-mobile-topics", mobile.matches);
    for (const item of themes) {
      if (mobile.matches && !item.details) {
        const details = document.createElement("details");
        details.className = "research-topic-details";
        const summary = document.createElement("summary");
        const cover = document.createElement("span");
        cover.className = "research-topic-cover";
        cover.setAttribute("aria-hidden", "true");
        const picture = item.figure.querySelector("picture").cloneNode(true);
        picture.querySelector("img").alt = "";
        cover.append(picture);
        const arrow = document.createElement("span");
        arrow.className = "research-topic-arrow";
        arrow.setAttribute("aria-hidden", "true");
        summary.append(cover, item.head, arrow);
        const panel = document.createElement("div");
        panel.className = "research-topic-panel";
        const caption = document.createElement("p");
        caption.className = "research-topic-caption";
        caption.textContent = item.figure.querySelector("figcaption").textContent;
        panel.append(item.figure, caption, item.entries);
        details.append(summary, panel);
        item.theme.replaceChildren(details);
        item.details = details;
      } else if (!mobile.matches && item.details) {
        item.theme.replaceChildren(item.head, item.figure, item.entries);
        item.details = undefined;
      }
    }
    openLinkedTopic();
  }
  mobile.addEventListener("change", updateLayout);
  window.addEventListener("hashchange", openLinkedTopic);
  updateLayout();
}

// Quiet thumbnail crossfades, with article hover/focus selecting the right image.
export function initResearchThumbnails() {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll("[data-research-carousel]").forEach(frame => {
    const theme = frame.closest(".research-theme");
    const slides = [...frame.querySelectorAll(".research-thumbnail-slide")];
    const next = frame.querySelector(".research-thumbnail-next");
    const pause = frame.querySelector(".research-thumbnail-pause");
    if (slides.length < 2) return;
    let current = 0;
    let timer;
    let visible = false;
    let hovered = false;
    let focused = false;
    let userPaused = motion.matches;
    let lastSwipe = 0;
    const label = theme.querySelector("h2").textContent;

    function update() {
      clearTimeout(timer);
      pause.setAttribute("aria-pressed", String(userPaused));
      pause.setAttribute("aria-label", `${userPaused ? "Play" : "Pause"} ${label} images`);
      pause.textContent = userPaused ? "Play" : "Pause";
      if (visible && !hovered && !focused && !userPaused && !document.hidden) {
        timer = setTimeout(() => show(current + 1), 6000);
      }
    }
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === current);
        slide.setAttribute("aria-hidden", String(i !== current));
      });
      update();
    }
    function selectEntry(entry) {
      const index = slides.findIndex(slide => slide.dataset.thumbnailKey === entry?.dataset.thumbnailKey);
      if (index >= 0) show(index);
    }
    theme.addEventListener("pointerenter", event => {
      if (event.pointerType === "touch") return;
      hovered = true;
      update();
    });
    theme.addEventListener("pointerleave", () => { hovered = false; update(); });
    theme.querySelectorAll(".research-entry").forEach(entry => {
      entry.addEventListener("pointerenter", event => {
        if (event.pointerType !== "touch") selectEntry(entry);
      });
    });
    theme.addEventListener("focusin", event => {
      focused = true;
      selectEntry(event.target.closest(".research-entry"));
      update();
    });
    theme.addEventListener("focusout", event => {
      if (!theme.contains(event.relatedTarget)) { focused = false; update(); }
    });
    next.addEventListener("click", () => {
      if (Date.now() - lastSwipe >= 500) show(current + 1);
    });
    pause.addEventListener("click", () => { userPaused = !userPaused; update(); });
    let startX;
    let startY;
    frame.addEventListener("touchstart", event => {
      if (event.target === pause) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    }, { passive: true });
    frame.addEventListener("touchend", event => {
      if (startX === undefined) return;
      const dx = event.changedTouches[0].clientX - startX;
      const dy = event.changedTouches[0].clientY - startY;
      startX = undefined;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        lastSwipe = Date.now();
        userPaused = true;
        show(current + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });
    frame.addEventListener("touchcancel", () => { startX = undefined; });
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", () => { userPaused = motion.matches; update(); });
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      update();
    }).observe(frame);
    next.hidden = false;
    pause.hidden = false;
    update();
  });
}
