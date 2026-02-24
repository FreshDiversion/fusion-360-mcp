import { ToolRegistry } from "./index.js";
import { FusionBridge } from "../bridge.js";

export function registerMaterialTools(registry: ToolRegistry, bridge: FusionBridge): void {
  registry.register({
    name: "set_material",
    description:
      "Apply a material to a body or component. Materials define physical properties (density, strength) used for mass calculations and simulation. Search available materials with list_materials first.",
    inputSchema: {
      type: "object",
      properties: {
        entityToken: { type: "string", description: "Entity token of the body or component" },
        materialName: { type: "string", description: "Name of the material (e.g., 'Steel', 'Aluminum 6061', 'ABS Plastic')" },
        libraryName: { type: "string", description: "Material library name (e.g., 'Fusion 360 Material Library')" },
      },
      required: ["entityToken", "materialName"],
    },
    handler: async (params) => {
      return bridge.send("set_material", params);
    },
  });

  registry.register({
    name: "set_appearance",
    description:
      "Apply a visual appearance to a face, body, or component. Appearances control color and texture rendering but don't affect physical properties. Search available appearances with list_appearances first.",
    inputSchema: {
      type: "object",
      properties: {
        entityToken: { type: "string", description: "Entity token of the face, body, or component" },
        appearanceName: { type: "string", description: "Name of the appearance (e.g., 'Red', 'Chrome - Polished', 'Oak')" },
        libraryName: { type: "string", description: "Appearance library name (e.g., 'Fusion 360 Appearance Library')" },
      },
      required: ["entityToken", "appearanceName"],
    },
    handler: async (params) => {
      return bridge.send("set_appearance", params);
    },
  });

  registry.register({
    name: "list_materials",
    description:
      "List available materials from Fusion 360's material libraries. Can filter by library name or search term. Returns material names and basic properties.",
    inputSchema: {
      type: "object",
      properties: {
        libraryName: { type: "string", description: "Filter by library name" },
        search: { type: "string", description: "Search term to filter materials" },
        limit: { type: "integer", description: "Maximum number of results", default: 50 },
      },
      required: [],
    },
    handler: async (params) => {
      return bridge.send("list_materials", params);
    },
  });

  registry.register({
    name: "list_appearances",
    description:
      "List available appearances from Fusion 360's appearance libraries. Can filter by library name or search term.",
    inputSchema: {
      type: "object",
      properties: {
        libraryName: { type: "string", description: "Filter by library name" },
        search: { type: "string", description: "Search term to filter appearances" },
        limit: { type: "integer", description: "Maximum number of results", default: 50 },
      },
      required: [],
    },
    handler: async (params) => {
      return bridge.send("list_appearances", params);
    },
  });
}
