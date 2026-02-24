import { ToolRegistry } from "./index.js";
import { FusionBridge } from "../bridge.js";

export function registerUtilityTools(registry: ToolRegistry, bridge: FusionBridge): void {
  registry.register({
    name: "capture_viewport",
    description:
      "Capture the current Fusion 360 viewport as a PNG image. Useful for getting a visual snapshot of the current design state.",
    inputSchema: {
      type: "object",
      properties: {
        outputPath: { type: "string", description: "Full file path for the output PNG image" },
        width: { type: "integer", description: "Image width in pixels", default: 1920 },
        height: { type: "integer", description: "Image height in pixels", default: 1080 },
      },
      required: ["outputPath"],
    },
    handler: async (params) => {
      return bridge.send("capture_viewport", params);
    },
  });

  registry.register({
    name: "set_viewport",
    description:
      "Set the camera position and orientation in the Fusion 360 viewport. Use this to frame the design for capture or presentation.",
    inputSchema: {
      type: "object",
      properties: {
        eyeX: { type: "number", description: "Camera eye position X (cm)" },
        eyeY: { type: "number", description: "Camera eye position Y (cm)" },
        eyeZ: { type: "number", description: "Camera eye position Z (cm)" },
        targetX: { type: "number", description: "Camera target X (cm)", default: 0 },
        targetY: { type: "number", description: "Camera target Y (cm)", default: 0 },
        targetZ: { type: "number", description: "Camera target Z (cm)", default: 0 },
        upX: { type: "number", description: "Camera up vector X", default: 0 },
        upY: { type: "number", description: "Camera up vector Y", default: 1 },
        upZ: { type: "number", description: "Camera up vector Z", default: 0 },
        fitToView: { type: "boolean", description: "Fit the entire design in the viewport", default: false },
        viewOrientation: {
          type: "string",
          enum: ["front", "back", "left", "right", "top", "bottom", "iso_top_right", "iso_top_left", "iso_bottom_right", "iso_bottom_left"],
          description: "Preset view orientation (overrides eye/target/up if provided)",
        },
      },
      required: [],
    },
    handler: async (params) => {
      return bridge.send("set_viewport", params);
    },
  });

  registry.register({
    name: "undo",
    description:
      "Undo the last operation in Fusion 360. Equivalent to Ctrl+Z / Cmd+Z.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async () => {
      return bridge.send("undo");
    },
  });

  registry.register({
    name: "redo",
    description:
      "Redo the last undone operation in Fusion 360. Equivalent to Ctrl+Y / Cmd+Shift+Z.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async () => {
      return bridge.send("redo");
    },
  });

  registry.register({
    name: "execute_script",
    description:
      "Execute arbitrary Python code in Fusion 360. This is an escape hatch for operations not covered by other tools. The script runs in the Fusion 360 Python environment with access to the full API. Returns whatever the script assigns to the 'result' variable.",
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Python code to execute. Has access to 'app' (adsk.core.Application) and 'ui' (adsk.core.UserInterface). Assign return value to 'result' variable.",
        },
        timeout: {
          type: "integer",
          description: "Execution timeout in seconds",
          default: 30,
        },
      },
      required: ["code"],
    },
    handler: async (params) => {
      return bridge.send("execute_script", params);
    },
  });
}
