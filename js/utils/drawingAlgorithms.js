// js/utils/drawingAlgorithms.js

/**
 * Generates pixel coordinates for a square or circular brush.
 * @param {number} cx - Center X coordinate (logical pixel)
 * @param {number} cy - Center Y coordinate (logical pixel)
 * @param {number} size - Brush size (e.g., 1 for 1x1, 3 for 3x3)
 * @param {string} shape - 'square' or 'circle'
 * @returns {Array<{x: number, y: number}>} Array of pixel coordinates.
 */
export function getBrushPixels(cx, cy, size, shape = 'square') {
    const pixels = [];
    const radius = Math.floor(size / 2);

    for (let xOffset = -radius; xOffset <= radius; xOffset++) {
        for (let yOffset = -radius; yOffset <= radius; yOffset++) {
            const x = cx + xOffset;
            const y = cy + yOffset;

            if (shape === 'circle') {
                // Check if within circle radius (simple distance check)
                const distanceSquared = (xOffset * xOffset) + (yOffset * yOffset);
                if (distanceSquared > (radius + 0.5) * (radius + 0.5)) {
                    continue;
                }
            }
            pixels.push({ x, y });
        }
    }
    return pixels;
}

/**
 * Implements Bresenham's line algorithm.
 * @param {number} x0 - Start X
 * @param {number} y0 - Start Y
 * @param {number} x1 - End X
 * @param {number} y1 - End Y
 * @returns {Array<{x: number, y: number}>} Array of pixel coordinates forming the line.
 */
export function getLinePixels(x0, y0, x1, y1) {
    const pixels = [];
    x0 = Math.floor(x0); y0 = Math.floor(y0);
    x1 = Math.floor(x1); y1 = Math.floor(y1);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        pixels.push({ x: x0, y: y0 });
        if ((x0 === x1) && (y0 === y1)) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
    return pixels;
}

/**
 * Generates pixel coordinates for a filled rectangle.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {Array<{x: number, y: number}>}
 */
export function getFilledRectanglePixels(x1, y1, x2, y2) {
    const pixels = [];
    const startX = Math.min(x1, x2);
    const endX = Math.max(x1, x2);
    const startY = Math.min(y1, y2);
    const endY = Math.max(y1, y2);

    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            pixels.push({ x, y });
        }
    }
    return pixels;
}

/**
 * Generates pixel coordinates for an outlined rectangle.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {Array<{x: number, y: number}>}
 */
export function getOutlinedRectanglePixels(x1, y1, x2, y2) {
    const pixels = [];
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    // Top and bottom lines
    for (let x = minX; x <= maxX; x++) {
        pixels.push({ x, y: minY });
        pixels.push({ x, y: maxY });
    }
    // Left and right lines (avoid corners already added)
    for (let y = minY + 1; y < maxY; y++) {
        pixels.push({ x: minX, y });
        pixels.push({ x: maxX, y });
    }
    return pixels;
}

// Additional algorithms like getCirclePixels, getFilledCirclePixels would go here.
// These are significantly more complex to implement accurately for pixel art.
// A common approach for circles is Midpoint Circle Algorithm.