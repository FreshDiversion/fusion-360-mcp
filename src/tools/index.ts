import { FusionBridge } from "../bridge.js";
import { registerDocumentTools } from "./document.js";
import { registerSketchTools } from "./sketch.js";
import { registerModelingTools } from "./modeling.js";
import { registerAssemblyTools } from "./assembly.js";
import { registerParameterTools } from "./parameters.js";
import { registerExportTools } from "./export.js";
import { registerCamTools } from "./cam.js";
import { registerAnalysisTools } from "./analysis.js";
import { registerMaterialTools } from "./materials.js";
import { registerUtilityTools } from "./utilities.js";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

export type ToolCategory =
  | "document"
  | "sketch"
  | "modeling"
  | "assembly"
  | "parameters"
  | "export"
  | "cam"
  | "analysis"
  | "materials"
  | "utilities";

export const ALL_CATEGORIES: ToolCategory[] = [
  "document",
  "sketch",
  "modeling",
  "assembly",
  "parameters",
  "export",
  "cam",
  "analysis",
  "materials",
  "utilities",
];

const CATEGORY_REGISTRY: Record<ToolCategory, (registry: ToolRegistry, bridge: FusionBridge) => void> = {
  document: registerDocumentTools,
  sketch: registerSketchTools,
  modeling: registerModelingTools,
  assembly: registerAssemblyTools,
  parameters: registerParameterTools,
  export: registerExportTools,
  cam: registerCamTools,
  analysis: registerAnalysisTools,
  materials: registerMaterialTools,
  utilities: registerUtilityTools,
};

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }
}

/**
 * Parse the FUSION_TOOLS env var into a set of enabled categories.
 * Supports comma-separated list: "sketch,modeling,export"
 * Returns all categories if unset or set to "all".
 */
export function parseEnabledCategories(envValue?: string): Set<ToolCategory> {
  if (!envValue || envValue.trim() === "" || envValue.trim().toLowerCase() === "all") {
    return new Set(ALL_CATEGORIES);
  }

  const requested = envValue.split(",").map((s) => s.trim().toLowerCase());
  const enabled = new Set<ToolCategory>();

  for (const name of requested) {
    if (ALL_CATEGORIES.includes(name as ToolCategory)) {
      enabled.add(name as ToolCategory);
    } else {
      console.error(
        `[fusion-360-mcp] Unknown tool category: "${name}". ` +
        `Valid categories: ${ALL_CATEGORIES.join(", ")}`
      );
    }
  }

  // Always include document — it's needed for basic operation
  enabled.add("document");

  return enabled;
}

export function registerAllTools(
  registry: ToolRegistry,
  bridge: FusionBridge,
  categories?: Set<ToolCategory>,
): void {
  const enabled = categories ?? new Set(ALL_CATEGORIES);
  for (const category of enabled) {
    const registerFn = CATEGORY_REGISTRY[category];
    if (registerFn) {
      registerFn(registry, bridge);
    }
  }
}
