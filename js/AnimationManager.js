// js/AnimationManager.js
class AnimationManager {
    constructor(stateManager, layerManager, canvasRenderer) {
        this.state = stateManager;
        this.layerManager = layerManager;
        this.canvasRenderer = canvasRenderer;
        this.animationInterval = null;

        this.timelineFrames = document.getElementById('timeline-frames');
        this.addFrameBtn = document.getElementById('add-frame-btn');
        this.duplicateFrameBtn = document.getElementById('duplicate-frame-btn');
        this.deleteFrameBtn = document.getElementById('delete-frame-btn');
        this.playAnimationBtn = document.getElementById('play-animation-btn');
        this.stopAnimationBtn = document.getElementById('stop-animation-btn');
        this.onionSkinToggle = document.getElementById('onion-skin-toggle');


        this.addFrameBtn.addEventListener('click', this.addFrame.bind(this));
        this.duplicateFrameBtn.addEventListener('click', this.duplicateCurrentFrame.bind(this));
        this.deleteFrameBtn.addEventListener('click', this.deleteCurrentFrame.bind(this));
        this.playAnimationBtn.addEventListener('click', this.playAnimation.bind(this));
        this.stopAnimationBtn.addEventListener('click', this.stopAnimation.bind(this));
        this.timelineFrames.addEventListener('click', this.handleFrameClick.bind(this));
        this.onionSkinToggle.addEventListener('change', this.toggleOnionSkin.bind(this));

        // Initialize with a default frame if no frames exist
        if (this.state.frames.length === 0) {
            this.addFrame('Frame 1', true); // Add first frame on init
        }
    }

    /**
     * Adds a new frame. Optionally copies current layer data.
     */
    addFrame(name = `Frame ${this.state.frames.length + 1}`, copyCurrentState = false) {
        let snapshot = null;
        if (copyCurrentState) {
            // Create a deep copy of all layers' ImageData for the frame
            snapshot = this.state.layers.map(layer => {
                const clonedData = this.canvasRenderer.createTransparentImageData(this.state.canvasWidth, this.state.canvasHeight);
                if (layer.data) {
                    clonedData.data.set(layer.data.data);
                }
                return {
                    id: layer.id,
                    name: layer.name, // Can be useful for debugging
                    visible: layer.visible, // Snapshot visible state too
                    opacity: layer.opacity,
                    data: clonedData
                };
            });
        } else {
            // New frame is initially blank
            snapshot = [{
                id: Date.now(),
                name: 'Blank Layer',
                visible: true,
                opacity: 1,
                data: this.canvasRenderer.createTransparentImageData(this.state.canvasWidth, this.state.canvasHeight)
            }];
        }

        const newFrame = {
            id: Date.now(),
            name: name,
            duration: 100, // Default duration in ms
            layerDataSnapshot: snapshot // Store the combined data or list of layer data
        };
        this.state.addFrame(newFrame);
        this.state.setCurrentFrame(this.state.frames.length - 1); // Make new frame active
        this.renderFrameList();
        this.loadFrame(newFrame); // Display the new frame
    }

    /**
     * Duplicates the current active frame.
     */
    duplicateCurrentFrame() {
        const currentFrame = this.state.frames[this.state.currentFrameIndex];
        if (!currentFrame) return;

        // Create a deep copy of the layer data snapshot
        const duplicatedSnapshot = currentFrame.layerDataSnapshot.map(layerSnap => {
            const clonedData = this.canvasRenderer.createTransparentImageData(this.state.canvasWidth, this.state.canvasHeight);
            if (layerSnap.data) {
                clonedData.data.set(layerSnap.data.data);
            }
            return {
                id: Date.now() + Math.random(), // New ID for duplicated layer data
                name: layerSnap.name,
                visible: layerSnap.visible,
                opacity: layerSnap.opacity,
                data: clonedData
            };
        });

        const newFrame = {
            id: Date.now(),
            name: `${currentFrame.name} Copy`,
            duration: currentFrame.duration,
            layerDataSnapshot: duplicatedSnapshot
        };

        // Insert duplicated frame right after the current one
        this.state.frames.splice(this.state.currentFrameIndex + 1, 0, newFrame);
        this.state.setCurrentFrame(this.state.currentFrameIndex + 1);
        this.renderFrameList();
        this.loadFrame(newFrame); // Display the duplicated frame
    }

    /**
     * Deletes the current active frame.
     */
    deleteCurrentFrame() {
        if (this.state.frames.length > 1) { // Always keep at least one frame
            const currentFrameIndex = this.state.currentFrameIndex;
            this.state.removeFrame(currentFrameIndex);
            this.renderFrameList();
            this.loadFrame(this.state.frames[this.state.currentFrameIndex]); // Load the new current frame
        } else {
            console.warn("Cannot delete the last frame.");
        }
    }

    /**
     * Loads a specific frame's pixel data into the active layers.
     * This essentially replaces the current layer content with the frame's content.
     */
    loadFrame(frame) {
        if (!frame || !frame.layerDataSnapshot) return;

        // Clear existing layers and populate from frame's snapshot
        this.state._layers = []; // Directly modify to avoid history issues for this operation

        frame.layerDataSnapshot.forEach(layerSnap => {
            const newLayerData = this.canvasRenderer.createTransparentImageData(this.state.canvasWidth, this.state.canvasHeight);
            if (layerSnap.data) {
                newLayerData.data.set(layerSnap.data.data);
            }
            this.state._layers.push({
                id: layerSnap.id,
                name: layerSnap.name,
                visible: layerSnap.visible,
                opacity: layerSnap.opacity,
                data: newLayerData
            });
        });
        this.state.setActiveLayer(0); // Set first layer active by default for loaded frame
        this.layerManager.renderLayerList(); // Update layer UI to match frame's layers
        this.canvasRenderer.render(); // Re-render canvas
    }

    /**
     * Renders the list of frames in the UI timeline.
     */
    renderFrameList() {
        this.timelineFrames.innerHTML = '';
        this.state.frames.forEach((frame, index) => {
            const frameItem = document.createElement('div');
            frameItem.className = `frame-item ${index === this.state.currentFrameIndex ? 'active' : ''}`;
            frameItem.dataset.frameIndex = index;
            // frameItem.draggable = true; // Enable drag-and-drop for reordering frames

            frameItem.innerHTML = `Frame ${index + 1} (${frame.duration}ms)`;
            this.timelineFrames.appendChild(frameItem);
        });
    }

    /**
     * Handles clicks on frame items (to select active frame).
     */
    handleFrameClick(event) {
        const frameItem = event.target.closest('.frame-item');
        if (frameItem) {
            const index = parseInt(frameItem.dataset.frameIndex);
            if (index !== this.state.currentFrameIndex) {
                this.state.setCurrentFrame(index);
                this.renderFrameList(); // Update active state in UI
                this.loadFrame(this.state.frames[index]); // Display the selected frame
            }
        }
    }

    /**
     * Toggles onion skinning on/off.
     */
    toggleOnionSkin() {
        this.state.toggleOnionSkin();
        this.canvasRenderer.render(); // Re-render to show/hide onion skin
    }

    /**
     * Starts animation playback.
     */
    playAnimation() {
        if (this.state.frames.length <= 0 || this.state.isPlayingAnimation) return;

        this.state.togglePlayingAnimation();
        this.playAnimationBtn.disabled = true;
        this.stopAnimationBtn.disabled = false;

        let frameIndex = this.state.currentFrameIndex;
        const animate = () => {
            const currentFrame = this.state.frames[frameIndex];
            if (currentFrame) {
                this.state.setCurrentFrame(frameIndex); // Update state
                this.renderFrameList(); // Update UI
                this.loadFrame(currentFrame); // Display frame

                frameIndex = (frameIndex + 1) % this.state.frames.length;
                this.animationInterval = setTimeout(animate, currentFrame.duration);
            } else {
                this.stopAnimation(); // Stop if no frames left
            }
        };
        this.animationInterval = setTimeout(animate, 0); // Start immediately
    }

    /**
     * Stops animation playback.
     */
    stopAnimation() {
        clearTimeout(this.animationInterval);
        this.animationInterval = null;
        this.state.togglePlayingAnimation();
        this.playAnimationBtn.disabled = false;
        this.stopAnimationBtn.disabled = true;

        // Ensure canvas shows the last frame played or the original current frame
        this.loadFrame(this.state.frames[this.state.currentFrameIndex]);
        this.canvasRenderer.render(); // Ensure onion skin is off if toggled
    }

    /**
     * Called when canvas dimensions change, needs to resize frame data too.
     */
    handleCanvasResize(newWidth, newHeight) {
        this.state.frames.forEach(frame => {
            // Create new ImageData for the new dimensions
            const newLayerSnapshot = frame.layerDataSnapshot.map(layerSnap => {
                const newImageData = this.canvasRenderer.createTransparentImageData(newWidth, newHeight);
                // Copy old data to new, handling size differences (e.g., clipping or extending with transparency)
                if (layerSnap.data) {
                    const originalData = layerSnap.data;
                    for (let y = 0; y < Math.min(originalData.height, newHeight); y++) {
                        for (let x = 0; x < Math.min(originalData.width, newWidth); x++) {
                            const oldIndex = (y * originalData.width + x) * 4;
                            const newIndex = (y * newWidth + x) * 4;
                            newImageData.data[newIndex + 0] = originalData.data[oldIndex + 0];
                            newImageData.data[newIndex + 1] = originalData.data[oldIndex + 1];
                            newImageData.data[newIndex + 2] = originalData.data[oldIndex + 2];
                            newImageData.data[newIndex + 3] = originalData.data[oldIndex + 3];
                        }
                    }
                }
                return { ...layerSnap, data: newImageData };
            });
            frame.layerDataSnapshot = newLayerSnapshot;
        });
        // Reload current frame to apply resize changes
        if (this.state.activeLayerIndex !== -1) {
             this.loadFrame(this.state.frames[this.state.currentFrameIndex]);
        }
    }
}

export default AnimationManager;