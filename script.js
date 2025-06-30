// script.js

// --- DOM Elements ---
const pixelGrid = document.getElementById('pixelGrid');
const gridWidthInput = document.getElementById('gridWidth');
const gridHeightInput = document.getElementById('gridHeight');
const widthValueSpan = document.getElementById('widthValue');
const heightValueSpan = document.getElementById('heightValue');
const createGridBtn = document.getElementById('createGridBtn');
const colorPicker = document.getElementById('colorPicker');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const toolButtons = document.querySelectorAll('.tool-button');
const toolPenBtn = document.getElementById('toolPen');
const toolEraserBtn = document.getElementById('toolEraser');
const toolFillBtn = document.getElementById('toolFill');

// Message Modal Elements
const messageModal = document.getElementById('messageModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalButtons = document.getElementById('modalButtons');

// --- State Variables ---
let currentGridWidth = parseInt(gridWidthInput.value);
let currentGridHeight = parseInt(gridHeightInput.value);
let currentColor = colorPicker.value;
let currentTool = 'pen'; // 'pen', 'eraser', 'fill'
let isDrawing = false; // Flag to track if mouse is down for drawing
const defaultPixelColor = '#ffffff'; // White background for empty pixels

// --- Utility Functions ---

/**
 * Converts an RGB color string (e.g., "rgb(255, 0, 0)") to a hex color string (e.g., "#FF0000").
 * Handles both rgb() and rgba() formats.
 * @param {string} rgb - The RGB color string.
 * @returns {string} The hex color string.
 */
function rgbToHex(rgb) {
    // Check if it's already a hex color
    if (rgb.startsWith('#')) {
        return rgb.toLowerCase();
    }

    // Extract R, G, B values from rgb(R, G, B) or rgba(R, G, B, A)
    const parts = rgb.match(/\d+/g);
    if (!parts || parts.length < 3) {
        return defaultPixelColor; // Fallback if parsing fails
    }

    const r = parseInt(parts[0]);
    const g = parseInt(parts[1]);
    const b = parseInt(parts[2]);

    // Convert to hex and pad with leading zeros if necessary
    const toHex = (c) => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return '#' + toHex(r) + toHex(g) + toHex(b);
}

/**
 * Shows a custom modal message.
 * @param {string} title - The title of the modal.
 * @param {string} message - The message content.
 * @param {Array<Object>} buttons - Array of button objects { text, class, callback }.
 */
function showModal(title, message, buttons) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalButtons.innerHTML = ''; // Clear previous buttons

    buttons.forEach(btnConfig => {
        const button = document.createElement('button');
        button.textContent = btnConfig.text;
        button.className = `py-3 px-4 rounded-lg font-semibold transition duration-300 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-75 ${btnConfig.class}`;
        button.addEventListener('click', () => {
            messageModal.classList.add('hidden');
            if (btnConfig.callback) {
                btnConfig.callback();
            }
        });
        modalButtons.appendChild(button);
    });

    messageModal.classList.remove('hidden');
}

/**
 * Helper to get the actual background color of a pixel, converted to hex.
 * @param {HTMLElement} pixelElement - The pixel div element.
 * @returns {string} The hex color string (e.g., "#RRGGBB").
 */
function getPixelColor(pixelElement) {
    // Use getComputedStyle to get the actual rendered background color
    const computedColor = window.getComputedStyle(pixelElement).backgroundColor;
    return rgbToHex(computedColor);
}

/**
 * Helper to get the row and column of a pixel element.
 * @param {HTMLElement} pixelElement - The pixel div element.
 * @returns {{row: number, col: number}} The coordinates.
 */
function getPixelCoordinates(pixelElement) {
    const index = Array.from(pixelGrid.children).indexOf(pixelElement);
    const row = Math.floor(index / currentGridWidth);
    const col = index % currentGridWidth;
    return { row, col };
}

/**
 * Helper to get a pixel element by its row and column.
 * @param {number} row - The row index.
 * @param {number} col - The column index.
 * @returns {HTMLElement|null} The pixel element or null if out of bounds.
 */
function getPixelByCoordinates(row, col) {
    if (row >= 0 && row < currentGridHeight && col >= 0 && col < currentGridWidth) {
        const index = row * currentGridWidth + col;
        return pixelGrid.children[index];
    }
    return null;
}

// --- Grid Generation and Drawing Functions ---

/**
 * Creates the pixel grid based on currentGridWidth and currentGridHeight.
 * Clears any existing pixels before creating new ones.
 * @param {Array<string>} [initialColors=null] - Optional array of hex color strings to pre-fill the grid.
 */
function createGrid(initialColors = null) {
    pixelGrid.innerHTML = '';
    pixelGrid.style.gridTemplateColumns = `repeat(${currentGridWidth}, 1fr)`;
    pixelGrid.style.gridTemplateRows = `repeat(${currentGridHeight}, 1fr)`;

    const totalPixels = currentGridWidth * currentGridHeight;
    for (let i = 0; i < totalPixels; i++) {
        const pixel = document.createElement('div');
        pixel.classList.add('pixel');
        // Apply initial color if provided, otherwise default to white
        pixel.style.backgroundColor = initialColors && initialColors[i] ? initialColors[i] : defaultPixelColor;
        pixelGrid.appendChild(pixel);
    }
}

/**
 * Applies the current drawing color to a single pixel.
 * @param {HTMLElement} pixelElement - The pixel div element to color.
 */
function drawPixel(pixelElement) {
    pixelElement.style.backgroundColor = currentColor;
}

/**
 * Erases a single pixel by setting its color to the default background color.
 * @param {HTMLElement} pixelElement - The pixel div element to erase.
 */
function erasePixel(pixelElement) {
    pixelElement.style.backgroundColor = defaultPixelColor;
}

/**
 * Performs a flood fill operation starting from a clicked pixel.
 * @param {HTMLElement} startPixelElement - The pixel element where the fill started.
 */
function fillPixels(startPixelElement) {
    const targetColor = getPixelColor(startPixelElement);
    // If the target color is already the current color, or if it's transparent, do nothing
    if (targetColor === currentColor) {
        return;
    }

    const queue = [startPixelElement];
    const visited = new Set(); // To keep track of visited pixels to prevent infinite loops

    while (queue.length > 0) {
        const currentPixel = queue.shift(); // Get the next pixel from the queue

        // Get unique identifier for the pixel (e.g., its index)
        const pixelId = Array.from(pixelGrid.children).indexOf(currentPixel);

        // If this pixel has already been visited or is not the target color, skip it
        if (visited.has(pixelId) || getPixelColor(currentPixel) !== targetColor) {
            continue;
        }

        // Mark as visited and change its color
        visited.add(pixelId);
        currentPixel.style.backgroundColor = currentColor;

        // Get coordinates of the current pixel
        const { row, col } = getPixelCoordinates(currentPixel);

        // Check and add neighbors to the queue
        const neighbors = [
            getPixelByCoordinates(row - 1, col), // Up
            getPixelByCoordinates(row + 1, col), // Down
            getPixelByCoordinates(row, col - 1), // Left
            getPixelByCoordinates(row, col + 1)  // Right
        ];

        neighbors.forEach(neighbor => {
            if (neighbor && getPixelColor(neighbor) === targetColor) {
                const neighborId = Array.from(pixelGrid.children).indexOf(neighbor);
                if (!visited.has(neighborId)) {
                    queue.push(neighbor);
                }
            }
        });
    }
}


/**
 * Handles mouse interactions (mousedown, mouseover) on the pixel grid.
 * Dispatches to the appropriate tool function based on `currentTool`.
 * @param {MouseEvent} e - The mouse event object.
 */
function handlePixelInteraction(e) {
    if (!e.target.classList.contains('pixel')) {
        return; // Only interact with pixel elements
    }

    if (currentTool === 'pen' && isDrawing) {
        drawPixel(e.target);
    } else if (currentTool === 'eraser' && isDrawing) {
        erasePixel(e.target);
    } else if (currentTool === 'fill' && !isDrawing) { // Fill only on click, not drag
        fillPixels(e.target);
    }
}

// --- Event Listeners ---

// Update width value display
gridWidthInput.addEventListener('input', () => {
    currentGridWidth = parseInt(gridWidthInput.value);
    widthValueSpan.textContent = currentGridWidth;
});

// Update height value display
gridHeightInput.addEventListener('input', () => {
    currentGridHeight = parseInt(gridHeightInput.value);
    heightValueSpan.textContent = currentGridHeight;
});

// Create grid button click
createGridBtn.addEventListener('click', () => {
    showModal(
        'Confirm Grid Creation',
        'Creating a new grid will clear your current drawing. Are you sure?',
        [
            { text: 'Yes, Create', class: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500', callback: createGrid },
            { text: 'Cancel', class: 'bg-gray-300 text-gray-800 hover:bg-gray-400 focus:ring-gray-400' }
        ]
    );
});

// Color picker change
colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
});

// Tool selection buttons
toolButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove 'active' class from all tool buttons
        toolButtons.forEach(btn => btn.classList.remove('active', 'bg-blue-500', 'text-white', 'border-blue-700'));
        toolButtons.forEach(btn => btn.classList.add('bg-gray-300', 'text-gray-800'));

        // Add 'active' class to the clicked button
        button.classList.add('active', 'bg-blue-500', 'text-white');
        button.classList.remove('bg-gray-300', 'text-gray-800');

        currentTool = button.dataset.tool;
    });
});

// Mouse down on grid to start drawing/fill
pixelGrid.addEventListener('mousedown', (e) => {
    isDrawing = true;
    // For pen/eraser, draw immediately on mousedown
    if (currentTool === 'pen' || currentTool === 'eraser') {
        handlePixelInteraction(e);
    } else if (currentTool === 'fill') {
        // For fill, trigger only on initial click (not drag)
        handlePixelInteraction(e);
        isDrawing = false; // Reset drawing flag immediately after fill
    }
});

// Mouse over on grid to continue drawing while dragging (only for pen/eraser)
pixelGrid.addEventListener('mouseover', (e) => {
    if (isDrawing && (currentTool === 'pen' || currentTool === 'eraser')) {
        handlePixelInteraction(e);
    }
});

// Mouse up anywhere to stop drawing
document.addEventListener('mouseup', () => {
    isDrawing = false;
});

// Clear button click
clearBtn.addEventListener('click', () => {
    showModal(
        'Confirm Clear Canvas',
        'This will erase your entire drawing. Are you sure?',
        [
            { text: 'Yes, Clear', class: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400', callback: () => {
                const pixels = document.querySelectorAll('.pixel');
                pixels.forEach(pixel => {
                    pixel.style.backgroundColor = defaultPixelColor; // Reset to white
                });
            }},
            { text: 'Cancel', class: 'bg-gray-300 text-gray-800 hover:bg-gray-400 focus:ring-gray-400' }
        ]
    );
});

// Download button click
downloadBtn.addEventListener('click', () => {
    // Create a temporary canvas element
    const canvas = document.createElement('canvas');
    // Scale up the image for better quality (e.g., each pixel becomes 10x10 on output)
    const scale = 10;
    canvas.width = currentGridWidth * scale;
    canvas.height = currentGridHeight * scale;
    const ctx = canvas.getContext('2d');

    const pixels = document.querySelectorAll('.pixel');
    pixels.forEach((pixel, index) => {
        const row = Math.floor(index / currentGridWidth);
        const col = index % currentGridWidth;
        ctx.fillStyle = getPixelColor(pixel); // Use helper to get consistent hex color
        ctx.fillRect(col * scale, row * scale, scale, scale);
    });

    // Create a link element and trigger download
    const link = document.createElement('a');
    link.download = 'pixel-art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// Share button click
shareBtn.addEventListener('click', () => {
    const pixels = document.querySelectorAll('.pixel');
    // Get all pixel colors and join them into a comma-separated string
    // Use rgbToHex to ensure consistent color format for sharing
    const pixelColors = Array.from(pixels).map(pixel => getPixelColor(pixel));
    const encodedColors = encodeURIComponent(pixelColors.join(','));

    // Construct the shareable URL
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodedColors}&width=${currentGridWidth}&height=${currentGridHeight}`;

    showModal(
        'Share Your Pixel Art',
        'Copy the link below to share your masterpiece!',
        [
            {
                text: 'Copy Link',
                class: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
                callback: () => {
                    // Create a temporary input to copy from
                    const tempInput = document.createElement('input');
                    tempInput.value = shareUrl;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    tempInput.setSelectionRange(0, 99999); // For mobile devices
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    // Show a brief success message in the modal
                    modalMessage.textContent = 'Link copied to clipboard!';
                    setTimeout(() => {
                        messageModal.classList.add('hidden');
                    }, 1500);
                }
            },
            { text: 'Close', class: 'bg-gray-300 text-gray-800 hover:bg-gray-400 focus:ring-gray-400' }
        ]
    );
    // Update the input field in the modal if it were directly visible (not using custom modal for input)
    // For this implementation, the link is copied directly.
});


// --- Initialization and URL Parameter Handling ---

/**
 * Parses URL parameters and attempts to load a shared drawing.
 */
function loadDrawingFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    const width = params.get('width');
    const height = params.get('height');

    if (data && width && height) {
        try {
            // Decode and split the colors
            const decodedColors = decodeURIComponent(data);
            const colorsArray = decodedColors.split(',');

            // Update grid dimensions from URL
            currentGridWidth = parseInt(width);
            currentGridHeight = parseInt(height);

            // Set input values to reflect loaded dimensions
            gridWidthInput.value = currentGridWidth;
            widthValueSpan.textContent = currentGridWidth;
            gridHeightInput.value = currentGridHeight;
            heightValueSpan.textContent = currentGridHeight;

            // Create grid with loaded colors
            createGrid(colorsArray);
            console.log('Drawing loaded from URL!');
        } catch (error) {
            console.error('Error loading drawing from URL:', error);
            // If parsing fails, create a default grid
            createGrid();
        }
    } else {
        // If no URL parameters, create a default grid
        createGrid();
    }
}

// Initialize the grid and load drawing from URL on page load
window.onload = () => {
    loadDrawingFromUrl();
    // Ensure the pen tool is active by default on load
    toolPenBtn.click();
};