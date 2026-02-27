import { ToolRegistry } from "./index.js";
import { FusionBridge } from "../bridge.js";

export function registerSketchTools(registry: ToolRegistry, bridge: FusionBridge): void {
  registry.register({
    name: "create_sketch",
    description:
      "Create a new sketch on a plane or planar face. Specify a standard plane (XY, XZ, YZ) or provide an entityToken for a planar face or construction plane. Returns the sketch name and entity token.",
    inputSchema: {
      type: "object",
      properties: {
        plane: {
          type: "string",
          description: "Standard plane: 'XY', 'XZ', or 'YZ'",
          enum: ["XY", "XZ", "YZ"],
        },
        planarEntityToken: {
          type: "string",
          description: "Entity token of a planar face or construction plane to sketch on (alternative to plane)",
        },
        componentToken: {
          type: "string",
          description: "Entity token of the component to create the sketch in. Uses root component if omitted.",
        },
      },
      required: [],
    },
    handler: async (params) => {
      return bridge.send("create_sketch", params);
    },
  });

  registry.register({
    name: "draw_line",
    description:
      "Draw a line in a sketch between two points. Coordinates are in centimeters (Fusion 360 internal units). Returns the line entity token.",
    inputSchema: {
      type: "object",
      properties: {
        sketchName: { type: "string", description: "Name of the sketch to draw in" },
        startX: { type: "number", description: "Start point X coordinate (cm)" },
        startY: { type: "number", description: "Start point Y coordinate (cm)" },
        endX: { type: "number", description: "End point X coordinate (cm)" },
        endY: { type: "number", description: "End point Y coordinate (cm)" },
      },
      required: ["sketchName", "startX", "startY", "endX", "endY"],
    },
    handler: async (params) => {
      return bridge.send("draw_line", params);
    },
  });

  registry.register({
    name: "draw_rectangle",
    description:
      "Draw a rectangle in a sketch. Supports two-point (opposite corners) or center-point mode. Coordinates in centimeters.",
    inputSchema: {
      type: "object",
      properties: {
        sketchName: { type: "string", description: "Name of the sketch to draw in" },
        mode: {
          type: "string",
          enum: ["twoPoint", "centerPoint"],
          description: "Rectangle mode: 'twoPoint' uses opposite corners, 'centerPoint' uses center + width/height",
          default: "twoPoint",
        },
        x1: { type: "number", description: "First corner X or center X (cm)" },
        y1: { type: "number", description: "First corner Y or center Y (cm)" },
        x2: { type: "number", description: "Second corner X (twoPoint mode only, cm)" },
        y2: { type: "number", description: "Second corner Y (twoPoint mode only, cm)" },
        width: { type: "number", description: "Width (centerPoint mode only, cm)" },
        height: { type: "number", description: "Height (centerPoint mode only, cm)" },
      },
      required: ["sketchName"],
    },
    handler: async (params) => {
      return bridge.send("draw_rectangle", params);
    },
  });

  registry.register({
    name: "draw_circle",
    description:
      "Draw a circle in a sketch. Supports center+radius or 3-point mode. Coordinates in centimeters.",
    inputSchema: {
      type: "object",
      properties: {
        sketchName: { type: "string", description: "Name of the sketch to draw in" },
        mode: {
          type: "string",
          enum: ["centerRadius", "threePoint"],
          description: "Circle mode",
          default: "centerRadius",
        },
        centerX: { type: "number", description: "Center X coordinate (cm)" },
        centerY: { type: "number", description: "Center Y coordinate (cm)" },
        radius: { type: "number", description: "Radius (centerRadius mode, cm)" },
        point1X: { type: "number", description: "First point X (threePoint mode, cm)" },
        point1Y: { type: "number", description: "First point Y (threePoint mode, cm)" },
        point2X: { type: "number", description: "Second point X (threePoint mode, cm)" },
        point2Y: { type: "number", description: "Second point Y (threePoint mode, cm)" },
        point3X: { type: "number", description: "Third point X (threePoint mode, cm)" },
        point3Y: { type: "number", description: "Third point Y (threePoint mode, cm)" },
      },
      required: ["sketchName"],
    },
    handler: async (params) => {
      return bridge.send("draw_circle", params);
    },
  });

  registry.register({
    name: "draw_arc",
    description:
      "Draw an arc in a sketch. Supports 3-point or center-start-sweep modes. Coordinates in centimeters, angles in degrees.",
    inputSchema: {
      type: "object",
      properties: {
        sketchName: { type: "string", description: "Name of the sketch to draw in" },
        mode: {
          type: "string",
          enum: ["threePoint", "centerStartSweep"],
          description: "Arc mode",
          default: "threePoint",
        },
        startX: { type: "number", description: "Start point X (cm)" },
        startY: { type: "number", description: "Start point Y (cm)" },
        endX: { type: "number", description: "End point X (cm, threePoint mode)" },
        endY: { type: "number", description: "End point Y (cm, threePoint mode)" },
        midX: { type: "number", description: "Mid point X (cm, threePoint mode)" },
        midY: { type: "number", description: "Mid point Y (cm, threePoint mode)" },
        centerX: { type: "number", description: "Center X (cm, centerStartSweep mode)" },
        centerY: { type: "number", description: "Center Y (cm, centerStartSweep mode)" },
        sweepAngle: { type: "number", description: "Sweep angle in degrees (centerStartSweep mode)" },
      },
      required: ["sketchName"],
    },
    handler: async (params) => {
      return bridge.send("draw_arc", params);
    },
  });

  registry.register({
    name: "draw_polygon",
    description:
      "Draw a regular polygon (3-12 sides) inscribed in or circumscribed around a circle. Coordinates in centimeters.",
    inputSchema: {
      type: "object",
      properties: {
        sketchName: { type: "string", description: "Name of the sketch" },
        centerX: { type: "number", description: "Center X (cm)" },
        centerY: { type: "number", description: "Center Y (cm)" },
        radius: { type: "number", description: "Radius (cm)" },
        sides: { type: "integer", description: "Number of sides (3-12)", minimum: 3, maximum: 12 },
        inscribed: {
          type: "boolean",
          description: "If true, polygon is inscribed in circle; if false, circumscribed",
          default: true,
        },
      },
      required: ["sketchName", "centerX", "centerY", "radius", "sides"],
    },
    handler: async (params) => {
      return bridge.send("draw_polygon", params);
    },
  });

  registry.register({
    name: "draw_spline",
    description:
      "Draw a fitted spline through a series of points in a sketch. Coordinates in centimeters.",
    inputSchema: {
      type: "object",
      properties: {
        sketchName: { type: "string", description: "Name of the sketch" },
        points: {
          type: "array",
          items: {
            type: "object",
            properties: {
              x: { type: "number", description: "X coordinate (cm)" },
              y: { type: "number", description: "Y coordinate (cm)" },
            },
            required: ["x", "y"],
          },
          description: "Array of points the spline passes through",
          minItems: 2,
        },
        closed: { type: "boolean", description: "Whether the spline is closed", default: false },
      },
      required: ["sketchName", "points"],
    },
    handler: async (params) => {
      return bridge.send("draw_spline", params);
    },
  });

  registry.register({
    name: "add_sketch_constraint",
    description:
      "Add a geometric constraint to sketch entities. Supported types: coincident, collinear, concentric, equal, fix, horizontal, vertical, midpoint, parallel, perpendicular, smooth, symmetry, tangent.",
    inputSchema: {
      type: "object",
      properties: {
        sketchName: { type: "string", description: "Name of the sketch" },
        constraintType: {
          type: "string",
          enum: [
            "coincident", "collinear", "concentric", "equal", "fix",
            "horizontal", "vertical", "midpoint", "parallel",
            "perpendicular", "smooth", "symmetry", "tangent",
          ],
          description: "Type of geometric constraint",
        },
        entityToken1: { type: "string", description: "Entity token of the first sketch entity" },
        entityToken2: { type: "string", description: "Entity token of the second sketch entity (if required)" },
        pointToken: { type: "string", description: "Entity token of a point (for coincident/midpoint)" },
      },
      required: ["sketchName", "constraintType", "entityToken1"],
    },
    handler: async (params) => {
      return bridge.send("add_sketch_constraint", params);
    },
  });

  registry.register({
    name: "add_sketch_dimension",
    description:
      "Add a dimensional constraint (driving dimension) to sketch entities. The value is in centimeters for linear dimensions or degrees for angular dimensions.",
    inputSchema: {
      type: "object",
      properties: {
        sketchName: { type: "string", description: "Name of the sketch" },
        dimensionType: {
          type: "string",
          enum: ["linear", "angular", "radial", "diameter", "offset"],
          description: "Type of dimension",
        },
        entityToken1: { type: "string", description: "Entity token of the first entity" },
        entityToken2: { type: "string", description: "Entity token of the second entity (for between-entities dimensions)" },
        value: { type: "number", description: "Dimension value (cm for linear, degrees for angular)" },
        expression: { type: "string", description: "Expression string (e.g., 'width * 2'). Overrides value if provided." },
      },
      required: ["sketchName", "dimensionType", "entityToken1", "value"],
    },
    handler: async (params) => {
      return bridge.send("add_sketch_dimension", params);
    },
  });

  registry.register({
    name: "edit_sketch_dimension",
    description:
      "Modify an existing sketch dimension by its parameter name (e.g., 'd1', 'd2') or entity token. Use this to change dimension values after they've been created.",
    inputSchema: {
      type: "object",
      properties: {
        parameterName: { type: "string", description: "Parameter name of the dimension (e.g., 'd1', 'd2'). Find these via add_sketch_dimension or get_sketch_info." },
        entityToken: { type: "string", description: "Entity token of the sketch dimension (alternative to parameterName)" },
        value: { type: "number", description: "New dimension value (cm for linear, degrees for angular)" },
        expression: { type: "string", description: "Expression string (e.g., 'width * 2'). Overrides value if provided." },
      },
      required: [],
    },
    handler: async (params) => {
      return bridge.send("edit_sketch_dimension", params);
    },
  });

  registry.register({
    name: "get_sketch_info",
    description:
      "Get detailed information about a sketch including its profiles, curves, constraints, and whether it is fully constrained.",
    inputSchema: {
      type: "object",
      properties: {
        sketchName: { type: "string", description: "Name of the sketch" },
      },
      required: ["sketchName"],
    },
    handler: async (params) => {
      return bridge.send("get_sketch_info", params);
    },
  });
}
