import StageManager from './StageManager.js';
import CanvasRenderer from './CanvasRenderer.js';
import ToolManager from './ToolManager.js';
import PaletteManager from './PaletteManager.js';
import LayerManager from './LayerManager.js';
import HistoryManager from './HistoryManager.js';
import AnimationManager from './AnimationManager.js';
import ExportImporter from './ExportImporter.js';
import UI from './UI.js';

const pixelCanvas = document.getElementById('pixelCanvas');
const ctx = pixelCanvas.getContext('2d');
const appContainer = document.getElementById('appContainer');
const zoomLevelInput = document.getElementById('zoomLevel');
const zoomValueSpan = document.getElementById('zoomValue');
const coordinatesSpan = document.getElementById('coordinates');
const canvasSizeSpan = document.getElementById('canvas-size');

const state = new StageManager();
const canvasRenderer = new CanvasRenderer(ctx, pixelCanvas, state);
const paletteManager = new PaletteManager(state);
const layerManager = new LayerManager(state, canvasRenderer);
const historyManager = new HistoryManager(state, layerManager, canvasRenderer);
const animationManager = new AnimationManager(state, layerManager, canvasRenderer);
const toolManager = new ToolManager(state, canvasRenderer, paletteManager, layerManager, historyManager, animationManager);
const exportImport = new ExportImport(state, layerManager);
const ui = new UI(state, toolManager, paletteManager, layerManager, historyManager, animationManager, exportImport);

function initializeStudio() {
    // Set initial canvas dimensions
    const initialWidth = 32;
    const initialHeight = 32;
    state.setCanvasDimensions(initialWidth, initialHeight);
    state.setPixelSize(10); // Display 10x10 actual pixels on screen per logical pixel
    canvasRenderer.resizeCanvas(); // Set canvas element dimensions

    // Create initial layer
    layerManager.addLayer("Layer 1");
    layerManager.setActiveLayer(0);

    // Render initial state
    canvasRenderer.render();
    ui.updateCanvasSizeDisplay();
    ui.updateLayerList();
    ui.updateFrameList();
    paletteManager.renderPalette(); // Render default palette

    pixelCanvas.addEventListener('mousedown', (e) => toolManager.handleMouseDown(e));
    pixelCanvas.addEventListener('mousemove', (e) => toolManager.handleMouseMove(e));
    pixelCanvas.addEventListener('mouseup', (e) => toolManager.handleMouseUp(e));
    pixelCanvas.addEventListener('mouseleave', (e) => toolManager.handleMouseLeave(e)); // Important for drag tools

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) { // Ctrl for Windows/Linux, Cmd for Mac
            if (e.key === 'z') {
                e.preventDefault(); // Prevent browser undo
                historyManager.undo();
            } else if (e.key === 'y') {
                e.preventDefault(); // Prevent browser redo
                historyManager.redo();
            } else if (e.key === 's') {
                e.preventDefault(); // Prevent browser save dialog
                // Export as PNG (or bring up save dialog)
                ExportImport.exportPNG(pixelCanvas, 'pixel-art');
            }
        }
        // Tool shortcuts
        toolManager.handleKeyDown(e);
    });

    zoomLevelInput.addEventListener('input', () => {
        state.setZoom(parseFloat(zoomLevelInput.value));
        canvasRenderer.applyZoomAndPan();
        ui.updateZoomDisplay();
    });

    // Mouse movement to show coordinates
    pixelCanvas.addEventListener('mousemove', (e) => {
        const { pixelX, pixelY } = canvasRenderer.getPixelCoordinatesFromEvent(e);
        coordinatesSpan.textContent = `X: ${pixelX} Y: ${pixelY}`;
    });
    pixelCanvas.addEventListener('mouseleave', () => {
        coordinatesSpan.textContent = `X: - Y: -`;
    });

    // Initial render
    canvasRenderer.render();
}

initializeStudio();

// Expose relevant objects for debugging in console (optional)
window.state = state;
window.canvasRenderer = canvasRenderer;
window.layerManager = layerManager;
window.historyManager = historyManager;
window.toolManager = toolManager;