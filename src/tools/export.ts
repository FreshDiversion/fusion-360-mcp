import { ToolRegistry } from "./index.js";
import { FusionBridge } from "../bridge.js";

export function registerExportTools(registry: ToolRegistry, bridge: FusionBridge): void {
  registry.register({
    name: "export_stl",
    description:
      "Export a body or component as an STL file. STL is commonly used for 3D printing. Supports binary and ASCII formats with configurable mesh refinement.",
    inputSchema: {
      type: "object",
      properties: {
        outputPath: { type: "string", description: "Full file path for the output STL file" },
        entityToken: { type: "string", description: "Entity token of the body or component to export. Exports active component if omitted." },
        refinement: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Mesh refinement level",
          default: "medium",
        },
        binary: { type: "boolean", description: "Export as binary STL (smaller file size)", default: true },
      },
      required: ["outputPath"],
    },
    handler: async (params) => {
      return bridge.send("export_stl", params);
    },
  });

  registry.register({
    name: "export_step",
    description:
      "Export the design as a STEP file (.stp/.step). STEP is an industry-standard format for CAD data exchange.",
    inputSchema: {
      type: "object",
      properties: {
        outputPath: { type: "string", description: "Full file path for the output STEP file" },
        entityToken: { type: "string", description: "Entity token of specific component to export. Exports entire design if omitted." },
      },
      required: ["outputPath"],
    },
    handler: async (params) => {
      return bridge.send("export_step", params);
    },
  });

  registry.register({
    name: "export_f3d",
    description:
      "Export the design as a Fusion 360 archive file (.f3d). This preserves all parametric history, sketches, and features.",
    inputSchema: {
      type: "object",
      properties: {
        outputPath: { type: "string", description: "Full file path for the output F3D file" },
      },
      required: ["outputPath"],
    },
    handler: async (params) => {
      return bridge.send("export_f3d", params);
    },
  });

  registry.register({
    name: "export_iges",
    description:
      "Export the design as an IGES file. IGES is a legacy format still used in some manufacturing workflows.",
    inputSchema: {
      type: "object",
      properties: {
        outputPath: { type: "string", description: "Full file path for the output IGES file" },
        entityToken: { type: "string", description: "Entity token of specific component to export" },
      },
      required: ["outputPath"],
    },
    handler: async (params) => {
      return bridge.send("export_iges", params);
    },
  });

  registry.register({
    name: "export_dxf",
    description:
      "Export a sketch as a DXF file. DXF is commonly used for 2D manufacturing (laser cutting, CNC routing).",
    inputSchema: {
      type: "object",
      properties: {
        outputPath: { type: "string", description: "Full file path for the output DXF file" },
        sketchName: { type: "string", description: "Name of the sketch to export" },
      },
      required: ["outputPath", "sketchName"],
    },
    handler: async (params) => {
      return bridge.send("export_dxf", params);
    },
  });

  registry.register({
    name: "import_file",
    description:
      "Import a file into the active design. Supports STEP, IGES, STL, OBJ, SAT, SMT, F3D, and other formats Fusion 360 can open.",
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Full file path of the file to import" },
        componentToken: { type: "string", description: "Entity token of the component to import into. Uses root if omitted." },
      },
      required: ["filePath"],
    },
    handler: async (params) => {
      return bridge.send("import_file", params);
    },
  });
}
