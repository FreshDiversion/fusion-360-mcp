import { ToolRegistry } from "./index.js";
import { FusionBridge } from "../bridge.js";

export function registerAnalysisTools(registry: ToolRegistry, bridge: FusionBridge): void {
  registry.register({
    name: "measure_distance",
    description:
      "Measure the minimum distance between two entities (points, edges, faces, bodies). Returns the distance in centimeters.",
    inputSchema: {
      type: "object",
      properties: {
        entityToken1: { type: "string", description: "Entity token of the first entity" },
        entityToken2: { type: "string", description: "Entity token of the second entity" },
      },
      required: ["entityToken1", "entityToken2"],
    },
    handler: async (params) => {
      return bridge.send("measure_distance", params);
    },
  });

  registry.register({
    name: "measure_angle",
    description:
      "Measure the angle between two entities (faces, edges, lines). Returns the angle in degrees.",
    inputSchema: {
      type: "object",
      properties: {
        entityToken1: { type: "string", description: "Entity token of the first entity" },
        entityToken2: { type: "string", description: "Entity token of the second entity" },
      },
      required: ["entityToken1", "entityToken2"],
    },
    handler: async (params) => {
      return bridge.send("measure_angle", params);
    },
  });

  registry.register({
    name: "get_body_properties",
    description:
      "Get physical properties of a body: volume, surface area, mass, center of mass, bounding box, and material name. Mass requires an assigned material with density.",
    inputSchema: {
      type: "object",
      properties: {
        bodyToken: { type: "string", description: "Entity token of the body" },
      },
      required: ["bodyToken"],
    },
    handler: async (params) => {
      return bridge.send("get_body_properties", params);
    },
  });

  registry.register({
    name: "get_body_faces",
    description:
      "List all faces on a body with their entity tokens and geometry details. Use this to discover faces for joints, measurements, or operations after finding a body via get_design_structure.",
    inputSchema: {
      type: "object",
      properties: {
        bodyToken: { type: "string", description: "Entity token of the body to enumerate faces for" },
      },
      required: ["bodyToken"],
    },
    handler: async (params) => {
      return bridge.send("get_body_faces", params);
    },
  });

  registry.register({
    name: "get_face_info",
    description:
      "Get information about a face: geometry type (plane, cylinder, cone, sphere, torus, NURBS), area, centroid, and normal vector (for planar faces).",
    inputSchema: {
      type: "object",
      properties: {
        faceToken: { type: "string", description: "Entity token of the face" },
      },
      required: ["faceToken"],
    },
    handler: async (params) => {
      return bridge.send("get_face_info", params);
    },
  });

  registry.register({
    name: "get_edge_info",
    description:
      "Get information about an edge: geometry type (line, arc, circle, ellipse, spline), length, start/end points, and tangent vectors.",
    inputSchema: {
      type: "object",
      properties: {
        edgeToken: { type: "string", description: "Entity token of the edge" },
      },
      required: ["edgeToken"],
    },
    handler: async (params) => {
      return bridge.send("get_edge_info", params);
    },
  });

  registry.register({
    name: "measure_area",
    description:
      "Measure the surface area of a face or the total surface area of a body. Returns the area in square centimeters.",
    inputSchema: {
      type: "object",
      properties: {
        entityToken: { type: "string", description: "Entity token of the face or body" },
      },
      required: ["entityToken"],
    },
    handler: async (params) => {
      return bridge.send("measure_area", params);
    },
  });

  registry.register({
    name: "get_bom",
    description:
      "Extract a bill of materials (BOM) from the design's assembly structure. Returns component names, quantities, materials, volumes, and descriptions.",
    inputSchema: {
      type: "object",
      properties: {
        includeSubComponents: {
          type: "boolean",
          description: "Include nested sub-components in the BOM",
          default: true,
        },
      },
      required: [],
    },
    handler: async (params) => {
      return bridge.send("get_bom", params);
    },
  });

  registry.register({
    name: "section_analysis",
    description:
      "Create a section analysis (section view) at a specified plane. This shows the internal cross-section of the design.",
    inputSchema: {
      type: "object",
      properties: {
        plane: { type: "string", enum: ["XY", "XZ", "YZ"], description: "Standard plane for the section" },
        planeToken: { type: "string", description: "Entity token of a plane/face (alternative to standard plane)" },
        offset: { type: "number", description: "Offset distance from the plane (cm)", default: 0 },
      },
      required: [],
    },
    handler: async (params) => {
      return bridge.send("section_analysis", params);
    },
  });
}
