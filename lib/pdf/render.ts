/**
 * Renders an HTML string to a PDF buffer with Puppeteer.
 *
 * Local/dev uses the full `puppeteer` (bundled Chromium). For serverless
 * (Vercel) swap to `puppeteer-core` + `@sparticuz/chromium`.
 */
export async function renderPdf(html: string): Promise<Buffer> {
  const puppeteer = (await import("puppeteer")).default;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "48px", bottom: "48px", left: "56px", right: "56px" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
