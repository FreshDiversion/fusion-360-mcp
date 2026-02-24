#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main() {
  const { server, bridge } = createServer();
  const transport = new StdioServerTransport();

  // Attempt initial connection to Fusion 360
  try {
    await bridge.connect();
  } catch {
    console.error(
      "[fusion-360-mcp] Could not connect to Fusion 360 add-in. " +
      "Tools will attempt to reconnect on first use. " +
      "Make sure the FusionMCP add-in is running in Fusion 360."
    );
  }

  // Graceful shutdown
  process.on("SIGINT", () => {
    bridge.disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    bridge.disconnect();
    process.exit(0);
  });

  await server.connect(transport);
  console.error("[fusion-360-mcp] Server started on stdio transport");
}

main().catch((error) => {
  console.error("[fusion-360-mcp] Fatal error:", error);
  process.exit(1);
});
