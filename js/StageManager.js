class StageManager {
    constructor() {
        this._canvasWidth = 32; // Default canvas width
        this._canvasHeight = 32; // Default canvas height
        this._displayPixelSize = 10; // Size of each pixel in the canvas (in
        this._zoomLevel = 1;
        this._panX = 0;
        this._panY = 0;
        this._gridVisible = true;
        this._gridColor = '#888888';

        this._currentTool = 'brush';
        this._currentColor = '#000000';
        this._brushSize = 1;
        this._brushShape = 'square';
        this._fillTolerance = 0;

        this._palette = [
            '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
            '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#C0C0C0'
        ];
        this._customPalettes = {};

        this._layers = [];
        this._activeLayerIndex = -1;

        this._frames = [];
        this._currentFrameIndex = 0;
        this._isPlayingAnimation = false;
        this._onionSkinEnabled = false;
        this._onionSkinOpacity = 0.3;
        this._onionSkinFrames = 1;
    }

    get canvasWidth() { return this._canvasWidth; }
    get canvasHeight() { return this._canvasHeight; }
    get displayPixelSize() { return this._displayPixelSize; }
    get zoomLevel() { return this._zoomLevel; }
    get panX() { return this._panX; }
    get panY() { return this._panY; }
    get gridVisible() { return this._gridVisible; }
    get gridColor() { return this._gridColor; }

    get currentTool() { return this._currentTool; }
    get currentColor() { return this._currentColor; }
    get brushSize() { return this._brushSize; }
    get brushShape() { return this._brushShape; }
    get fillTolerance() { return this._fillTolerance; }

    get palette() { return [...this._palette]; }
    get customPalettes() { return this._customPalettes; }

    get layers() { return [...this._layers]; }
    get activeLayerIndex() { return this._activeLayerIndex; }
    get activeLayer() { return this._layers[this._activeLayerIndex] || null; }

    get frames() { return [...this._frames]; }
    get currentFrameIndex() { return this._currentFrameIndex; }
    get isPlayingAnimation() { return this._isPlayingAnimation; }
    get onionSkinEnabled() { return this._onionSkinEnabled; }
    get onionSkinOpacity() { return this._onionSkinOpacity; }
    get onionSkinFrames() { return this._onionSkinFrames; }

    get selection() { return this._selection; }
    get selectionActive() { return this._selectionActive; }

    setCanvasDimentions(width, height) {
        this._canvasWidth = Math.max(1, parseInt(width));
        this._canvasHeight = Math.max(1, parseInt(height));
    }
    setDisplayPixelSizee(size) {
        this._displayPixelSize = Math.max(1, parseFloat(size));
    }
    setZoom(level) {
        this._zoomLevel = Math.max(0.1, Math.min(5, parseFloat(level)));
    }
    setPan(x, y) {
        this._panX = x;
        this._panY = y;
    }
    toggleGridVisibility() {
        this._gridVisible = !this._gridVisible;
    }
    setGridColor(color) {
        this._gridColor = color;
    }
    setCurrentTool(tool) {
        this._currentTool = tool;
    }
    setCurrentColor(color) {
        this._currentColor = color;
    }
    setBrushSize(size) {
        this._brushSize = Math.max(1, parseInt(size));
    }
    setBrushShape(shape) {
        if(['square', 'circle'].includes(shape)) {
            this._brushShape = shape;   
        }
    }
    setFillTolerance(tolerance) {
        this._fillTolerance = Math.max(0, Math.min(255, parseInt(tolerance)));
    }
    setPalette(newPalette) {
        this._palette = [...newPalette];
    }
    addCustomPalette(name, colors) {
        if (name && Array.isArray(colors) && colors.length > 0) {
            this._customPalettes[name] = [...colors];
        }
    }
    removeCustomPalette(name) {
        if (this._customPalettes[name]) {
            delete this._customPalettes[name];
        }
    }
    addPaletteColor(color) {
        if (!this._palette.includes(color)) {
            this._palette.push(color);
        }
    }
    removePaletteColor(color) {
        this._palette = this._palette.filter(c => c !== color);
    }
    addLayer(layer) {
        this._layers.push(layer);
        if (this._activeLayerIndex === -1) { // Set active if first layer
            this._activeLayerIndex = 0;
        }
    }
    removeLayer(index) {
        if (index > -1 && index < this._layers.length) {
            this._layers.splice(index, 1);
            if (this._activeLayerIndex >= this._layers.length && this._layers.length > 0) {
                this._activeLayerIndex = this._layers.length - 1;
            } else if (this._layers.length === 0) {
                this._activeLayerIndex = -1;
            }
        }
    }
    setActiveLayer(index) {
        if (index > -1 && index < this._layers.length) {
            this._activeLayerIndex = index;
        }
    }
    setLayerOpacity(index, opacity) {
        if (this._layers[index]) {
            this._layers[index].opacity = Math.max(0, Math.min(1, parseFloat(opacity)));
        }
    }
    toggleLayerVisibility(index) {
        if (this._layers[index]) {
            this._layers[index].visible = !this._layers[index].visible;
        }
    }
    moveLayer(fromIndex, toIndex) {
        if (fromIndex !== toIndex && fromIndex >= 0 && fromIndex < this._layers.length &&
            toIndex >= 0 && toIndex < this._layers.length) {
            const [movedLayer] = this._layers.splice(fromIndex, 1);
            this._layers.splice(toIndex, 0, movedLayer);
            if (this._activeLayerIndex === fromIndex) {
                this._activeLayerIndex = toIndex;
            } else if (this._activeLayerIndex >= Math.min(fromIndex, toIndex) &&
                       this._activeLayerIndex <= Math.max(fromIndex, toIndex)) {
                // Adjust active layer index if it was affected by the move
                if (fromIndex < toIndex) {
                    this._activeLayerIndex--;
                } else {
                    this._activeLayerIndex++;
                }
            }
        }
    }
    addFrame(frame) {
        this._frames.push(frame);
    }
    removeFrame(index) {
        if (index > -1 && index < this._frames.length) {
            this._frames.splice(index, 1);
            if (this._currentFrameIndex >= this._frames.length && this._frames.length > 0) {
                this._currentFrameIndex = this._frames.length - 1;
            } else if (this._frames.length === 0) {
                this._currentFrameIndex = -1;
            }
        }
    }
    setCurrentFrame(index) {
        if (index > -1 && index < this._frames.length) {
            this._currentFrameIndex = index;
        }
    }
    togglePlayingAnimation() {
        this._isPlayingAnimation = !this._isPlayingAnimation;
    }
    toggleOnionSkin() {
        this._onionSkinEnabled = !this._onionSkinEnabled;
    }
    setOnionSkinOpacity(opacity) {
        this._onionSkinOpacity = Math.max(0, Math.min(1, parseFloat(opacity)));
    }
    setOnionSkinFrames(frames) {
        this._onionSkinFrames = Math.max(0, parseInt(frames));
    }
    setSelection(selectionRect) { // { x, y, width, height }
        this._selection = selectionRect;
        this._selectionActive = !!selectionRect;
    }
    clearSelection() {
        this._selection = null;
        this._selectionActive = false;
    }
}

export default StageManager;