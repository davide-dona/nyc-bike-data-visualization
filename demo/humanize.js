/** Shared easing / timing primitives for the demo's human-like motion. */

export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
