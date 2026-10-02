// Contact form: send to Formspree in the background and show the result on
// the same page. Without JavaScript, the form posts to Formspree normally.
export function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  const status = form.querySelector(".form__status");
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    button.disabled = true;
    status.textContent = form.dataset.sending;

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      status.textContent = form.dataset.sent;
    } catch {
      status.textContent = form.dataset.error;
    } finally {
      button.disabled = false;
    }
  });
}
