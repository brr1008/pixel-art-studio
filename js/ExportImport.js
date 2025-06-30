// js/ExportImport.js
class ExportImport {
    constructor(stateManager, layerManager) {
        this.state = stateManager;
        this.layerManager = layerManager;

        this.importFileInput = document.getElementById('import-file-input');
        // Assuming you'll have specific buttons for export types (PNG, JSON, GIF)
        document.getElementById('file-menu-btn')?.addEventListener('click', this.handleFileMenu.bind(this));
        // You'll need to create actual buttons for Save as PNG, Export JSON, Import JSON
        document.getElementById('save-png-btn').addEventListener('click', this.exportPNG.bind(this));
        document.getElementById('export-json-btn').addEventListener('click', this.exportProjectJSON.bind(this));
        document.getElementById('import-json-btn').addEventListener('click', () => this.importFileInput.click());
        this.importFileInput.addEventListener('change', this.handleFileImport.bind(this));
    }

    // This is a placeholder for a more complex menu system
    handleFileMenu() {
        console.log("File menu clicked. Implement dropdown for Save/Load options.");
        // In a real app, this would open a dropdown with options
        // For now, let's just expose the functions via a mock button click
        const savePngBtn = document.createElement('button');
        savePngBtn.textContent = "Save PNG";
        savePngBtn.onclick = () => this.exportPNG(document.getElementById('pixel-canvas'), 'pixel-art');

        const exportJsonBtn = document.createElement('button');
        exportJsonBtn.textContent = "Export JSON";
        exportJsonBtn.onclick = () => this.exportProjectJSON();

        const importJsonBtn = document.createElement('button');
        importJsonBtn.textContent = "Import JSON";
        importJsonBtn.onclick = () => this.importFileInput.click();

        // Add to body temporarily for testing
        document.body.appendChild(savePngBtn);
        document.body.appendChild(exportJsonBtn);
        document.body.appendChild(importJsonBtn);
    }

    /**
     * Exports the current canvas view as a PNG image.
     * @param {HTMLCanvasElement} canvas The canvas element to export.
     * @param {string} filename The desired filename.
     */
    async shareImage() {
        const canvas = document.getElementById('pixel-canvas'); // Get your main drawing canvas
        if (!canvas) {
            console.error("Main canvas element not found for sharing.");
            return;
        }

        try {
            // Option 1: Use Navigator.share() API (for web-share enabled browsers on mobile/desktop)
            if (navigator.share) {
                // To share a file, you typically need to fetch it as a Blob
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                const file = new File([blob], 'pixel_art.png', { type: 'image/png' });

                await navigator.share({
                    files: [file],
                    title: 'Check out my pixel art!',
                    text: 'I created this pixel art using my awesome studio!',
                    url: window.location.href // Optional: share the URL to your app
                });
                console.log('Image shared successfully!');
            } else {
                // Option 2: Fallback to direct download if Web Share API is not available
                alert('Your browser does not support direct sharing. The image will be downloaded instead. You can then share it manually!');
                ExportImport.exportPNG(canvas, 'my_pixel_art'); // Reuse existing export function
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Share canceled by user.');
            } else {
                console.error('Error sharing image:', error);
                alert('Failed to share image. Please try again or download it directly.');
            }
        }
    }
    
    static exportPNG(canvas, filename = 'pixel-art') {
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    /**
     * Exports the entire project state (layers, frames, palette, etc.) as a JSON file.
     * This requires converting ImageData to a serializable format (e.g., base64 string).
     */
    exportProjectJSON() {
        const serializableState = {
            canvasWidth: this.state.canvasWidth,
            canvasHeight: this.state.canvasHeight,
            palette: this.state.palette,
            // layers: this.state.layers.map(layer => ({
            //     id: layer.id,
            //     name: layer.name,
            //     visible: layer.visible,
            //     opacity: layer.opacity,
            //     // Convert ImageData to base64 string
            //     data: this.imageDataToBase64(layer.data)
            // })),
            // frames: this.state.frames.map(frame => ({
            //     id: frame.id,
            //     name: frame.name,
            //     duration: frame.duration,
            //     layerDataSnapshot: frame.layerDataSnapshot.map(snapLayer => ({
            //          id: snapLayer.id,
            //          name: snapLayer.name,
            //          visible: snapLayer.visible,
            //          opacity: snapLayer.opacity,
            //          data: this.imageDataToBase64(snapLayer.data)
            //     }))
            // }))
            // Temporarily use a simpler export for initial development,
            // full ImageData serialization is complex and requires base64 encoding/decoding.
            // For now, let's just export a simplified layer data structure for demonstration
            layers: this.state.layers.map(layer => ({
                id: layer.id,
                name: layer.name,
                visible: layer.visible,
                opacity: layer.opacity,
                // For simplified export, just store raw pixel values as array
                // NOT RECOMMENDED FOR LARGE CANVAS DUE TO SIZE
                // For proper solution, convert to/from base64 or a more compact format
                pixelData: Array.from(layer.data.data)
            })),
             frames: this.state.frames.map(frame => ({
                id: frame.id,
                name: frame.name,
                duration: frame.duration,
                layerDataSnapshot: frame.layerDataSnapshot.map(snapLayer => ({
                     id: snapLayer.id,
                     name: snapLayer.name,
                     visible: snapLayer.visible,
                     opacity: snapLayer.opacity,
                     pixelData: Array.from(snapLayer.data.data)
                }))
            }))
        };

        const blob = new Blob([JSON.stringify(serializableState, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pixel-art-project.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Converts ImageData to a Base64 string for serialization.
     * (Requires a temporary canvas)
     */
    imageDataToBase64(imageData) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        tempCtx.putImageData(imageData, 0, 0);
        return tempCanvas.toDataURL(); // Defaults to PNG data URI
    }

    /**
     * Converts a Base64 string back to ImageData.
     * (Requires creating an Image object)
     */
    async base64ToImageData(base64String, width, height) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = width;
                tempCanvas.height = height;
                tempCtx.drawImage(img, 0, 0, width, height);
                const imageData = tempCtx.getImageData(0, 0, width, height);
                resolve(imageData);
            };
            img.onerror = reject;
            img.src = base64String;
        });
    }

    /**
     * Handles importing a JSON project file or an image file.
     */
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                if (file.type === 'application/json') {
                    const importedState = JSON.parse(e.target.result);
                    await this.importProjectJSON(importedState);
                } else if (file.type.startsWith('image/')) {
                    await this.importImage(e.target.result); // Base64 image data
                } else {
                    alert('Unsupported file type.');
                }
            } catch (error) {
                console.error('Error importing file:', error);
                alert('Failed to import file. It might be corrupted or an invalid format.');
            } finally {
                event.target.value = ''; // Clear file input for next import
            }
        };
        reader.readAsDataURL(file); // For images, read as Data URL
        // reader.readAsText(file); // For JSON, read as text
    }

    /**
     * Imports a project from a JSON object.
     * This needs to reconstruct ImageData objects from base64 strings.
     */
    async importProjectJSON(importedState) {
        console.log("Importing project:", importedState);
        // Clear current state and history first
        this.state._layers = [];
        this.state._frames = [];
        this.state._activeLayerIndex = -1;
        // this.historyManager.clearHistory(); // Needs access to HistoryManager

        this.state.setCanvasDimensions(importedState.canvasWidth, importedState.canvasHeight);
        this.state.setPalette(importedState.palette || []);

        // Reconstruct layers
        for (const layerData of importedState.layers) {
            // const imageData = await this.base64ToImageData(layerData.data, this.state.canvasWidth, this.state.canvasHeight);
            // Temporarily for simplified export/import:
            const imageData = this.layerManager.canvasRenderer.createTransparentImageData(this.state.canvasWidth, this.state.canvasHeight);
            imageData.data.set(layerData.pixelData); // Direct array set
            this.state.addLayer({
                id: layerData.id,
                name: layerData.name,
                visible: layerData.visible,
                opacity: layerData.opacity,
                data: imageData
            });
        }

        // Reconstruct frames
        for (const frameData of importedState.frames) {
            const layerDataSnapshot = [];
            for (const snapLayerData of frameData.layerDataSnapshot) {
                // const imageData = await this.base64ToImageData(snapLayerData.data, this.state.canvasWidth, this.state.canvasHeight);
                // Temporarily for simplified export/import:
                const imageData = this.layerManager.canvasRenderer.createTransparentImageData(this.state.canvasWidth, this.state.canvasHeight);
                imageData.data.set(snapLayerData.pixelData);
                layerDataSnapshot.push({
                    id: snapLayerData.id,
                    name: snapLayerData.name,
                    visible: snapLayerData.visible,
                    opacity: snapLayerData.opacity,
                    data: imageData
                });
            }
            this.state.addFrame({
                id: frameData.id,
                name: frameData.name,
                duration: frameData.duration,
                layerDataSnapshot: layerDataSnapshot
            });
        }

        // Set active layer/frame
        if (this.state.layers.length > 0) {
            this.state.setActiveLayer(0);
        }
        if (this.state.frames.length > 0) {
            this.state.setCurrentFrame(0);
            this.layerManager.loadFrame(this.state.frames[0]); // Load the first frame into layers
        } else {
             // If no frames, ensure a blank layer is present
            this.layerManager.addLayer('Layer 1');
        }


        // Update UI components
        this.layerManager.renderLayerList();
        this.layerManager.canvasRenderer.resizeCanvas(); // Ensure canvas matches new dimensions
        this.layerManager.canvasRenderer.render();
        this.state.setCurrentTool('brush'); // Reset tool
        this.layerManager.canvasRenderer.render();
        // this.historyManager.addState(); // Add initial state after import

        alert('Project imported successfully!');
    }

    /**
     * Imports an image file into a new layer or replaces current layer.
     * This will scale the image to fit the current canvas or ask user for options.
     * @param {string} imageDataUrl - The base64 Data URL of the image.
     */
    async importImage(imageDataUrl) {
        console.log("Importing image...");
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Option 1: Resize canvas to image size
                // this.state.setCanvasDimensions(img.width, img.height);
                // this.layerManager.canvasRenderer.resizeCanvas();

                // Option 2: Scale image to fit current canvas size
                const newLayerData = this.layerManager.canvasRenderer.createTransparentImageData(
                    this.state.canvasWidth, this.state.canvasHeight
                );

                this.layerManager.canvasRenderer.offscreenCtx.clearRect(0, 0, newLayerData.width, newLayerData.height);
                // Draw image scaled to fit canvas
                this.layerManager.canvasRenderer.offscreenCtx.drawImage(
                    img, 0, 0, newLayerData.width, newLayerData.height
                );
                const importedImageData = this.layerManager.canvasRenderer.offscreenCtx.getImageData(
                    0, 0, newLayerData.width, newLayerData.height
                );

                // Add as a new layer
                const newLayer = {
                    id: Date.now(),
                    name: 'Imported Image',
                    data: importedImageData,
                    visible: true,
                    opacity: 1
                };
                this.state.addLayer(newLayer);
                this.state.setActiveLayer(this.state.layers.length - 1); // Make it active
                this.layerManager.renderLayerList();
                this.layerManager.canvasRenderer.render();
                // this.historyManager.addState();
                alert('Image imported successfully!');
                resolve();
            };
            img.onerror = (err) => {
                console.error("Error loading image:", err);
                alert("Failed to load image.");
                reject(err);
            };
            img.src = imageDataUrl;
        });
    }

    // --- Potential GIF Export (requires external library, e.g., gif.js) ---
    exportGIF() {
        // This is a complex feature that typically requires a separate library.
        // E.g., using `gif.js` or `jsgif`
        console.warn("GIF export requires an external library and significant implementation.");
    }
}

export default ExportImport;