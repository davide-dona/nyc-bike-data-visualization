/** Converts a 3- or 6-digit hex color to an rgba() string with the given alpha; falls back to the editorial accent blue when malformed. */
export function toRgba(hexColor, alpha) {
    if (!hexColor?.startsWith("#") || (hexColor.length !== 7 && hexColor.length !== 4)) {
        return `rgba(25, 83, 216, ${alpha})`;
    }

    const expanded =
        hexColor.length === 4
            ? `#${hexColor[1]}${hexColor[1]}${hexColor[2]}${hexColor[2]}${hexColor[3]}${hexColor[3]}`
            : hexColor;

    const red = Number.parseInt(expanded.slice(1, 3), 16);
    const green = Number.parseInt(expanded.slice(3, 5), 16);
    const blue = Number.parseInt(expanded.slice(5, 7), 16);

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
