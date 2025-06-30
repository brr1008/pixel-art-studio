// js/tools/BaseTool.js
/**
 * Base class for all drawing tools. Provides common properties and methods.
 * All specific tools should extend this class and override relevant handlers.
 */
class BaseTool {
    constructor(stateManager, canvasRenderer, layerManager, historyManager) {
        this.state = stateManager;
        this.canvasRenderer = canvasRenderer;
        this.layerManager = layerManager;
        this.historyManager = historyManager;
        this.isDrawing = false; // Common state for drag-based tools
    }

    /**
     * Called when the mouse button is pressed down on the canvas.
     * @param {MouseEvent} event
     */
    onMouseDown(event) {
        this.isDrawing = true;
        // Logic for starting the tool action (e.g., capture initial point for lines)
    }

    /**
     * Called when the mouse moves over the canvas (while a button might be pressed).
     * @param {MouseEvent} event
     */
    onMouseMove(event) {
        // Logic for real-time drawing/preview (e.g., drawing brush strokes, rubber banding for shapes)
    }

    /**
     * Called when the mouse button is released over the canvas.
     * @param {MouseEvent} event
     */
    onMouseUp(event) {
        if (this.isDrawing) {
            this.isDrawing = false;
            // Finalize the drawing action and commit to history
            this.historyManager.addState(); // Save the canvas state after action
        }
    }

    /**
     * Called when the mouse leaves the canvas area.
     * @param {MouseEvent} event
     */
    onMouseLeave(event) {
        if (this.isDrawing) {
            this.isDrawing = false;
            // Optionally, finalize the drawing or discard if incomplete
            this.historyManager.addState();
        }
    }

    /**
     * Called when a keyboard key is pressed.
     * @param {KeyboardEvent} event
     */
    onKeyDown(event) {
        // Tool-specific keyboard shortcuts
    }

    /**
     * Helper to get pixel coordinates from a mouse event.
     */
    getPixelCoords(event) {
        return this.canvasRenderer.getPixelCoordinatesFromEvent(event);
    }

    /**
     * Helper to get the active layer's ImageData.
     */
    getActiveLayerData() {
        return this.state.activeLayer?.data;
    }
}

export default BaseTool;