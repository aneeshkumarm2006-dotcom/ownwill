/** Thrown when Puppeteer exceeds the configured render timeout. */
export class PdfTimeoutError extends Error {
  constructor(message = "PDF rendering timed out.") {
    super(message);
    this.name = "PdfTimeoutError";
  }
}

const PDF_STEP_TIMEOUT_MS = 30_000;

/**
 * Renders an HTML string to a PDF buffer with Puppeteer.
 *
 * - On Vercel/serverless: puppeteer-core + @sparticuz/chromium (slim Chromium
 *   that fits the function size limit).
 * - Locally: puppeteer-core driving your installed Chrome (`channel: "chrome"`,
 *   or set PUPPETEER_EXECUTABLE_PATH to override).
 *
 * Throws `PdfTimeoutError` if either setContent or pdf() exceeds 30s.
 */
export async function renderPdf(html: string): Promise<Buffer> {
  const puppeteer = (await import("puppeteer-core")).default;
  type LaunchOptions = Parameters<typeof puppeteer.launch>[0];
  const onServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  let launchOptions: LaunchOptions;
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
    try {
      await page.setContent(html, {
        waitUntil: "load",
        timeout: PDF_STEP_TIMEOUT_MS,
      });
      const pdf = await page.pdf({
        format: "Letter",
        printBackground: true,
        margin: { top: "48px", bottom: "48px", left: "56px", right: "56px" },
        timeout: PDF_STEP_TIMEOUT_MS,
      });
      return Buffer.from(pdf);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (/timeout|timed out/i.test(message)) {
        throw new PdfTimeoutError(message);
      }
      throw e;
    }
  } finally {
    await browser.close();
  }
}
