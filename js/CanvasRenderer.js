import { hexToRgb, rgbToHex } from './utils/colorUtils.js';

class CanvasRenderer {
    constructor(canvasElement, ctx, stageManager) {
        this.canvas = canvasElement;
        this.ctx = ctx;
        this.stageManager = stageManager;
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true});
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.resizeCanvas();
        this.applyZoomAndPan();

        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    }
    resizeCanvas() {
        // The drawing buffer is the actual resolution (logical pixels)
        this.canvas.width = this.state.canvasWidth;
        this.canvas.height = this.state.canvasHeight;
        this.offscreenCanvas.width = this.state.canvasWidth;
        this.offscreenCanvas.height = this.state.canvasHeight;

        // The CSS size is what the user sees, adjusted by zoom and pixel size
        this.canvas.style.width = `${this.state.canvasWidth * this.state.displayPixelSize * this.state.zoomLevel}px`;
        this.canvas.style.height = `${this.state.canvasHeight * this.state.displayPixelSize * this.state.zoomLevel}px`;

        this.render(); // Re-render after resize
    }
    applyZoomAndPan() {
        // For performance, we're doing visual zoom/pan with CSS transform on the canvas element.
        // The internal drawing context remains 1:1 with logical pixels.
        const currentZoom = this.state.zoomLevel * this.state.displayPixelSize; // Combined scaling
        this.canvas.style.transform = `scale(${currentZoom}) translate(${this.state.panX / currentZoom}px, ${this.state.panY / currentZoom}px)`;
        // transform-origin is set in CSS to 0 0
        this.render(); // Re-render after transform
    }
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Render onion skin frames (if enabled and animation is active)
        if (this.state.onionSkinEnabled && this.state.isPlayingAnimation) {
             this.renderOnionSkin();
        }

        // Render all layers
        this.state.layers.forEach((layer, index) => {
            if (layer.visible && layer.data) {
                this.ctx.globalAlpha = layer.opacity;
                this.ctx.putImageData(layer.data, 0, 0);
            }
        });
        this.ctx.globalAlpha = 1; // Reset alpha

        // Render grid on top (if visible)
        if (this.state.gridVisible) {
            this.renderGrid();
        }

        // Render selection overlay
        if (this.state.selectionActive && this.state.selection) {
            this.renderSelection(this.state.selection);
        }
    }
    drawPixel(x, y, color, layerData = null, opacity = 1) {
        if (x < 0 || x >= this.state.canvasWidth || y < 0 || y >= this.state.canvasHeight) {
            return; // Out of bounds
        }

        const targetData = layerData || this.state.activeLayer?.data;
        if (!targetData) return;

        const { r, g, b, a } = hexToRgb(color, opacity);
        const index = (y * this.state.canvasWidth + x) * 4;

        targetData.data[index + 0] = r;
        targetData.data[index + 1] = g;
        targetData.data[index + 2] = b;
        targetData.data[index + 3] = a; // Alpha channel
    }
    fill(startX, startY, newColorHex, tolerance = 0, layerData = null) {
        const targetData = layerData || this.state.activeLayer?.data;
        if (!targetData) return;

        const { data, width, height } = targetData;
        const targetColor = this.getPixelColor(startX, startY, targetData); // Get RGB of starting pixel

        const queue = [{ x: startX, y: startY }];
        const visited = new Set(); // To prevent infinite loops

        const newColorRgb = hexToRgb(newColorHex);

        const getColorKey = (x, y) => `${x},${y}`;

        while (queue.length > 0) {
            const { x, y } = queue.shift();
            const key = getColorKey(x, y);

            if (x < 0 || x >= width || y < 0 || y >= height || visited.has(key)) {
                continue;
            }

            visited.add(key);
            const currentColor = this.getPixelColor(x, y, targetData);

            if (this.colorsAreSimilar(targetColor, currentColor, tolerance)) {
                this.drawPixel(x, y, newColorHex, targetData);

                queue.push({ x: x + 1, y: y });
                queue.push({ x: x - 1, y: y });
                queue.push({ x: x, y: y + 1 });
                queue.push({ x: x, y: y - 1 });
            }
        }
        this.render(); // Re-render the canvas after fill
    }
    getPixelColor(x, y, imageData) {
        if (!imageData) return { r: 0, g: 0, b: 0, a: 0 };
        const index = (y * imageData.width + x) * 4;
        return {
            r: imageData.data[index],
            g: imageData.data[index + 1],
            b: imageData.data[index + 2],
            a: imageData.data[index + 3]
        };
    }
    colorsAreSimilar(color1, color2, tolerance) {
        if (tolerance === 0) {
            return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b && color1.a === color2.a;
        }
        const diffR = Math.abs(color1.r - color2.r);
        const diffG = Math.abs(color1.g - color2.g);
        const diffB = Math.abs(color1.b - color2.b);
        const diffA = Math.abs(color1.a - color2.a);
        return (diffR + diffG + diffB + diffA) / 4 <= tolerance; // Simple average difference
    }
    handleWheel(event) {
        event.preventDefault(); // Prevent page scrolling

        const scaleAmount = 1.1; // Zoom factor
        const mouseX = event.clientX - this.canvas.getBoundingClientRect().left;
        const mouseY = event.clientY - this.canvas.getBoundingClientRect().top;

        // Current zoom level
        const currentZoom = this.state.zoomLevel * this.state.displayPixelSize;

        let newZoom = this.state.zoomLevel;
        if (event.deltaY < 0) { // Zoom in
            newZoom *= scaleAmount;
        } else { // Zoom out
            newZoom /= scaleAmount;
        }

        // Clamp zoom level
        newZoom = Math.max(0.1, Math.min(5, newZoom));

        // Calculate new pan to keep mouse point fixed
        const oldX = (mouseX / currentZoom) - (this.state.panX / currentZoom);
        const oldY = (mouseY / currentZoom) - (this.state.panY / currentZoom);

        const newDisplayZoom = newZoom * this.state.displayPixelSize;
        const newPanX = mouseX - (oldX * newDisplayZoom);
        const newPanY = mouseY - (oldY * newDisplayZoom);

        this.state.setZoom(newZoom);
        this.state.setPan(newPanX, newPanY);
        this.applyZoomAndPan();

        // Update UI
        document.getElementById('zoom-level').value = newZoom;
        document.getElementById('zoom-value').textContent = `${Math.round(newZoom * 100)}%`;
    }
    renderGrid() {
        this.ctx.strokeStyle = this.state.gridColor;
        this.ctx.lineWidth = 1; // Thin lines

        for (let x = 0; x <= this.state.canvasWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.state.canvasHeight);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.state.canvasHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.state.canvasWidth, y);
            this.ctx.stroke();
        }
    }
    renderSelection(selection) {
        if (!selection) return;
        this.ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)'; // Blue selection outline
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 2]); // Dashed line
        this.ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
        this.ctx.setLineDash([]); // Reset line dash
    }
    renderOnionSkin() {
        const currentFrameIndex = this.state.currentFrameIndex;
        const totalFrames = this.state.frames.length;
        const onionSkinOpacity = this.state.onionSkinOpacity;
        const framesToShow = this.state.onionSkinFrames;

        for (let i = 1; i <= framesToShow; i++) {
            // Render previous frames
            const prevFrameIndex = (currentFrameIndex - i + totalFrames) % totalFrames;
            if (prevFrameIndex !== currentFrameIndex && this.state.frames[prevFrameIndex]?.layerDataSnapshot) {
                this.ctx.globalAlpha = onionSkinOpacity / i; // Fading opacity
                this.ctx.putImageData(this.state.frames[prevFrameIndex].layerDataSnapshot, 0, 0);
            }

            // Render next frames
            const nextFrameIndex = (currentFrameIndex + i) % totalFrames;
            if (nextFrameIndex !== currentFrameIndex && this.state.frames[nextFrameIndex]?.layerDataSnapshot) {
                this.ctx.globalAlpha = onionSkinOpacity / i;
                this.ctx.putImageData(this.state.frames[nextFrameIndex].layerDataSnapshot, 0, 0);
            }
        }
        this.ctx.globalAlpha = 1; // Reset
    }
    getPixelCoordinatesFromEvent(event) {
        const rect = this.canvas.getBoundingClientRect();
        // Calculate mouse position relative to canvas *display* area
        const clientX = event.clientX - rect.left;
        const clientY = event.clientY - rect.top;

        // Account for CSS scaling and panning to get to 'logical' canvas coordinates
        const rawX = clientX / (this.state.zoomLevel * this.state.displayPixelSize) - this.state.panX / (this.state.zoomLevel * this.state.displayPixelSize);
        const rawY = clientY / (this.state.zoomLevel * this.state.displayPixelSize) - this.state.panY / (this.state.zoomLevel * this.state.displayPixelSize);


        const pixelX = Math.floor(rawX);
        const pixelY = Math.floor(rawY);

        return { pixelX, pixelY, rawX, rawY };
    }
    clearActiveLayer() {
        const activeLayer = this.state.activeLayer;
        if (activeLayer && activeLayer.data) {
            const data = activeLayer.data.data;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 0;     // R
                data[i + 1] = 0; // G
                data[i + 2] = 0; // B
                data[i + 3] = 0; // A (fully transparent)
            }
            this.render();
        }
    }
    createTransparentImageData(width, height) {
        this.offscreenCtx.clearRect(0, 0, width, height); // Clear to transparent
        return this.offscreenCtx.getImageData(0, 0, width, height);
    }
}

export default CanvasRenderer;