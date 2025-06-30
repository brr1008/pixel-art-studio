// js/ToolManager.js
import BrushTool from './tools/BrushTool.js';
import EraserTool from './tools/EraserTool.js';
import FillTool from './tools/FillTool.js';
import EyedropperTool from './tools/EyedropperTool.js';
import LineTool from './tools/LineTool.js';
import BaseTool from './tools/BaseTool.js';
import CircleTool from './tools/CircleTool.js';
import RectangleTool from './tools/RectangleTool.js';
import SelectionTool from './tools/SelectionTool.js';

// ... import other tools as they are created

class ToolManager {
    constructor(stateManager, canvasRenderer, layerManager, historyManager) {
        this.state = stateManager;
        this.canvasRenderer = canvasRenderer;
        this.layerManager = layerManager;
        this.historyManager = historyManager;

        // Instantiate all tools
        this.tools = {
            brush: new BrushTool(stateManager, canvasRenderer, layerManager, historyManager),
            eraser: new EraserTool(stateManager, canvasRenderer, layerManager, historyManager),
            fill: new FillTool(stateManager, canvasRenderer, layerManager, historyManager),
            eyedropper: new EyedropperTool(stateManager, canvasRenderer, layerManager, historyManager),
            line: new LineTool(stateManager, canvasRenderer, layerManager, historyManager),
            circle: new CircleTool(stateManager, canvasRenderer, layerManager, historyManager),
            rectangle: new RectangleTool(stateManager, canvasRenderer, layerManager, historyManager),
            selection: new SelectionTool(stateManager, canvasRenderer, layerManager, historyManager),
            base: new BaseTool(stateManager, canvasRenderer, layerManager, historyManager),
            // ... add other tools here
        };

        this.activeToolInstance = this.tools[this.state.currentTool];
        // Set the initial active tool based on the state
        if (!this.activeToolInstance) {
            console.warn(`Active tool "${this.state.currentTool}" not found. Defaulting to brush tool.`);
            this.activeToolInstance = this.tools.brush; // Default to brush if not set
        }

        // Listen for tool changes from StateManager or UI
        // (You might have a UI event listener that calls state.setCurrentTool)
        // this.state.onToolChange((newToolName) => {
        //     this.activeToolInstance = this.tools[newToolName];
        //     console.log(`Active tool changed to: ${newToolName}`);
        // });
    }

    /**
     * Delegates mouse down event to the active tool.
     */
    handleMouseDown(event) {
        if (this.activeToolInstance && this.activeToolInstance.onMouseDown) {
            this.activeToolInstance.onMouseDown(event);
        }
        // Optionally, you can also update the state here if needed
        this.state.setCurrentTool(this.activeToolInstance.name);
    }

    /**
     * Delegates mouse move event to the active tool.
     */
    handleMouseMove(event) {
        if (this.activeToolInstance && this.activeToolInstance.onMouseMove) {
            this.activeToolInstance.onMouseMove(event);
        }
        // Optionally, you can also update the state here if needed
        this.state.setCurrentTool(this.activeToolInstance.name);
    }

    /**
     * Delegates mouse up event to the active tool.
     */
    handleMouseUp(event) {
        if (this.activeToolInstance && this.activeToolInstance.onMouseUp) {
            this.activeToolInstance.onMouseUp(event);
        }
        // Optionally, you can also update the state here if needed
        this.state.setCurrentTool(this.activeToolInstance.name);
    }

    /**
     * Delegates mouse leave event to the active tool (useful for ending drag operations).
     */
    handleMouseLeave(event) {
        if (this.activeToolInstance && this.activeToolInstance.onMouseLeave) {
            this.activeToolInstance.onMouseLeave(event);
        }
        // Optionally, you can also update the state here if needed
        this.state.setCurrentTool(this.activeToolInstance.name);
    }

    /**
     * Delegates keyboard events to the active tool (e.g., for tool-specific shortcuts).
     */
    handleKeyDown(event) {
        if (this.activeToolInstance && this.activeToolInstance.onKeyDown) {
            this.activeToolInstance.onKeyDown(event);
        }
        // Optionally, you can also update the state here if needed
        this.state.setCurrentTool(this.activeToolInstance.name);
    }

    // Call this from UI.js when a tool button is clicked
    setActiveTool(toolName) {
        if (this.tools[toolName]) {
            this.state.setCurrentTool(toolName);
            this.activeToolInstance = this.tools[toolName];
            // Potentially update UI to show tool-specific options
        } else {
            console.warn(`Tool "${toolName}" not found.`);
        }
    }
    /**
     * Returns the tool instance by name.
     * @param {string} toolName - The name of the tool.
     * @returns {BaseTool|null} - The tool instance or null if not found.
     */
    getToolByName(toolName) {
        return this.tools[toolName] || null;
    }
    /**
     * Returns the currently active tool instance.
     */
    getActiveTool() {
        return this.activeToolInstance;
    }      

}

export default ToolManager;