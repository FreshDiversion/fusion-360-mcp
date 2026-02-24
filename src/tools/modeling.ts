import { ToolRegistry } from "./index.js";
import { FusionBridge } from "../bridge.js";

export function registerModelingTools(registry: ToolRegistry, bridge: FusionBridge): void {
  registry.register({
    name: "create_extrude",
    description:
      "Extrude a sketch profile to create a 3D solid or cut. Specify the profile by sketch name and profile index (0-based). Supports distance, symmetric, toObject, and all extent types. Positive distance adds material (join), negative distance or operation='cut' removes material.",
    inputSchema: {
      type: "object",
      properties: {
        sketchName: { type: "string", description: "Name of the sketch containing the profile" },
        profileIndex: { type: "integer", description: "Index of the profile to extrude (0-based)", default: 0 },
        distance: { type: "number", description: "Extrude distance in cm (positive = one direction)" },
        extentType: {
          type: "string",
          enum: ["distance", "symmetric", "toObject", "all"],
          description: "Extent type for the extrusion",
          default: "distance",
        },
        distance2: { type: "number", description: "Second direction distance for symmetric or two-sided (cm)" },
        toEntityToken: { type: "string", description: "Entity token for toObject extent type" },
        operation: {
          type: "string",
          enum: ["join", "cut", "intersect", "newBody", "newComponent"],
          description: "Boolean operation type",
          default: "join",
        },
        taperAngle: { type: "number", description: "Taper angle in degrees (0 = no taper)" },
      },
      required: ["sketchName", "distance"],
    },
    handler: async (params) => {
      return bridge.send("create_extrude", params);
    },
  });

  registry.register({
    name: "create_revolve",
    description:
      "Revolve a sketch profile around an axis to create a 3D solid. Specify the axis as a sketch line entity token or a standard axis (X, Y, Z).",
    inputSchema: {
      type: "object",
      properties: {
        sketchName: { type: "string", description: "Name of the sketch containing the profile" },
        profileIndex: { type: "integer", description: "Index of the profile to revolve (0-based)", default: 0 },
        axisEntityToken: { type: "string", description: "Entity token of the axis line (sketch line or construction axis)" },
        axis: { type: "string", enum: ["X", "Y", "Z"], description: "Standard axis (alternative to axisEntityToken)" },
        angle: { type: "number", description: "Revolve angle in degrees (360 for full revolution)", default: 360 },
        operation: {
          type: "string",
          enum: ["join", "cut", "intersect", "newBody", "newComponent"],
          default: "join",
        },
      },
      required: ["sketchName"],
    },
    handler: async (params) => {
      return bridge.send("create_revolve", params);
    },
  });

  registry.register({
    name: "create_sweep",
    description:
      "Sweep a profile along a path to create a 3D solid. The profile and path must be in different sketches or the path can be an edge.",
    inputSchema: {
      type: "object",
      properties: {
        profileSketchName: { type: "string", description: "Name of the sketch containing the profile" },
        profileIndex: { type: "integer", description: "Index of the profile (0-based)", default: 0 },
        pathEntityToken: { type: "string", description: "Entity token of the sweep path (sketch curve or edge)" },
        operation: {
          type: "string",
          enum: ["join", "cut", "intersect", "newBody", "newComponent"],
          default: "join",
        },
        orientation: {
          type: "string",
          enum: ["perpendicular", "parallel"],
          description: "Profile orientation along the path",
          default: "perpendicular",
        },
      },
      required: ["profileSketchName", "pathEntityToken"],
    },
    handler: async (params) => {
      return bridge.send("create_sweep", params);
    },
  });

  registry.register({
    name: "create_loft",
    description:
      "Create a loft between two or more profiles. Profiles can be sketch profiles, faces, or points. Lofts create smooth transitions between cross-sections.",
    inputSchema: {
      type: "object",
      properties: {
        profiles: {
          type: "array",
          items: {
            type: "object",
            properties: {
              sketchName: { type: "string" },
              profileIndex: { type: "integer", default: 0 },
            },
            required: ["sketchName"],
          },
          description: "Array of profile references (minimum 2)",
          minItems: 2,
        },
        railEntityToken: { type: "string", description: "Entity token of a guide rail (optional)" },
        operation: {
          type: "string",
          enum: ["join", "cut", "intersect", "newBody", "newComponent"],
          default: "join",
        },
        isSolid: { type: "boolean", description: "Create solid (true) or surface (false)", default: true },
      },
      required: ["profiles"],
    },
    handler: async (params) => {
      return bridge.send("create_loft", params);
    },
  });

  registry.register({
    name: "create_fillet",
    description:
      "Apply a fillet (rounded edge) to one or more edges. Specify edges by their entity tokens.",
    inputSchema: {
      type: "object",
      properties: {
        edgeTokens: {
          type: "array",
          items: { type: "string" },
          description: "Entity tokens of edges to fillet",
          minItems: 1,
        },
        radius: { type: "number", description: "Fillet radius in cm" },
        isConstant: { type: "boolean", description: "Constant radius (true) or variable radius (false)", default: true },
      },
      required: ["edgeTokens", "radius"],
    },
    handler: async (params) => {
      return bridge.send("create_fillet", params);
    },
  });

  registry.register({
    name: "create_chamfer",
    description:
      "Apply a chamfer to one or more edges. Supports equal distance or distance+angle modes.",
    inputSchema: {
      type: "object",
      properties: {
        edgeTokens: {
          type: "array",
          items: { type: "string" },
          description: "Entity tokens of edges to chamfer",
          minItems: 1,
        },
        distance: { type: "number", description: "Chamfer distance in cm" },
        distance2: { type: "number", description: "Second distance for asymmetric chamfer (cm)" },
        angle: { type: "number", description: "Chamfer angle in degrees (distance+angle mode)" },
      },
      required: ["edgeTokens", "distance"],
    },
    handler: async (params) => {
      return bridge.send("create_chamfer", params);
    },
  });

  registry.register({
    name: "create_shell",
    description:
      "Shell a solid body, hollowing it out with a specified wall thickness. Optionally remove faces to create openings.",
    inputSchema: {
      type: "object",
      properties: {
        bodyToken: { type: "string", description: "Entity token of the body to shell" },
        thickness: { type: "number", description: "Wall thickness in cm" },
        removeFaceTokens: {
          type: "array",
          items: { type: "string" },
          description: "Entity tokens of faces to remove (creating openings)",
        },
        direction: {
          type: "string",
          enum: ["inside", "outside", "both"],
          description: "Direction to add wall thickness",
          default: "inside",
        },
      },
      required: ["bodyToken", "thickness"],
    },
    handler: async (params) => {
      return bridge.send("create_shell", params);
    },
  });

  registry.register({
    name: "boolean_operation",
    description:
      "Perform a boolean operation (join, cut, intersect) between two bodies. The target body is modified; the tool body may be consumed.",
    inputSchema: {
      type: "object",
      properties: {
        targetBodyToken: { type: "string", description: "Entity token of the target body" },
        toolBodyToken: { type: "string", description: "Entity token of the tool body" },
        operation: {
          type: "string",
          enum: ["join", "cut", "intersect"],
          description: "Boolean operation type",
        },
        keepToolBody: { type: "boolean", description: "Keep the tool body after operation", default: false },
      },
      required: ["targetBodyToken", "toolBodyToken", "operation"],
    },
    handler: async (params) => {
      return bridge.send("boolean_operation", params);
    },
  });

  registry.register({
    name: "create_hole",
    description:
      "Create holes in a face. Supports simple, counterbore, and countersink hole types with optional thread.",
    inputSchema: {
      type: "object",
      properties: {
        faceToken: { type: "string", description: "Entity token of the face to place the hole on" },
        centerX: { type: "number", description: "Hole center X position on the face (cm)" },
        centerY: { type: "number", description: "Hole center Y position on the face (cm)" },
        diameter: { type: "number", description: "Hole diameter (cm)" },
        depth: { type: "number", description: "Hole depth (cm). Use -1 for through all." },
        holeType: {
          type: "string",
          enum: ["simple", "counterbore", "countersink"],
          default: "simple",
        },
        counterboreDiameter: { type: "number", description: "Counterbore diameter (cm)" },
        counterboreDepth: { type: "number", description: "Counterbore depth (cm)" },
        countersinkAngle: { type: "number", description: "Countersink angle (degrees)", default: 90 },
        countersinkDiameter: { type: "number", description: "Countersink diameter (cm)" },
        isThreaded: { type: "boolean", description: "Add thread to the hole", default: false },
        threadType: { type: "string", description: "Thread type (e.g., 'ISO Metric Profile')" },
        threadSize: { type: "string", description: "Thread size (e.g., 'M6x1.0')" },
      },
      required: ["faceToken", "diameter", "depth"],
    },
    handler: async (params) => {
      return bridge.send("create_hole", params);
    },
  });

  registry.register({
    name: "create_thread",
    description:
      "Add threads to a cylindrical face. Supports internal and external threads.",
    inputSchema: {
      type: "object",
      properties: {
        faceToken: { type: "string", description: "Entity token of the cylindrical face" },
        threadType: { type: "string", description: "Thread type (e.g., 'ISO Metric Profile')" },
        threadSize: { type: "string", description: "Thread size (e.g., 'M6x1.0')" },
        isInternal: { type: "boolean", description: "Internal thread (true) or external (false)", default: true },
        isModeled: { type: "boolean", description: "Create modeled (geometry) or cosmetic thread", default: false },
        fullLength: { type: "boolean", description: "Thread the full length of the cylinder", default: true },
        length: { type: "number", description: "Thread length in cm (if fullLength is false)" },
      },
      required: ["faceToken", "threadType", "threadSize"],
    },
    handler: async (params) => {
      return bridge.send("create_thread", params);
    },
  });

  registry.register({
    name: "create_pattern_rectangular",
    description:
      "Create a rectangular (linear) pattern of features, bodies, or components. Patterns repeat geometry in one or two directions.",
    inputSchema: {
      type: "object",
      properties: {
        entityTokens: {
          type: "array",
          items: { type: "string" },
          description: "Entity tokens of features/bodies/components to pattern",
        },
        patternType: {
          type: "string",
          enum: ["features", "bodies", "components"],
          default: "features",
        },
        directionOneEntityToken: { type: "string", description: "Entity token defining direction 1 (edge, axis, etc.)" },
        countOne: { type: "integer", description: "Number of instances in direction 1 (including original)" },
        spacingOne: { type: "number", description: "Spacing in direction 1 (cm)" },
        directionTwoEntityToken: { type: "string", description: "Entity token defining direction 2 (optional)" },
        countTwo: { type: "integer", description: "Number of instances in direction 2" },
        spacingTwo: { type: "number", description: "Spacing in direction 2 (cm)" },
      },
      required: ["entityTokens", "directionOneEntityToken", "countOne", "spacingOne"],
    },
    handler: async (params) => {
      return bridge.send("create_pattern_rectangular", params);
    },
  });

  registry.register({
    name: "create_pattern_circular",
    description:
      "Create a circular pattern of features, bodies, or components around an axis.",
    inputSchema: {
      type: "object",
      properties: {
        entityTokens: {
          type: "array",
          items: { type: "string" },
          description: "Entity tokens of features/bodies/components to pattern",
        },
        patternType: {
          type: "string",
          enum: ["features", "bodies", "components"],
          default: "features",
        },
        axisEntityToken: { type: "string", description: "Entity token of the rotation axis" },
        count: { type: "integer", description: "Total number of instances (including original)" },
        totalAngle: { type: "number", description: "Total angle span in degrees", default: 360 },
      },
      required: ["entityTokens", "axisEntityToken", "count"],
    },
    handler: async (params) => {
      return bridge.send("create_pattern_circular", params);
    },
  });

  registry.register({
    name: "create_mirror",
    description:
      "Mirror features, bodies, or faces across a plane to create symmetric geometry.",
    inputSchema: {
      type: "object",
      properties: {
        entityTokens: {
          type: "array",
          items: { type: "string" },
          description: "Entity tokens of features/bodies/faces to mirror",
        },
        mirrorPlaneToken: { type: "string", description: "Entity token of the mirror plane (face, construction plane, or standard plane)" },
        mirrorPlane: {
          type: "string",
          enum: ["XY", "XZ", "YZ"],
          description: "Standard plane to mirror across (alternative to mirrorPlaneToken)",
        },
      },
      required: ["entityTokens"],
    },
    handler: async (params) => {
      return bridge.send("create_mirror", params);
    },
  });

  registry.register({
    name: "create_construction_plane",
    description:
      "Create a construction plane. Supports offset from plane, angle from edge, midplane between faces, and tangent to face.",
    inputSchema: {
      type: "object",
      properties: {
        planeType: {
          type: "string",
          enum: ["offset", "angle", "midplane", "tangent", "atPoint"],
          description: "Type of construction plane to create",
        },
        basePlane: { type: "string", enum: ["XY", "XZ", "YZ"], description: "Base standard plane (for offset/angle)" },
        basePlaneToken: { type: "string", description: "Entity token of base plane/face" },
        offset: { type: "number", description: "Offset distance in cm (for offset type)" },
        angle: { type: "number", description: "Angle in degrees (for angle type)" },
        edgeToken: { type: "string", description: "Entity token of edge (for angle type)" },
        face1Token: { type: "string", description: "Entity token of first face (for midplane)" },
        face2Token: { type: "string", description: "Entity token of second face (for midplane)" },
        pointToken: { type: "string", description: "Entity token of point (for atPoint type)" },
      },
      required: ["planeType"],
    },
    handler: async (params) => {
      return bridge.send("create_construction_plane", params);
    },
  });

  registry.register({
    name: "create_construction_axis",
    description:
      "Create a construction axis through edges, points, faces, or along standard directions.",
    inputSchema: {
      type: "object",
      properties: {
        axisType: {
          type: "string",
          enum: ["twoPoints", "edge", "normal", "perpendicular"],
          description: "How to define the axis",
        },
        point1Token: { type: "string", description: "Entity token of first point" },
        point2Token: { type: "string", description: "Entity token of second point" },
        edgeToken: { type: "string", description: "Entity token of edge/line" },
        faceToken: { type: "string", description: "Entity token of face (for normal axis)" },
      },
      required: ["axisType"],
    },
    handler: async (params) => {
      return bridge.send("create_construction_axis", params);
    },
  });
}
