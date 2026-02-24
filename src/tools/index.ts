import { Server } from "@modelcontextprotocol/sdk/server/index.js";
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

export function registerAllTools(registry: ToolRegistry, bridge: FusionBridge): void {
  registerDocumentTools(registry, bridge);
  registerSketchTools(registry, bridge);
  registerModelingTools(registry, bridge);
  registerAssemblyTools(registry, bridge);
  registerParameterTools(registry, bridge);
  registerExportTools(registry, bridge);
  registerCamTools(registry, bridge);
  registerAnalysisTools(registry, bridge);
  registerMaterialTools(registry, bridge);
  registerUtilityTools(registry, bridge);
}
