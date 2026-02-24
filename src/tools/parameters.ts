import { ToolRegistry } from "./index.js";
import { FusionBridge } from "../bridge.js";

export function registerParameterTools(registry: ToolRegistry, bridge: FusionBridge): void {
  registry.register({
    name: "get_parameters",
    description:
      "List all user parameters in the active design. Returns parameter names, values, expressions, units, and comments. User parameters are the named parameters visible in the Parameters dialog.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async () => {
      return bridge.send("get_parameters");
    },
  });

  registry.register({
    name: "set_parameter",
    description:
      "Modify an existing user parameter's value or expression. Provide either a numeric value or an expression string. Units must match the parameter's unit type.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the parameter to modify" },
        value: { type: "number", description: "New numeric value (in the parameter's units)" },
        expression: { type: "string", description: "New expression string (e.g., '25.4 mm', 'width / 2'). Overrides value." },
        comment: { type: "string", description: "Optional comment for the parameter" },
      },
      required: ["name"],
    },
    handler: async (params) => {
      return bridge.send("set_parameter", params);
    },
  });

  registry.register({
    name: "create_parameter",
    description:
      "Create a new user parameter. Parameters can be used in expressions throughout the design for parametric control.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Parameter name (must be unique, no spaces)" },
        value: { type: "number", description: "Initial numeric value" },
        unit: { type: "string", description: "Unit type (e.g., 'mm', 'cm', 'in', 'deg', '')", default: "mm" },
        expression: { type: "string", description: "Expression string (overrides value)" },
        comment: { type: "string", description: "Optional description/comment" },
      },
      required: ["name", "value", "unit"],
    },
    handler: async (params) => {
      return bridge.send("create_parameter", params);
    },
  });
}
