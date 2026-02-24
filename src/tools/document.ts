import { ToolRegistry, ToolDefinition } from "./index.js";
import { FusionBridge } from "../bridge.js";

export function registerDocumentTools(registry: ToolRegistry, bridge: FusionBridge): void {
  registry.register({
    name: "get_document_info",
    description:
      "Get information about the active Fusion 360 document including name, file path, design type (parametric/direct), units, save status, and active component.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async () => {
      return bridge.send("get_document_info");
    },
  });

  registry.register({
    name: "get_design_structure",
    description:
      "Get the full component/occurrence tree of the active design. Returns a hierarchical structure showing components, bodies, sketches, joints, and nested occurrences. Useful for understanding the design before making modifications.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async () => {
      return bridge.send("get_design_structure");
    },
  });
}
