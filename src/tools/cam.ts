import { ToolRegistry } from "./index.js";
import { FusionBridge } from "../bridge.js";

export function registerCamTools(registry: ToolRegistry, bridge: FusionBridge): void {
  registry.register({
    name: "create_cam_setup",
    description:
      "Create a new CAM setup for manufacturing. A setup defines the stock material, work coordinate system, and contains machining operations. Types: milling, turning, cutting (laser/waterjet/plasma).",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name for the setup" },
        type: {
          type: "string",
          enum: ["milling", "turning", "cutting"],
          description: "Manufacturing type",
        },
        bodyTokens: {
          type: "array",
          items: { type: "string" },
          description: "Entity tokens of bodies to machine",
        },
        stockMode: {
          type: "string",
          enum: ["relativeSizeBox", "fixedSizeBox", "relativeSizeCylinder", "fromBody"],
          description: "How to define stock material",
          default: "relativeSizeBox",
        },
        stockOffsetX: { type: "number", description: "Stock offset in X (cm)", default: 0.1 },
        stockOffsetY: { type: "number", description: "Stock offset in Y (cm)", default: 0.1 },
        stockOffsetZ: { type: "number", description: "Stock offset in Z (cm)", default: 0.1 },
      },
      required: ["name", "type"],
    },
    handler: async (params) => {
      return bridge.send("create_cam_setup", params);
    },
  });

  registry.register({
    name: "add_cam_operation",
    description:
      "Add a machining operation to a CAM setup. Operations define toolpaths for material removal. Common types: face, 2d_contour, 2d_pocket, 2d_adaptive, 3d_adaptive, 3d_pocket, drilling, bore, thread.",
    inputSchema: {
      type: "object",
      properties: {
        setupName: { type: "string", description: "Name of the CAM setup" },
        operationType: {
          type: "string",
          description: "Type of machining operation (e.g., '2d_contour', '2d_pocket', '2d_adaptive', '3d_adaptive', 'face', 'drilling')",
        },
        name: { type: "string", description: "Name for the operation" },
        toolNumber: { type: "integer", description: "Tool number from the tool library" },
        toolDiameter: { type: "number", description: "Tool diameter in cm (used if no tool number)" },
        toolType: {
          type: "string",
          enum: ["flat_endmill", "ball_endmill", "bull_nose", "drill", "face_mill", "chamfer_mill"],
          description: "Tool type (used with toolDiameter to auto-select or create tool)",
        },
        geometryTokens: {
          type: "array",
          items: { type: "string" },
          description: "Entity tokens of faces/edges/pockets to machine",
        },
        depth: { type: "number", description: "Total depth of cut (cm)" },
        stepdown: { type: "number", description: "Step-down per pass (cm)" },
        stepover: { type: "number", description: "Step-over percentage (0-100)", default: 40 },
        feedrate: { type: "number", description: "Feed rate (mm/min)" },
        spindleSpeed: { type: "number", description: "Spindle speed (RPM)" },
        coolant: {
          type: "string",
          enum: ["disabled", "flood", "mist", "throughTool", "air"],
          default: "flood",
        },
      },
      required: ["setupName", "operationType"],
    },
    handler: async (params) => {
      return bridge.send("add_cam_operation", params);
    },
  });

  registry.register({
    name: "generate_toolpath",
    description:
      "Generate toolpath(s) for CAM operations. This computes the actual tool movement. Can generate for a specific operation or all operations in a setup.",
    inputSchema: {
      type: "object",
      properties: {
        setupName: { type: "string", description: "Name of the CAM setup" },
        operationName: { type: "string", description: "Name of a specific operation (generates all if omitted)" },
      },
      required: ["setupName"],
    },
    handler: async (params) => {
      return bridge.send("generate_toolpath", params);
    },
  });

  registry.register({
    name: "post_process",
    description:
      "Generate G-code from computed toolpaths using a post processor. Outputs machine-ready NC code.",
    inputSchema: {
      type: "object",
      properties: {
        setupName: { type: "string", description: "Name of the CAM setup" },
        operationName: { type: "string", description: "Name of specific operation (all in setup if omitted)" },
        postProcessor: { type: "string", description: "Post processor name or path (e.g., 'fanuc', 'grbl', 'linuxcnc')" },
        outputPath: { type: "string", description: "Full file path for the output NC file" },
        programName: { type: "string", description: "Program name/number for the NC file header" },
        programComment: { type: "string", description: "Comment for the NC file header" },
      },
      required: ["setupName", "postProcessor", "outputPath"],
    },
    handler: async (params) => {
      return bridge.send("post_process", params);
    },
  });

  registry.register({
    name: "get_cam_info",
    description:
      "Get information about CAM setups and operations in the active design. Lists setups, their operations, tools used, and toolpath status.",
    inputSchema: {
      type: "object",
      properties: {
        setupName: { type: "string", description: "Name of specific setup (returns all setups if omitted)" },
      },
      required: [],
    },
    handler: async (params) => {
      return bridge.send("get_cam_info", params);
    },
  });

  registry.register({
    name: "simulate_toolpath",
    description:
      "Run a toolpath simulation to verify machining operations visually and detect issues like gouges or collisions.",
    inputSchema: {
      type: "object",
      properties: {
        setupName: { type: "string", description: "Name of the CAM setup" },
        operationName: { type: "string", description: "Name of a specific operation (simulates all if omitted)" },
      },
      required: ["setupName"],
    },
    handler: async (params) => {
      return bridge.send("simulate_toolpath", params);
    },
  });
}
