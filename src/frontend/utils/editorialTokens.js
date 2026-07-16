// Single source of truth for the project's colors, fonts, and letter spacing.
// Tailwind (tailwind.config.js) and the chart/map theming (utils/styling/*)
// both derive from this file, so look-and-feel changes happen here only.
//
// Two ink families coexist on purpose:
// - Chart ink (INK, near-black #0b0c0e) renders text/lines on canvas plots.
// - UI ink (UI_COLORS.ink, navy #0f1f3a) drives Tailwind `text-ink` classes.

// Hex tokens - for Plotly, Chart.js, SVG
export const INK          = '#0b0c0e'
export const INK_MUTED    = '#6e6a62'
export const PAPER        = '#f5f1ea'
export const PAPER_RAISED = '#fbf8f2'
export const ACCENT       = '#1953d8'
export const ACCENT_INK   = '#0a2a7a'
export const ACCENT_SOFT  = '#e6edfc'
export const RULE         = 'rgba(11,12,14,0.12)'
export const RULE_STRONG  = 'rgba(11,12,14,0.22)'
export const WARM_HIGHLIGHT = '#e58c2b'
export const RUST         = '#c2501a'
export const DANGER       = '#A32D2D'

// RGB tuples - for DeckGL getFillColor / getLineColor
export const INK_MUTED_RGB   = [110, 106, 98]
export const ACCENT_RGB      = [25, 83, 216]
export const ACCENT_INK_RGB  = [10, 42, 122]
export const ACCENT_SOFT_RGB = [184, 201, 236]
export const WHITE_RGB       = [255, 255, 255]
export const WARM_HIGHLIGHT_RGB = [229, 140, 43]
export const RUST_RGB        = [194, 80, 26]

// Semantic - station health (muted but still semantic)
export const HEALTHY_RGB  = [47, 125, 79]
export const DANGER_RGB   = [163, 45, 45]
export const UNKNOWN_RGB  = [110, 106, 98]

// UI palette - consumed by tailwind.config.js (Tailwind utility classes)
export const UI_COLORS = {
    ink: {
        DEFAULT: '#0f1f3a',
        raised: '#16294a',
        soft: '#2e4267',
        muted: '#6b7f9f',
    },
    paper: {
        DEFAULT: PAPER,
        raised: PAPER_RAISED,
        rail: '#ece6da',
    },
    accent: {
        DEFAULT: ACCENT,
        ink: ACCENT_INK,
        soft: ACCENT_SOFT,
    },
    rule: {
        DEFAULT: RULE,
        strong: RULE_STRONG,
        invert: 'rgba(255,255,255,0.16)',
    },
    brand: {
        DEFAULT: ACCENT,
        dark: ACCENT_INK,
        light: ACCENT_SOFT,
    },
    error: {
        DEFAULT: DANGER,
        bg: '#fff5f5',
        border: 'rgba(163,45,45,0.2)',
    },
}

// Letter spacing - consumed by tailwind.config.js
export const LETTER_SPACING = {
    eyebrow: '0.18em',
    display: '-0.02em',
}

/**
 * Wraps multi-word font names in quotes so the stack is valid CSS.
 * @param {string} name - A single font family name.
 * @returns {string} The name, quoted when it contains spaces.
 */
const quoteFontName = (name) => (name.includes(' ') ? `'${name}'` : name)

// Font stacks - arrays for Tailwind, joined strings for chart libraries
export const FONT_STACK_SANS = ['Inter', '-apple-system', 'system-ui', 'sans-serif'].map(quoteFontName)
export const FONT_STACK_MONO = ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'].map(quoteFontName)
export const FONT_SANS = FONT_STACK_SANS.join(', ')
export const FONT_MONO = FONT_STACK_MONO.join(', ')
