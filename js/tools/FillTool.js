// js/tools/FillTool.js
import BaseTool from './BaseTool.js';

class FillTool extends BaseTool {
    constructor(stateManager, canvasRenderer, layerManager, historyManager) {
        super(stateManager, canvasRenderer, layerManager, historyManager);
    }

    onMouseDown(event) {
        super.onMouseDown(event); // This will set isDrawing to true and add history
        if (!this.state.activeLayer) {
            console.warn("No active layer to fill.");
            return;
        }

        const { pixelX, pixelY } = this.getPixelCoords(event);
        const targetColor = this.canvasRenderer.getPixelColor(pixelX, pixelY, this.getActiveLayerData());
        const replacementColor = this.state.currentColor;
        const tolerance = this.state.fillTolerance;

        // Only fill if target color is different from replacement color
        if (targetColor && targetColor.a !== 0 || replacementColor !== '#00000000') { // Check if not completely transparent
            if (this.canvasRenderer.rgbToHex(targetColor) !== replacementColor) { // Assuming rgbToHex exists in CanvasRenderer
                this.canvasRenderer.fill(pixelX, pixelY, replacementColor, tolerance, this.getActiveLayerData());
                this.historyManager.addState(); // Commit fill to history
            }
        }
        this.isDrawing = false; // Fill is a single click operation
    }

    onMouseMove(event) {
        // No continuous action for fill tool
    }

    onMouseUp(event) {
        // No continuous action for fill tool
    }
}

export default FillTool;