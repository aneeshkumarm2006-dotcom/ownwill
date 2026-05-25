/**
 * Renders an HTML string to a PDF buffer with Puppeteer.
 *
 * - On Vercel/serverless: puppeteer-core + @sparticuz/chromium (slim Chromium
 *   that fits the function size limit).
 * - Locally: puppeteer-core driving your installed Chrome (`channel: "chrome"`,
 *   or set PUPPETEER_EXECUTABLE_PATH to override).
 */
export async function renderPdf(html: string): Promise<Buffer> {
  const puppeteer = (await import("puppeteer-core")).default;
  const onServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let launchOptions: any;
  if (onServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    launchOptions = {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    };
  } else {
    launchOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      ...(process.env.PUPPETEER_EXECUTABLE_PATH
        ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
        : { channel: "chrome" }),
    };
  }

  const browser = await puppeteer.launch(launchOptions);
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
