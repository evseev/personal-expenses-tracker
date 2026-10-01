import { chromium } from "@playwright/test";

const url = process.env.PRODUCTION_URL;
if (!url || new URL(url).protocol !== "https:") {
  throw new Error("Set PRODUCTION_URL to the HTTPS deployment URL.");
}

for (const path of ["/", "/manifest.webmanifest", "/sw.js"]) {
  const response = await fetch(new URL(path, url));
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
}

const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const note = `Production smoke ${Date.now()}`;
  await page.goto(url);
  await page.getByRole("heading", { name: /Your money/ }).waitFor();
  await page.getByText("Ready offline").waitFor({ timeout: 20_000 });
  await page.getByRole("button", { name: "Add expense" }).click();
  await page.getByLabel("Amount in USD").fill("1.23");
  await page.getByLabel("Note").fill(note);
  await page.getByRole("button", { name: "Save expense" }).click();
  await page.getByText(note).waitFor();
  await page.reload();
  await page.getByText(note).waitFor({ timeout: 10_000 });
  await context.setOffline(true);
  await page.reload();
  await page.getByText(note).waitFor({ timeout: 10_000 });
  console.log(JSON.stringify({ url, assets: "PASS", persistence: "PASS", offline: "PASS" }));
} finally {
  await browser.close();
}
