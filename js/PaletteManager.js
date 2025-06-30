// js/PaletteManager.js
import { rgbToHex } from './utils/colorUtils.js'; // Assuming colorUtils.js exists

class PaletteManager {
    constructor(stateManager) {
        this.state = stateManager;
        this.paletteDisplay = document.getElementById('palette-display');
        this.currentColorPicker = document.getElementById('current-color-picker');
        this.addToPaletteBtn = document.getElementById('add-to-palette-btn');

        this.addToPaletteBtn.addEventListener('click', this.addCurrentColorToPalette.bind(this));
        this.paletteDisplay.addEventListener('click', this.handlePaletteClick.bind(this));
        this.currentColorPicker.addEventListener('input', this.handleColorPickerChange.bind(this));
    }

    /**
     * Renders the current palette colors to the UI.
     */
    renderPalette() {
        this.paletteDisplay.innerHTML = ''; // Clear existing
        this.state.palette.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'palette-color-swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.color = color; // Store color in dataset for easy retrieval
            this.paletteDisplay.appendChild(swatch);
        });
        this.currentColorPicker.value = this.state.currentColor; // Ensure picker matches state
    }

    /**
     * Adds the currently selected color to the palette.
     */
    addCurrentColorToPalette() {
        const colorToAdd = this.state.currentColor.toUpperCase(); // Ensure consistent format
        if (!this.state.palette.includes(colorToAdd)) {
            const newPalette = [...this.state.palette, colorToAdd];
            this.state.setPalette(newPalette);
            this.renderPalette();
        } else {
            console.log("Color already in palette.");
        }
    }

    /**
     * Handles clicks on palette swatches to set current color.
     */
    handlePaletteClick(event) {
        const swatch = event.target.closest('.palette-color-swatch');
        if (swatch) {
            const color = swatch.dataset.color;
            this.state.setCurrentColor(color);
            this.currentColorPicker.value = color; // Update native color picker
        }
    }

    /**
     * Updates state when native color picker changes.
     */
    handleColorPickerChange(event) {
        this.state.setCurrentColor(event.target.value);
    }

    // --- Advanced Palette Management (to be implemented) ---
    saveCustomPalette(name) {
        // Implement saving current palette to state._customPalettes
    }

    loadCustomPalette(name) {
        // Implement loading from state._customPalettes
    }
    // ... methods for managing custom palettes
}

export default PaletteManager;