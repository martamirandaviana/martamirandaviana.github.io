// The contact form. Formspree is replaced by a fake answer, so no real
// message is sent.
import { test, expect } from "@playwright/test";

async function fill(page) {
  await page.getByRole("textbox", { name: "Name", exact: true }).fill("Test Person");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("test@example.com");
  await page.getByRole("combobox", { name: "Subject" }).selectOption({ index: 1 });
  await page.getByRole("textbox", { name: "Message", exact: true }).fill("Hello, this is a test.");
  await page.getByLabel(/I agree/).check();
}

test("shows a thank-you message when the message is sent", async ({ page }) => {
  let sent = null;
  await page.route("https://formspree.io/**", (route) => {
    sent = route.request().postData();
    route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.goto("/contact/");
  await fill(page);
  await page.getByRole("button", { name: /Send message/ }).click();
  await expect(page.locator(".form__status")).toHaveText(/Thank you/);
  expect(sent).toContain("Test Person");
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("");
});

test("shows the email address when sending fails", async ({ page }) => {
  await page.route("https://formspree.io/**", (route) => route.fulfill({ status: 500, body: "" }));
  await page.goto("/contact/");
  await fill(page);
  await page.getByRole("button", { name: /Send message/ }).click();
  await expect(page.locator(".form__status")).toHaveText(/not sent.*mviana@arq\.up\.pt/);
});

test("does not send an incomplete form", async ({ page }) => {
  let requests = 0;
  await page.route("https://formspree.io/**", (route) => {
    requests++;
    route.abort();
  });
  await page.goto("/contact/");
  await page.getByRole("button", { name: /Send message/ }).click();
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toBeFocused();
  expect(requests).toBe(0);
});
