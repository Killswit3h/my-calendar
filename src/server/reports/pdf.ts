import chromium from "@sparticuz/chromium";
import type * as PuppeteerCoreNS from "puppeteer-core";

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const isServerless = !!(process.env.AWS_REGION || process.env.VERCEL);

  if (isServerless) {
    // Serverless: puppeteer-core + @sparticuz/chromium
    const puppeteer = (await import("puppeteer-core")) as typeof PuppeteerCoreNS;
    const exePath = await chromium.executablePath("");
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: exePath,
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({ printBackground: true, landscape: true, format: "letter", margin: { top: "0.25in", right: "0.25in", bottom: "0.25in", left: "0.25in" } });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  } else {
    // Local dev: full puppeteer (downloads Chromium) for reliability on Windows/macOS
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({ printBackground: true, landscape: true, format: "letter", margin: { top: "0.25in", right: "0.25in", bottom: "0.25in", left: "0.25in" } });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
