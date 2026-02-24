import { ToolRegistry } from "./index.js";
import { FusionBridge } from "../bridge.js";

export function registerAssemblyTools(registry: ToolRegistry, bridge: FusionBridge): void {
  registry.register({
    name: "create_component",
    description:
      "Create a new empty component in the design. Components organize bodies and features, and can be independently positioned as occurrences.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name for the new component" },
        parentToken: { type: "string", description: "Entity token of parent component. Uses root if omitted." },
      },
      required: ["name"],
    },
    handler: async (params) => {
      return bridge.send("create_component", params);
    },
  });

  registry.register({
    name: "insert_component",
    description:
      "Insert an existing component from a file into the design. Supports F3D, STEP, IGES, and other formats.",
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Full file path of the component to insert" },
        parentToken: { type: "string", description: "Entity token of parent component. Uses root if omitted." },
      },
      required: ["filePath"],
    },
    handler: async (params) => {
      return bridge.send("insert_component", params);
    },
  });

  registry.register({
    name: "create_joint",
    description:
      "Create a joint between two component occurrences. Joints define how components move relative to each other. Types: rigid, revolute (hinge), slider, cylindrical, pin_slot, planar, ball.",
    inputSchema: {
      type: "object",
      properties: {
        occurrence1Token: { type: "string", description: "Entity token of the first occurrence's joint geometry (face, edge, point)" },
        occurrence2Token: { type: "string", description: "Entity token of the second occurrence's joint geometry" },
        jointType: {
          type: "string",
          enum: ["rigid", "revolute", "slider", "cylindrical", "pin_slot", "planar", "ball"],
          description: "Type of joint motion",
        },
        name: { type: "string", description: "Optional name for the joint" },
        isFlipped: { type: "boolean", description: "Flip the joint direction", default: false },
      },
      required: ["occurrence1Token", "occurrence2Token", "jointType"],
    },
    handler: async (params) => {
      return bridge.send("create_joint", params);
    },
  });

  registry.register({
    name: "get_assembly_info",
    description:
      "Get assembly information including the occurrence tree, joint list, and grounded component status.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async () => {
      return bridge.send("get_assembly_info");
    },
  });

  registry.register({
    name: "move_component",
    description:
      "Transform (translate and/or rotate) a component occurrence. Translation values in cm, rotation angles in degrees.",
    inputSchema: {
      type: "object",
      properties: {
        occurrenceToken: { type: "string", description: "Entity token of the occurrence to move" },
        translateX: { type: "number", description: "Translation along X axis (cm)", default: 0 },
        translateY: { type: "number", description: "Translation along Y axis (cm)", default: 0 },
        translateZ: { type: "number", description: "Translation along Z axis (cm)", default: 0 },
        rotateX: { type: "number", description: "Rotation around X axis (degrees)", default: 0 },
        rotateY: { type: "number", description: "Rotation around Y axis (degrees)", default: 0 },
        rotateZ: { type: "number", description: "Rotation around Z axis (degrees)", default: 0 },
      },
      required: ["occurrenceToken"],
    },
    handler: async (params) => {
      return bridge.send("move_component", params);
    },
  });

  registry.register({
    name: "check_interference",
    description:
      "Check for interference (overlapping volumes) between bodies or components. Returns a list of interfering pairs with interference volumes.",
    inputSchema: {
      type: "object",
      properties: {
        entityTokens: {
          type: "array",
          items: { type: "string" },
          description: "Entity tokens of bodies/components to check. Checks all pairs if more than 2.",
          minItems: 2,
        },
      },
      required: ["entityTokens"],
    },
    handler: async (params) => {
      return bridge.send("check_interference", params);
    },
  });
}
