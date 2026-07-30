import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

/**
 * Headless smoke check of the four app pages.
 * Attaches to a running dev server on :5173 when available, otherwise builds
 * nothing itself and spawns `vite preview` against the last `vite build`.
 * Fails on uncaught page errors or console errors, except backend-down
 * network noise (reported as a warning) and the known benign deck.gl
 * maxTextureDimension2D headless warning.
 */

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEV_URL = 'http://localhost:5173'
// Must stay on 5173: the backend's CORS allowlist only contains this origin.
const PREVIEW_PORT = 5173
const BACKEND_URL = 'http://127.0.0.1:8000'
const OUT_DIR = process.env.SMOKE_OUT ?? path.join(tmpdir(), 'bike-smoke')

const PAGES = [
  { route: '/map', anchor: 'canvas' },
  { route: '/temporal', anchor: '.js-plotly-plot' },
  { route: '/weather', anchor: '.js-plotly-plot' },
  { route: '/footprint', anchor: '.footprint-tiles' },
]

/**
 * Checks whether an HTTP origin answers at all.
 * @param {string} url - Origin to probe.
 * @returns {Promise<boolean>} True when any HTTP response comes back.
 */
async function isReachable(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(3000) })
    return true
  } catch {
    return false
  }
}

/**
 * Decides whether a console/page error is backend-down noise rather than
 * an application defect.
 * @param {string} text - Error message text.
 * @returns {boolean} True when the error only reflects the API being unreachable.
 */
function isBackendNoise(text) {
  return /127\.0\.0\.1:8000|localhost:8000|ERR_CONNECTION_REFUSED|Network Error|ECONNREFUSED/i.test(text)
}

/**
 * Decides whether a page error is the known benign deck.gl headless warning.
 * @param {string} text - Error message text.
 * @returns {boolean} True for the maxTextureDimension2D headless artifact.
 */
function isBenignDeckGlError(text) {
  return text.includes('maxTextureDimension2D')
}

const devServerUp = await isReachable(DEV_URL)
const backendUp = await isReachable(BACKEND_URL)

let previewProcess = null
let baseUrl = DEV_URL
if (!devServerUp) {
  previewProcess = spawn(
    'npx',
    ['vite', 'preview', '--port', String(PREVIEW_PORT), '--strictPort'],
    { cwd: new URL('..', import.meta.url).pathname, env: { ...process.env, SMOKE: '1' }, stdio: 'ignore' },
  )
  baseUrl = `http://localhost:${PREVIEW_PORT}`
  const deadline = Date.now() + 15000
  while (!(await isReachable(baseUrl))) {
    if (Date.now() > deadline) {
      console.error(`smoke: preview server did not come up on :${PREVIEW_PORT} (run \`npm run build\` first)`)
      previewProcess.kill()
      process.exit(1)
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
}

if (!backendUp) {
  console.warn('smoke: WARNING - backend on :8000 is unreachable; data anchors are downgraded to warnings, only hard JS errors fail the run')
}

mkdirSync(OUT_DIR, { recursive: true })

const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' })
let failures = 0

for (const { route, anchor } of PAGES) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  const errors = []
  const warnings = []

  page.on('pageerror', (err) => {
    const text = String(err)
    if (isBenignDeckGlError(text)) return
    ;(isBackendNoise(text) ? warnings : errors).push(`pageerror: ${text}`)
  })
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    ;(isBackendNoise(text) ? warnings : errors).push(`console.error: ${text}`)
  })

  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle2', timeout: 45000 })
    await page.waitForSelector('.page-card', { timeout: 15000 })
    try {
      await page.waitForSelector(anchor, { timeout: backendUp ? 20000 : 5000 })
    } catch {
      const message = `anchor "${anchor}" not found on ${route}`
      if (backendUp) errors.push(message)
      else warnings.push(`${message} (backend down)`)
    }
  } catch (err) {
    errors.push(`navigation failed on ${route}: ${err}`)
  }

  await new Promise((resolve) => setTimeout(resolve, 1500))
  const screenshotPath = path.join(OUT_DIR, `${route.slice(1)}.png`)
  await page.screenshot({ path: screenshotPath })

  const status = errors.length ? 'FAIL' : 'ok'
  console.log(`smoke: ${route} ${status} (screenshot: ${screenshotPath})`)
  for (const warning of warnings) console.warn(`  warn: ${warning}`)
  for (const error of errors) console.error(`  error: ${error}`)
  failures += errors.length
  await page.close()
}

await browser.close()
previewProcess?.kill()
process.exit(failures ? 1 : 0)
