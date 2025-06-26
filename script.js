const grid = document.getElementById("grid");
const colorPicker = document.getElementById("colorPicker");
const clearBtn = document.getElementById("clear");
const saveBtn = document.getElementById("save");
const toolSelect = document.getElementById("tool");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const paletteDiv = document.getElementById("palette");
const exportBtn = document.getElementById("export");
const importBtn = document.getElementById("import");
const fileInput = document.getElementById("fileInput");

const rows = 16;
const cols = 16;
const pixelSize = 20;
let currentTool = "brush";

toolSelect.addEventListener("change", e => {
  currentTool = e.target.value;
});

const palette = ["#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff"];
palette.forEach(color => {
  const swatch = document.createElement("div");
  swatch.className = "palette-color";
  swatch.style.backgroundColor = color;
  swatch.addEventListener("click", () => {
    colorPicker.value = color;
  });
  paletteDiv.appendChild(swatch);
});

function createGrid() {
  for (let i = 0; i < rows * cols; i++) {
    const pixel = document.createElement("div");
    pixel.className = "pixel";
    pixel.addEventListener("click", () => handlePixelClick(pixel));
    grid.appendChild(pixel);
  }
}

function handlePixelClick(pixel) {
  const tool = currentTool;
  if (tool === "brush") {
    pixel.style.backgroundColor = colorPicker.value;
  } else if (tool === "eraser") {
    pixel.style.backgroundColor = "#ffffff";
  } else if (tool === "eyedropper") {
    colorPicker.value = rgbToHex(pixel.style.backgroundColor);
    toolSelect.value = "brush";
    currentTool = "brush";
  } else if (tool === "fill") {
    fill(pixel, pixel.style.backgroundColor, colorPicker.value);
  }
}

function fill(startPixel, targetColor, replacementColor) {
  if (targetColor === replacementColor) return;
  const pixels = Array.from(document.querySelectorAll(".pixel"));
  const index = Array.prototype.indexOf.call(grid.children, startPixel);
  const visited = new Set();
  const queue = [index];

  while (queue.length > 0) {
    const i = queue.shift();
    if (visited.has(i)) continue;
    visited.add(i);

    const pixel = pixels[i];
    if (pixel.style.backgroundColor !== targetColor) continue;
    pixel.style.backgroundColor = replacementColor;

    const neighbors = [
      i - 1, i + 1,
      i - cols, i + cols
    ];
    neighbors.forEach(n => {
      if (n >= 0 && n < pixels.length) queue.push(n);
    });
  }
}

function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  return `#${result.map(x => (+x).toString(16).padStart(2, "0")).join("")}`;
}

clearBtn.addEventListener("click", () => {
  document.querySelectorAll(".pixel").forEach(pixel => {
    pixel.style.backgroundColor = "white";
  });
});

saveBtn.addEventListener("click", () => {
  const pixels = document.querySelectorAll(".pixel");
  pixels.forEach((pixel, index) => {
    const x = (index % cols) * pixelSize;
    const y = Math.floor(index / cols) * pixelSize;
    ctx.fillStyle = pixel.style.backgroundColor || "#ffffff";
    ctx.fillRect(x, y, pixelSize, pixelSize);
  });
  const link = document.createElement("a");
  link.download = "pixel-art.png";
  link.href = canvas.toDataURL();
  link.click();
});

exportBtn.addEventListener("click", () => {
  const data = Array.from(document.querySelectorAll(".pixel")).map(p => p.style.backgroundColor);
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "pixel-art.json";
  link.click();
});

importBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const data = JSON.parse(e.target.result);
    const pixels = document.querySelectorAll(".pixel");
    data.forEach((color, i) => {
      if (pixels[i]) pixels[i].style.backgroundColor = color;
    });
  };
  reader.readAsText(file);
});

createGrid();
