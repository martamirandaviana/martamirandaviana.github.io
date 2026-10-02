// Lightbox for project galleries, built on the native <dialog> element.
// Keyboard: arrows to move, Escape to close. Touch: swipe left or right.
// Without JavaScript, each photo is a normal link to the large image.
export function initLightbox() {
  const dialog = document.querySelector(".lightbox");
  const links = [...document.querySelectorAll("[data-lightbox]")];
  if (!dialog || !links.length) return;

  const img = document.createElement("img");
  img.className = "lightbox__img";
  img.alt = "";
  dialog.querySelector(".lightbox__figure").prepend(img);
  const count = dialog.querySelector(".lightbox__count");
  const prev = dialog.querySelector(".lightbox__prev");
  const next = dialog.querySelector(".lightbox__next");
  const close = dialog.querySelector(".lightbox__close");

  let index = 0;
  let opener = null;

  function show(i) {
    index = Math.max(0, Math.min(links.length - 1, i));
    const link = links[index];
    const thumb = link.querySelector("img");
    // Show the already-loaded thumbnail first, then swap in the large image.
    img.src = thumb.currentSrc || thumb.src;
    img.alt = thumb.alt;
    img.width = link.dataset.width;
    img.height = link.dataset.height;
    const full = new Image();
    full.onload = () => {
      if (links[index] === link) img.src = full.src;
    };
    full.src = link.href;
    count.textContent = `${index + 1} / ${links.length}`;
    prev.disabled = index === 0;
    next.disabled = index === links.length - 1;
    // Preload the next image.
    if (links[index + 1]) new Image().src = links[index + 1].href;
  }

  links.forEach((link, i) =>
    link.addEventListener("click", (e) => {
      e.preventDefault();
      opener = link;
      show(i);
      dialog.showModal();
      document.body.classList.add("menu-open");
    })
  );

  prev.addEventListener("click", () => show(index - 1));
  next.addEventListener("click", () => show(index + 1));
  close.addEventListener("click", () => dialog.close());

  // A click on the dark area outside the image closes the viewer.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target.classList.contains("lightbox__figure")) dialog.close();
  });

  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("menu-open");
    img.removeAttribute("src");
    opener?.focus();
  });

  let startX = null;
  dialog.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) startX = e.touches[0].clientX;
  }, { passive: true });
  dialog.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
  });
}
