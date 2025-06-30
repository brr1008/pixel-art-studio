// js/UI.js
class UI {
    constructor(stateManager, toolManager, paletteManager, layerManager, historyManager, animationManager, exportImport) {
        this.state = stateManager;
        this.toolManager = toolManager;
        this.paletteManager = paletteManager;
        this.layerManager = layerManager;
        this.historyManager = historyManager;
        this.animationManager = animationManager;
        this.exportImport = exportImport;

        this.toolIconsContainer = document.getElementById('tool-icons');
        this.toolOptionsArea = document.getElementById('tool-options');
        this.currentColorPicker = document.getElementById('current-color-picker');
        this.brushSizeInput = document.getElementById('brush-size');
        this.brushSizeValueSpan = document.getElementById('brush-size-value');
        this.gridVisibilityToggle = document.getElementById('grid-visibility');
        this.clearCanvasBtn = document.getElementById('clear-canvas-btn');
        this.canvasSizeSpan = document.getElementById('canvas-size');
        this.zoomLevelInput = document.getElementById('zoom-level');
        this.zoomValueSpan = document.getElementById('zoom-value');
        this.undoBtn = document.getElementById('undo-btn');
        this.redoBtn = document.getElementById('redo-btn');

        this.setupEventListeners();
        this.initializeUIState();
    }

    setupEventListeners() {
        // Tool selection
        this.toolIconsContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.tool-btn');
            if (button) {
                const toolName = button.dataset.tool;
                this.toolManager.setActiveTool(toolName);
                this.updateToolUI(toolName);
            }
        });

        // Color picker
        this.currentColorPicker.addEventListener('input', (e) => {
            this.state.setCurrentColor(e.target.value);
            // No need to renderPalette here, PaletteManager handles it.
        });

        // Brush size
        this.brushSizeInput.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            this.state.setBrushSize(size);
            this.brushSizeValueSpan.textContent = size;
        });

        // Grid visibility
        this.gridVisibilityToggle.addEventListener('change', () => {
            this.state.toggleGridVisibility();
            this.layerManager.canvasRenderer.render(); // Re-render to show/hide grid
        });

        // Clear canvas
        this.clearCanvasBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the active layer?')) {
                this.layerManager.canvasRenderer.clearActiveLayer();
                this.historyManager.addState(); // Record clear action
            }
        });

        // Undo/Redo buttons
        this.undoBtn.addEventListener('click', () => this.historyManager.undo());
        this.redoBtn.addEventListener('click', () => this.historyManager.redo());

        // Top menu actions (mocked for now)
        document.getElementById('file-menu-btn').addEventListener('click', () => {
            // In a real app, this would open a modal or dropdown
            const action = prompt("File actions: 'savepng', 'exportjson', 'importjson'");
            if (action === 'savepng') this.exportImport.constructor.exportPNG(document.getElementById('pixel-canvas'), 'pixel-art');
            if (action === 'exportjson') this.exportImport.exportProjectJSON();
            if (action === 'importjson') this.exportImport.importFileInput.click();
        });
        if (this.shareImageBtn) { // Check if the button exists
            this.shareImageBtn.addEventListener('click', () => this.exportImport.shareImage());
        }

    }

    initializeUIState() {
        // Set initial tool active class
        this.updateToolUI(this.state.currentTool);
        // Set initial color picker value
        this.currentColorPicker.value = this.state.currentColor;
        // Set initial brush size value
        this.brushSizeInput.value = this.state.brushSize;
        this.brushSizeValueSpan.textContent = this.state.brushSize;
        // Set initial grid visibility
        this.gridVisibilityToggle.checked = this.state.gridVisible;
        // Initial zoom display
        this.updateZoomDisplay();
        // Initial canvas size display
        this.updateCanvasSizeDisplay();
        // Initial undo/redo button state
        this.historyManager.updateUndoRedoButtons();
        // Render initial palette and layers
        this.paletteManager.renderPalette();
        this.layerManager.renderLayerList();
        this.animationManager.renderFrameList();
        this.animationManager.stopAnimationBtn.disabled = true; // Initially no animation playing
    }

    /**
     * Updates the UI to reflect the active tool and its options.
     */
    updateToolUI(activeToolName) {
        // Remove active class from all tool buttons
        this.toolIconsContainer.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        // Add active class to the current tool button
        document.querySelector(`.tool-btn[data-tool="${activeToolName}"]`).classList.add('active');

        // Dynamically show/hide tool-specific options
        // This is a simplified example. For real use, you'd load a template or modify DOM more precisely.
        this.toolOptionsArea.innerHTML = '';
        if (activeToolName === 'brush' || activeToolName === 'eraser') {
            this.toolOptionsArea.innerHTML = `
                <label for="brush-size">Size:</label>
                <input type="range" id="brush-size-input" min="1" max="20" value="${this.state.brushSize}">
                <span id="brush-size-value">${this.state.brushSize}</span>px
                <label for="brush-shape">Shape:</label>
                <select id="brush-shape-select">
                    <option value="square" ${this.state.brushShape === 'square' ? 'selected' : ''}>Square</option>
                    <option value="circle" ${this.state.brushShape === 'circle' ? 'selected' : ''}>Circle</option>
                </select>
            `;
            // Re-attach event listeners for new elements
            document.getElementById('brush-size-input').addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                this.state.setBrushSize(size);
                document.getElementById('brush-size-value').textContent = size;
            });
            document.getElementById('brush-shape-select').addEventListener('change', (e) => {
                this.state.setBrushShape(e.target.value);
            });

        } else if (activeToolName === 'fill') {
            this.toolOptionsArea.innerHTML = `
                <label for="fill-tolerance">Tolerance:</label>
                <input type="range" id="fill-tolerance-input" min="0" max="255" value="${this.state.fillTolerance}">
                <span id="fill-tolerance-value">${this.state.fillTolerance}</span>
            `;
            document.getElementById('fill-tolerance-input').addEventListener('input', (e) => {
                const tolerance = parseInt(e.target.value);
                this.state.setFillTolerance(tolerance);
                document.getElementById('fill-tolerance-value').textContent = tolerance;
            });
        }
        // ... add logic for other tool options
    }

    updateCanvasSizeDisplay() {
        this.canvasSizeSpan.textContent = `Canvas: ${this.state.canvasWidth}x${this.state.canvasHeight}`;
    }

    updateZoomDisplay() {
        this.zoomValueSpan.textContent = `${Math.round(this.state.zoomLevel * 100)}%`;
        this.zoomLevelInput.value = this.state.zoomLevel;
    }
}

export default UI;