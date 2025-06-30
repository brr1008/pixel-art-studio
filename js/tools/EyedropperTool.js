// js/tools/EyedropperTool.js
import BaseTool from './BaseTool.js';
import { rgbToHex } from '../utils/colorUtils.js';

class EyedropperTool extends BaseTool {
    constructor(stateManager, canvasRenderer, layerManager, historyManager) {
        super(stateManager, canvasRenderer, layerManager, historyManager);
    }

    onMouseDown(event) {
        // Eyedropper doesn't initiate a 'drawing' state, it's a one-shot action
        const { pixelX, pixelY } = this.getPixelCoords(event);
        const layers = this.state.layers;

        // Iterate through layers from top to bottom to pick the visible color
        let pickedColor = { r: 0, g: 0, b: 0, a: 0 }; // Default to transparent black

        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (layer.visible && layer.data) {
                const pixelColor = this.canvasRenderer.getPixelColor(pixelX, pixelY, layer.data);
                if (pixelColor.a > 0) { // If pixel is not fully transparent on this layer
                    // For simplicity, just pick the first non-transparent color from top.
                    // For true blending, you'd need to composite all layers up to this point.
                    pickedColor = pixelColor;
                    break;
                }
            }
        }

        if (pickedColor) {
            const hexColor = rgbToHex(pickedColor.r, pickedColor.g, pickedColor.b);
            this.state.setCurrentColor(hexColor);
            // Optionally, switch back to brush tool after picking
            this.state.setCurrentTool('brush');
            document.getElementById('tool-select').value = 'brush'; // Update UI
            document.getElementById('current-color-picker').value = hexColor; // Update UI
        }
    }

    onMouseMove(event) {
        // No continuous action for eyedropper
    }

    onMouseUp(event) {
        // No continuous action for eyedropper
    }
}

export default EyedropperTool;