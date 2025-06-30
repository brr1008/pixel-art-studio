// js/HistoryManager.js
class HistoryManager {
    constructor(stateManager, layerManager, canvasRenderer) {
        this.state = stateManager;
        this.layerManager = layerManager;
        this.canvasRenderer = canvasRenderer;
        this.historyStack = [];
        this.historyPointer = -1; // Points to the current state in the stack
        this.maxHistoryStates = 50; // Limit history size to prevent memory issues
    }

    /**
     * Captures the current state of all layers and adds it to the history stack.
     * This should be called after any significant drawing operation.
     */
    addState() {
        // Only save state if something actually changed (optimization)
        const currentLayersData = this.state.layers.map(layer => {
            // Create a copy of ImageData to avoid reference issues
            const clonedData = this.canvasRenderer.createTransparentImageData(this.state.canvasWidth, this.state.canvasHeight);
            if (layer.data) {
                clonedData.data.set(layer.data.data); // Copy pixel data
            }
            return {
                id: layer.id,
                name: layer.name,
                visible: layer.visible,
                opacity: layer.opacity,
                data: clonedData // Store the cloned ImageData
            };
        });

        // Clear future history if we're not at the latest state
        if (this.historyPointer < this.historyStack.length - 1) {
            this.historyStack = this.historyStack.slice(0, this.historyPointer + 1);
        }

        this.historyStack.push(currentLayersData);

        // Enforce max history states
        if (this.historyStack.length > this.maxHistoryStates) {
            this.historyStack.shift(); // Remove the oldest state
        } else {
            this.historyPointer++;
        }

        this.updateUndoRedoButtons();
        // console.log(`History state added. Stack size: ${this.historyStack.length}, Pointer: ${this.historyPointer}`);
    }

    /**
     * Applies a historical state to the current canvas.
     * @param {Array<Object>} historicalLayersData - The layer data to restore.
     */
    _applyState(historicalLayersData) {
        // Create new layer objects for state manager from history data
        const newLayers = historicalLayersData.map(histLayer => {
            const newLayerData = this.canvasRenderer.createTransparentImageData(this.state.canvasWidth, this.state.canvasHeight);
            newLayerData.data.set(histLayer.data.data); // Copy pixel data
            return {
                id: histLayer.id,
                name: histLayer.name,
                visible: histLayer.visible,
                opacity: histLayer.opacity,
                data: newLayerData
            };
        });

        // Directly set the layers in StateManager
        // This bypasses addLayer/removeLayer events which might trigger history adds
        this.state._layers = newLayers;
        // Re-set active layer index to a valid one if current one no longer exists
        if (this.state.activeLayerIndex >= newLayers.length) {
            this.state._activeLayerIndex = newLayers.length > 0 ? newLayers.length - 1 : -1;
        }

        this.layerManager.renderLayerList(); // Update layer UI
        this.canvasRenderer.render(); // Re-render canvas
    }

    /**
     * Undoes the last action.
     */
    undo() {
        if (this.historyPointer > 0) {
            this.historyPointer--;
            const previousState = this.historyStack[this.historyPointer];
            this._applyState(previousState);
            this.updateUndoRedoButtons();
            console.log("Undo executed.");
        } else {
            console.log("Nothing to undo.");
        }
    }

    /**
     * Redoes the last undone action.
     */
    redo() {
        if (this.historyPointer < this.historyStack.length - 1) {
            this.historyPointer++;
            const nextState = this.historyStack[this.historyPointer];
            this._applyState(nextState);
            this.updateUndoRedoButtons();
            console.log("Redo executed.");
        } else {
            console.log("Nothing to redo.");
        }
    }

    /**
     * Updates the enabled/disabled state of undo/redo buttons in the UI.
     * Assumes buttons have IDs 'undo-btn' and 'redo-btn'.
     */
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');

        if (undoBtn) {
            undoBtn.disabled = this.historyPointer <= 0;
        }
        if (redoBtn) {
            redoBtn.disabled = this.historyPointer >= this.historyStack.length - 1;
        }
    }

    /**
     * Clears all history. Useful when loading a new project.
     */
    clearHistory() {
        this.historyStack = [];
        this.historyPointer = -1;
        this.addState(); // Add initial state after clearing
        this.updateUndoRedoButtons();
    }
}

export default HistoryManager;