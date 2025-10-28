import puppeteer from 'puppeteer'
import puppeteerCore from 'puppeteer-core'
import type { Browser as PuppeteerBrowser } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { Browser as BrowserProduct, detectBrowserPlatform, install, resolveBuildId } from '@puppeteer/browsers'
import { getConfiguration } from 'puppeteer/internal/getConfiguration.js'
import { PUPPETEER_REVISIONS } from 'puppeteer-core/internal/revisions.js'
import assert from 'node:assert'

function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_REGION)
}

function errorMessage(err: unknown): string {
  if (!err) return ''
  if (err instanceof Error) return err.message || ''
  if (typeof err === 'string') return err
  return ''
}

function isMissingChrome(err: unknown): boolean {
  const msg = errorMessage(err).toLowerCase()
  return (
    msg.includes('could not find chrome') ||
    msg.includes('chrome executable') ||
    msg.includes('executable doesn\'t exist') ||
    msg.includes('failed to launch the browser process') ||
    msg.includes('enoent')
  )
}

async function installChrome(): Promise<void> {
  const platform = detectBrowserPlatform()
  if (!platform) {
    throw new Error('Unsupported platform for Puppeteer browser download')
  }
  const configuration = getConfiguration()
  if (configuration.skipDownload || configuration.chrome?.skipDownload) {
    throw new Error('Puppeteer browser download is disabled via configuration')
  }
  const unresolvedBuildId =
    configuration.chrome?.version ||
    PUPPETEER_REVISIONS[BrowserProduct.CHROME] ||
    'latest'
  const baseUrl = configuration.chrome?.downloadBaseUrl
  const buildId = await resolveBuildId(BrowserProduct.CHROME, platform, unresolvedBuildId)
  await install({
    browser: BrowserProduct.CHROME,
    cacheDir: configuration.cacheDirectory,
    platform,
    buildId,
    downloadProgressCallback: 'default',
    baseUrl,
    buildIdAlias: buildId !== unresolvedBuildId ? unresolvedBuildId : undefined,
  })
}

async function launchChromium(): Promise<PuppeteerBrowser> {
  const executablePath = await chromium.executablePath()
  assert(executablePath, 'Chromium executable path could not be resolved')

  return puppeteerCore.launch({
    args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'],
    executablePath,
    defaultViewport: chromium.defaultViewport ?? null,
    headless: chromium.headless ?? true,
    ignoreDefaultArgs: chromium.ignoreDefaultArgs,
    env: chromium.env,
  })
}

export async function launchReportBrowser(): Promise<PuppeteerBrowser> {
  if (isServerless()) {
    return launchChromium()
  }

  try {
    return await puppeteer.launch({ headless: true })
  } catch (err) {
    if (!isMissingChrome(err)) {
      throw err
    }
    console.warn('[reports] Puppeteer Chrome missing, attempting download... ', errorMessage(err))
    try {
      await installChrome()
    } catch (installErr) {
      const detail = errorMessage(installErr) || 'Unknown error'
      throw new Error(`Failed to download Chrome for Puppeteer automatically. Try running "npx puppeteer browsers install chrome" manually. (${detail})`, {
        cause: installErr instanceof Error ? installErr : undefined,
      })
    }
    return puppeteer.launch({ headless: true })
  }
}
