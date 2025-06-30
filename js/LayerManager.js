// js/LayerManager.js
class LayerManager {
    constructor(stateManager, canvasRenderer) {
        this.state = stateManager;
        this.canvasRenderer = canvasRenderer;
        this.layersList = document.getElementById('layers-list');
        this.addLayerBtn = document.getElementById('add-layer-btn');
        this.deleteLayerBtn = document.getElementById('delete-layer-btn');
        this.moveLayerUpBtn = document.getElementById('move-layer-up-btn');
        this.moveLayerDownBtn = document.getElementById('move-layer-down-btn');
        this.mergeLayerBtn = document.getElementById('merge-layer-btn'); // For merging layers

        this.addLayerBtn.addEventListener('click', () => this.addLayer(`Layer ${this.state.layers.length + 1}`));
        this.deleteLayerBtn.addEventListener('click', this.deleteActiveLayer.bind(this));
        this.moveLayerUpBtn.addEventListener('click', () => this.moveActiveLayer(-1));
        this.moveLayerDownBtn.addEventListener('click', () => this.moveActiveLayer(1));
        this.mergeLayerBtn.addEventListener('click', this.mergeActiveLayerDown.bind(this));

        this.layersList.addEventListener('click', this.handleLayerListClick.bind(this));
    }

    /**
     * Adds a new transparent layer.
     */
    addLayer(name) {
        const newLayerData = this.canvasRenderer.createTransparentImageData(
            this.state.canvasWidth,
            this.state.canvasHeight
        );
        const newLayer = {
            id: Date.now(), // Unique ID
            name: name,
            data: newLayerData,
            visible: true,
            opacity: 1
        };
        this.state.addLayer(newLayer);
        this.state.setActiveLayer(this.state.layers.length - 1); // Make new layer active
        this.renderLayerList();
        this.canvasRenderer.render();
    }

    /**
     * Deletes the active layer.
     */
    deleteActiveLayer() {
        if (this.state.layers.length > 1) { // Always keep at least one layer
            const activeIndex = this.state.activeLayerIndex;
            this.state.removeLayer(activeIndex);
            this.renderLayerList();
            this.canvasRenderer.render();
        } else {
            console.warn("Cannot delete the last layer.");
        }
    }

    /**
     * Moves the active layer up or down in the stack.
     * @param {number} direction - -1 for up, 1 for down.
     */
    moveActiveLayer(direction) {
        const oldIndex = this.state.activeLayerIndex;
        let newIndex = oldIndex + direction;

        if (newIndex >= 0 && newIndex < this.state.layers.length) {
            this.state.moveLayer(oldIndex, newIndex);
            this.renderLayerList();
            this.canvasRenderer.render();
        }
    }

    /**
     * Merges the active layer with the layer below it.
     */
    mergeActiveLayerDown() {
        const activeIndex = this.state.activeLayerIndex;
        if (activeIndex > 0 && this.state.layers.length > 1) {
            const activeLayer = this.state.activeLayer;
            const layerBelow = this.state.layers[activeIndex - 1];

            if (!activeLayer || !layerBelow) return;

            // Use offscreen canvas to composite
            this.canvasRenderer.offscreenCtx.clearRect(0, 0, this.state.canvasWidth, this.state.canvasHeight);

            // Draw layer below first
            this.canvasRenderer.offscreenCtx.putImageData(layerBelow.data, 0, 0);
            // Draw active layer on top, respecting its opacity
            this.canvasRenderer.offscreenCtx.globalAlpha = activeLayer.opacity;
            this.canvasRenderer.offscreenCtx.putImageData(activeLayer.data, 0, 0);
            this.canvasRenderer.offscreenCtx.globalAlpha = 1; // Reset alpha

            // Get combined image data
            const mergedData = this.canvasRenderer.offscreenCtx.getImageData(
                0, 0, this.state.canvasWidth, this.state.canvasHeight
            );

            // Update layer below's data
            layerBelow.data = mergedData;

            // Remove the active layer
            this.state.removeLayer(activeIndex);
            this.state.setActiveLayer(activeIndex - 1); // Set the merged layer as active

            this.renderLayerList();
            this.canvasRenderer.render();
        } else {
            console.warn("Cannot merge active layer down.");
        }
    }

    /**
     * Renders the layer list UI.
     */
    renderLayerList() {
        this.layersList.innerHTML = '';
        this.state.layers.forEach((layer, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = `layer-item ${index === this.state.activeLayerIndex ? 'active' : ''}`;
            layerItem.dataset.layerIndex = index;
            layerItem.draggable = true; // Enable drag-and-drop reordering

            layerItem.innerHTML = `
                <input type="checkbox" ${layer.visible ? 'checked' : ''} data-action="toggle-visibility">
                <span>${layer.name}</span>
                <span class="layer-opacity">${Math.round(layer.opacity * 100)}%</span>
                <button class="layer-options-btn" data-action="options">⚙️</button>
            `;
            this.layersList.appendChild(layerItem);
        });

        // Add drag-and-drop listeners (simplified here)
        this.addDragDropListeners();
    }

    /**
     * Handles clicks on layer list items (activate, toggle visibility, options).
     */
    handleLayerListClick(event) {
        const layerItem = event.target.closest('.layer-item');
        if (!layerItem) return;

        const index = parseInt(layerItem.dataset.layerIndex);
        const action = event.target.dataset.action;

        if (action === 'toggle-visibility') {
            this.state.toggleLayerVisibility(index);
        } else {
            this.state.setActiveLayer(index); // Activate layer on click anywhere else on item
        }
        this.renderLayerList(); // Re-render to update active class
        this.canvasRenderer.render(); // Re-render canvas to reflect changes
    }

    // --- Drag and Drop for Layer Reordering (simplified) ---
    addDragDropListeners() {
        // A full drag-and-drop implementation is complex.
        // It involves dragstart, dragover, dragenter, dragleave, drop, dragend.
        // You'd need to store the `draggedElementIndex` on `dragstart`
        // And then on `drop`, calculate the `targetIndex` and call `this.state.moveLayer(draggedIndex, targetIndex)`
        // For brevity, the full D&D logic is omitted here.
    }
}

export default LayerManager;