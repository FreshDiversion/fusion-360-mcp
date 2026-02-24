import { describe, it, expect, vi, beforeEach } from "vitest";
import { ToolRegistry, registerAllTools } from "../../src/tools/index.js";
import { FusionBridge } from "../../src/bridge.js";

vi.mock("../../src/bridge.js");

describe("Tool Registry", () => {
  let registry: ToolRegistry;
  let bridge: FusionBridge;

  beforeEach(() => {
    registry = new ToolRegistry();
    bridge = new FusionBridge();
    vi.mocked(bridge.send).mockResolvedValue({});
  });

  it("should register a tool", () => {
    registry.register({
      name: "test_tool",
      description: "A test tool",
      inputSchema: { type: "object", properties: {}, required: [] },
      handler: async () => ({}),
    });
    expect(registry.has("test_tool")).toBe(true);
    expect(registry.get("test_tool")?.name).toBe("test_tool");
  });

  it("should return undefined for unknown tool", () => {
    expect(registry.get("nonexistent")).toBeUndefined();
    expect(registry.has("nonexistent")).toBe(false);
  });

  it("should return all registered tools", () => {
    registry.register({
      name: "tool1",
      description: "Tool 1",
      inputSchema: { type: "object", properties: {}, required: [] },
      handler: async () => ({}),
    });
    registry.register({
      name: "tool2",
      description: "Tool 2",
      inputSchema: { type: "object", properties: {}, required: [] },
      handler: async () => ({}),
    });
    expect(registry.getAll()).toHaveLength(2);
  });

  it("registerAllTools should register all 65 tools", () => {
    registerAllTools(registry, bridge);
    const tools = registry.getAll();
    expect(tools.length).toBe(65);
  });

  it("all tools should have required fields", () => {
    registerAllTools(registry, bridge);
    for (const tool of registry.getAll()) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
      expect(typeof tool.handler).toBe("function");
    }
  });

  it("all tool names should be unique", () => {
    registerAllTools(registry, bridge);
    const names = registry.getAll().map((t) => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});
