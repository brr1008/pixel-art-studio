// js/tools/BrushTool.js
import BaseTool from './BaseTool.js';
import { getBrushPixels } from '../utils/drawingAlgorithms.js'; // Helper for brush shapes

class BrushTool extends BaseTool {
    constructor(stateManager, canvasRenderer, layerManager, historyManager) {
        super(stateManager, canvasRenderer, layerManager, historyManager);
        this.lastX = -1;
        this.lastY = -1;
    }

    onMouseDown(event) {
        super.onMouseDown(event);
        const { pixelX, pixelY } = this.getPixelCoords(event);
        const activeLayerData = this.getActiveLayerData();
        if (!activeLayerData) return;

        // Initial pixel draw
        this.drawBrushStroke(pixelX, pixelY, activeLayerData);
        this.canvasRenderer.render(); // Update canvas
        this.lastX = pixelX;
        this.lastY = pixelY;
    }

    onMouseMove(event) {
        if (!this.isDrawing) return;

        const { pixelX, pixelY } = this.getPixelCoords(event);
        const activeLayerData = this.getActiveLayerData();
        if (!activeLayerData) return;

        // Draw line between last pixel and current for smooth strokes
        if (this.lastX !== -1 && this.lastY !== -1) {
            this.drawSmoothStroke(this.lastX, this.lastY, pixelX, pixelY, activeLayerData);
        } else {
            this.drawBrushStroke(pixelX, pixelY, activeLayerData);
        }

        this.canvasRenderer.render();
        this.lastX = pixelX;
        this.lastY = pixelY;
    }

    onMouseUp(event) {
        super.onMouseUp(event);
        this.lastX = -1; // Reset for next stroke
        this.lastY = -1;
    }

    onMouseLeave(event) {
        super.onMouseLeave(event); // Ensure history is added even if mouse leaves
        this.lastX = -1;
        this.lastY = -1;
    }

    /**
     * Draws a single brush application (square or circle)
     */
    drawBrushStroke(cx, cy, layerData) {
        const brushSize = this.state.brushSize;
        const brushShape = this.state.brushShape;
        const color = this.state.currentColor;

        // Get all pixel coordinates that the brush covers
        const brushPixels = getBrushPixels(cx, cy, brushSize, brushShape);

        brushPixels.forEach(({ x, y }) => {
            this.canvasRenderer.drawPixel(x, y, color, layerData);
        });
    }

    /**
     * Draws a line of brush strokes to ensure smooth drawing.
     * Uses a simplified Bresenham-like approach for brush strokes.
     */
    drawSmoothStroke(x0, y0, x1, y1, layerData) {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1;
        const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while (true) {
            this.drawBrushStroke(x0, y0, layerData);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }
}

export default BrushTool;