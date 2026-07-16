import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
mkdirSync('/tmp/zoom-shots', { recursive: true })

const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1400,900', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    defaultViewport: { width: 1400, height: 900 },
})
const page = await browser.newPage()
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

await page.goto('http://localhost:5173/map', { waitUntil: 'networkidle2', timeout: 60000 })
await wait(5000)
await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((el) => el.textContent.trim().toLowerCase().includes('trip flow'))
    if (b) b.click()
})
await wait(7000)

// Find the deck canvas position
const canvasBox = await page.evaluate(() => {
    const c = document.querySelector('.map-shell canvas')
    const r = c.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
})
const cx = canvasBox.x + canvasBox.w / 2
const cy = canvasBox.y + canvasBox.h / 2
console.log('canvas center:', cx, cy)

async function crop(name) {
    await page.screenshot({
        path: `/tmp/zoom-shots/${name}.png`,
        clip: { x: cx - 300, y: cy - 200, width: 600, height: 400 },
    })
    console.log('crop:', name)
}

await crop('tripflow-zoom-default')

// Zoom IN via wheel over the canvas center
await page.mouse.move(cx, cy)
for (let i = 0; i < 10; i++) {
    await page.mouse.wheel({ deltaY: -300 })
    await wait(200)
}
await wait(2000)
await crop('tripflow-zoom-in')

// Zoom OUT beyond start
for (let i = 0; i < 20; i++) {
    await page.mouse.wheel({ deltaY: 300 })
    await wait(200)
}
await wait(2000)
await crop('tripflow-zoom-out')

// Infrastructure layer, same drill
await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((el) => el.textContent.trim().toLowerCase().includes('infrastructure'))
    if (b) b.click()
})
await wait(7000)
await crop('infra-zoom-out')
await page.mouse.move(cx, cy)
for (let i = 0; i < 12; i++) {
    await page.mouse.wheel({ deltaY: -300 })
    await wait(200)
}
await wait(2000)
await crop('infra-zoom-in')

await browser.close()
