import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("create, edit, persist, and delete an expense", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your money, clearly." })).toBeVisible();
  await page.getByRole("button", { name: "Add expense" }).click();
  await page.getByLabel("Amount in USD").fill("12.50");
  await page.getByLabel("Note").fill("Coffee beans");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page.getByText("Coffee beans")).toBeVisible();
  await expect(page.getByTestId("monthly-total")).toHaveText("$12.50");
  await page.reload();
  await expect(page.getByText("Coffee beans")).toBeVisible();

  await page.getByRole("button", { name: "Edit Coffee beans" }).click();
  await page.getByLabel("Amount in USD").fill("13.25");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByTestId("monthly-total")).toHaveText("$13.25");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete Coffee beans" }).click();
  await expect(page.getByText("Coffee beans")).toHaveCount(0);
  await expect(page.getByTestId("monthly-total")).toHaveText("$0.00");
});

test("contains modal focus in both Tab directions", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add expense" }).click();
  const dialog = page.getByRole("dialog", { name: "Add an expense" });
  const first = dialog.getByRole("button", { name: "Close form" });
  const last = dialog.getByRole("button", { name: "Save expense" });
  await expect(dialog.getByLabel("Amount in USD")).toBeFocused();

  await last.focus();
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();

  for (const key of ["Tab", "Shift+Tab"]) {
    for (let index = 0; index < 16; index += 1) {
      await page.keyboard.press(key);
      await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }
  }
});

test("Escape closes the modal and restores the Add and Edit triggers", async ({ page }) => {
  await page.goto("/");
  const add = page.getByRole("button", { name: "Add expense" });
  await add.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Amount in USD")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(add).toBeFocused();

  await page.keyboard.press("Enter");
  await page.getByLabel("Amount in USD").fill("4.25");
  await page.getByLabel("Note").fill("Focus test");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(add).toBeFocused();

  const edit = page.getByRole("button", { name: "Edit Focus test", exact: true });
  await edit.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Amount in USD")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(edit).toBeFocused();

  for (const name of ["Cancel", "Close form", "Save changes"]) {
    await page.keyboard.press("Enter");
    await page.getByRole("dialog").getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(edit).toBeFocused();
  }
});

test("restores focus to Add when an edited row leaves the category filter", async ({ page }) => {
  await page.goto("/");
  const add = page.getByRole("button", { name: "Add expense" });
  await add.click();
  await page.getByLabel("Amount in USD").fill("4.25");
  await page.getByLabel("Note").fill("Filtered expense");
  await page.getByRole("button", { name: "Save expense" }).click();

  await page.getByLabel("Filter category").selectOption("Food");
  await page.getByRole("button", { name: "Edit Filtered expense" }).click();
  await page.getByRole("dialog").getByRole("combobox", { name: "Category" }).selectOption("Transport");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("button", { name: "Edit Filtered expense" })).toHaveCount(0);
  await expect(add).toBeFocused();
});

test("stays usable offline after the shell is ready", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Offline acceptance uses desktop Chromium.");
  await page.goto("/");
  await expect(page.getByText("Ready offline")).toBeVisible({ timeout: 20_000 });
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Add expense" }).click();
  await page.getByLabel("Amount in USD").fill("3,40");
  await page.getByLabel("Note").fill("Offline coffee");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page.getByText("Offline coffee")).toBeVisible();
  expect(await page.evaluate(async () => {
    const request = indexedDB.open("personal-expenses-v1");
    const database = await new Promise<IDBDatabase>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    const transaction = database.transaction("expenses", "readonly");
    const count = await new Promise<number>((resolve, reject) => { const result = transaction.objectStore("expenses").count(); result.onsuccess = () => resolve(result.result); result.onerror = () => reject(result.error); });
    database.close();
    return count;
  })).toBe(1);
  await page.reload();
  await expect(page.getByText("Offline coffee")).toBeVisible();
});

test("rejects invalid backup without erasing expenses", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Backup acceptance uses desktop Chromium.");
  await page.goto("/");
  await page.getByRole("button", { name: "Add expense" }).click();
  await page.getByLabel("Amount in USD").fill("2.50");
  await page.getByLabel("Note").fill("Keep me");
  await page.getByRole("button", { name: "Save expense" }).click();
  await page.getByLabel("Import JSON backup").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":2,"expenses":[]}'),
  });
  await expect(page.locator("main [role=alert]")).toContainText("unsupported version");
  await expect(page.getByText("Keep me")).toBeVisible();
});

test("exports and restores a JSON backup through the UI", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Backup acceptance uses desktop Chromium.");
  await page.goto("/");
  await page.getByRole("button", { name: "Add expense" }).click();
  await page.getByLabel("Amount in USD").fill("8.75");
  await page.getByLabel("Note").fill("Restore me");
  await page.getByRole("button", { name: "Save expense" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const download = await downloadPromise;
  const backup = await readFile(await download.path());
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete Restore me" }).click();
  await expect(page.getByTestId("monthly-total")).toHaveText("$0.00");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import JSON backup").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: backup });
  await expect(page.getByText("Restore me")).toBeVisible();
  await expect(page.getByTestId("monthly-total")).toHaveText("$8.75");
});

test("shows a storage failure instead of a success message", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Failure acceptance uses desktop Chromium.");
  await page.addInitScript(() => {
    IDBFactory.prototype.open = () => { throw new Error("Simulated IndexedDB failure"); };
  });
  await page.goto("/");
  await expect(page.locator("main [role=alert]")).toContainText("Could not load expenses");
  await expect(page.getByText("Expense saved.")).toHaveCount(0);
});

test("dark mobile viewport has no horizontal overflow", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Mobile viewport acceptance uses desktop Chromium.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
