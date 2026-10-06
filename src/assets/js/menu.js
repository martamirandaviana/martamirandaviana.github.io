// Phone menu: a full-screen panel that the "Menu" button opens and closes.
export function initMenu() {
  const button = document.querySelector(".menu-toggle");
  const nav = document.getElementById("site-nav");
  if (!button || !nav) return;

  const label = button.querySelector(".menu-toggle__label");
  const openText = label.textContent;
  const closeText = document.documentElement.lang === "pt" ? "Fechar" : "Close";
  const phone = window.matchMedia("(max-width: 47.99em)");

  function setOpen(open) {
    button.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    label.textContent = open ? closeText : openText;
  }

  button.addEventListener("click", () => {
    setOpen(button.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      button.focus();
    }
  });

  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });

  phone.addEventListener("change", () => setOpen(false));
}
