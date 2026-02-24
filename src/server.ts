import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { FusionBridge } from "./bridge.js";
import { ToolRegistry, registerAllTools } from "./tools/index.js";

export function createServer(): { server: Server; bridge: FusionBridge } {
  const bridge = new FusionBridge(
    process.env.FUSION_HOST || "127.0.0.1",
    parseInt(process.env.FUSION_PORT || "8765", 10),
    parseInt(process.env.FUSION_TIMEOUT || "30000", 10)
  );

  const registry = new ToolRegistry();
  registerAllTools(registry, bridge);

  const server = new Server(
    {
      name: "fusion-360-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List all available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: registry.getAll().map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = registry.get(name);

    if (!tool) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: `Unknown tool: ${name}` }),
          },
        ],
        isError: true,
      };
    }

    try {
      const result = await tool.handler((args ?? {}) as Record<string, unknown>);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: message }),
          },
        ],
        isError: true,
      };
    }
  });

  return { server, bridge };
}
