import { easeInOut, sleep } from './humanize.js'

/**
 * Single source of truth for the cursor position.
 * All pointer moves go through this class so the overlay never teleports.
 */
export class Cursor {
    constructor(x = 96, y = 96) {
        this.x = x
        this.y = y
    }

    /** Move to (x, y) in a stable eased line for repeatable demo captures. */
    async moveTo(page, x, y) {
        const dx = x - this.x
        const dy = y - this.y
        const distance = Math.hypot(dx, dy)
        const steps = Math.max(18, Math.min(56, Math.round(distance / 18)))

        for (let i = 1; i <= steps; i++) {
            const t = easeInOut(i / steps)
            const nx = this.x + dx * t
            const ny = this.y + dy * t
            await page.mouse.move(nx, ny)
            await sleep(6)
        }

        this.x = x
        this.y = y
        await sleep(150)
    }

    /** Move to (x, y) then click with fixed press-and-release timing. */
    async clickAt(page, x, y) {
        await this.moveTo(page, x, y)
        await sleep(170)
        await page.evaluate(() => {
            const el = document.getElementById('__mac-cursor__')
            if (!el) return
            el.classList.remove('is-clicking')
            void el.offsetWidth
            el.classList.add('is-clicking')
            window.setTimeout(() => el.classList.remove('is-clicking'), 380)
        })
        await page.mouse.down()
        await sleep(95)
        await page.mouse.up()
        await sleep(300)
    }

    /** Move to a locator's centre then click with fixed press-and-release timing. */
    async click(page, locator) {
        const box = await locator.boundingBox()
        if (!box) {
            throw new Error(`cursor.click: element has no bounding box — locator may not be visible: ${locator}`)
        }
        await this.clickAt(page, box.x + box.width / 2, box.y + box.height / 2)
    }
}

export async function injectMacCursor(page, cursor) {
    await page.evaluate(({ startX, startY }) => {
        if (document.getElementById('__mac-cursor__')) return

        const style = document.createElement('style')
        style.textContent = `
            *, *::before, *::after { cursor: none !important; }
            #__mac-cursor__ {
                --cursor-scale: 1;
                transform-origin: 4px 2px;
            }
            #__mac-cursor__.is-clicking {
                --cursor-scale: 0.88;
            }
            #__mac-cursor__ svg {
                transform: scale(var(--cursor-scale));
                transform-origin: 4px 2px;
                transition: transform 90ms ease-out;
            }
            #__mac-cursor__.is-clicking::after {
                content: '';
                position: absolute;
                left: -7px;
                top: -7px;
                width: 24px;
                height: 24px;
                border: 2px solid rgba(88, 166, 255, 0.72);
                border-radius: 999px;
                animation: cinepal-cursor-click 360ms ease-out forwards;
            }
            @keyframes cinepal-cursor-click {
                from {
                    opacity: 0.9;
                    transform: scale(0.35);
                }
                to {
                    opacity: 0;
                    transform: scale(1.85);
                }
            }
        `
        document.head.appendChild(style)

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="33" viewBox="0 0 22 26">
            <defs>
                <filter id="cs" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5"
                                  flood-color="#000000" flood-opacity="0.28"/>
                </filter>
            </defs>
            <path d="M 4 2 L 4 20 L 8.5 15.5 L 12 23.5 L 14.5 22.5 L 11 14.5 L 17.5 14.5 Z"
                  fill="white" stroke="#1c1c1e" stroke-width="1.2" stroke-linejoin="round"
                  filter="url(#cs)"/>
        </svg>`

        const el = document.createElement('div')
        el.id = '__mac-cursor__'
        el.style.cssText = [
            'position: fixed',
            'top: 0',
            'left: 0',
            'width: 28px',
            'height: 33px',
            'pointer-events: none',
            'z-index: 2147483647',
            'will-change: transform',
            'transition: transform 90ms linear',
        ].join(';')
        el.innerHTML = svg

        document.addEventListener('mousemove', (e) => {
            el.style.transform = `translate(${e.clientX}px,${e.clientY}px)`
        }, { passive: true })

        // Seed overlay at the Playwright cursor's known start position.
        el.style.transform = `translate(${startX}px,${startY}px)`

        const attach = () => document.body.appendChild(el)
        document.body ? attach() : document.addEventListener('DOMContentLoaded', attach)
    }, { startX: cursor.x, startY: cursor.y })

    // Drive the real pointer to the same coordinates so overlay and Playwright agree.
    await page.mouse.move(cursor.x, cursor.y)
}
