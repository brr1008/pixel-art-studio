// js/utils/colorUtils.js

/**
 * Converts a hex color string to an RGBA object.
 * @param {string} hex - Hex color string (e.g., "#RRGGBB" or "#RRGGBBAA")
 * @param {number} [alpha=1] - Optional alpha value (0-1) to override hex alpha.
 * @returns {object} { r, g, b, a }
 */
export function hexToRgb(hex, alpha = 1) {
    let r = 0, g = 0, b = 0, a = alpha;

    // Handle #RGB format
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    }
    // Handle #RRGGBB format
    else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    // Handle #RRGGBBAA format
    else if (hex.length === 9) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
        a = parseInt(hex.substring(7, 9), 16) / 255;
    }

    return { r, g, b, a: Math.round(a * 255) }; // Return alpha as 0-255 for ImageData
}

/**
 * Converts RGBA values to a hex color string.
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @param {number} [a=255] - Alpha (0-255)
 * @returns {string} Hex color string (e.g., "#RRGGBB" or "#RRGGBBAA" if alpha < 255)
 */
export function rgbToHex(r, g, b, a = 255) {
    const toHex = (c) => Math.round(c).toString(16).padStart(2, '0');
    let hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    if (a < 255) {
        hex += toHex(a);
    }
    return hex.toUpperCase();
}