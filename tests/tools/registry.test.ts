import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ToolRegistry,
  registerAllTools,
  parseEnabledCategories,
  ALL_CATEGORIES,
} from "../../src/tools/index.js";
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

  it("registerAllTools should register all 67 tools", () => {
    registerAllTools(registry, bridge);
    const tools = registry.getAll();
    expect(tools.length).toBe(67);
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

describe("Category Filtering", () => {
  let registry: ToolRegistry;
  let bridge: FusionBridge;

  beforeEach(() => {
    registry = new ToolRegistry();
    bridge = new FusionBridge();
    vi.mocked(bridge.send).mockResolvedValue({});
  });

  it("parseEnabledCategories returns all categories when unset", () => {
    const cats = parseEnabledCategories(undefined);
    expect(cats.size).toBe(ALL_CATEGORIES.length);
  });

  it("parseEnabledCategories returns all categories for 'all'", () => {
    const cats = parseEnabledCategories("all");
    expect(cats.size).toBe(ALL_CATEGORIES.length);
  });

  it("parseEnabledCategories returns all categories for empty string", () => {
    const cats = parseEnabledCategories("");
    expect(cats.size).toBe(ALL_CATEGORIES.length);
  });

  it("parseEnabledCategories parses comma-separated list", () => {
    const cats = parseEnabledCategories("sketch,modeling,export");
    expect(cats.has("sketch")).toBe(true);
    expect(cats.has("modeling")).toBe(true);
    expect(cats.has("export")).toBe(true);
    // document is always included
    expect(cats.has("document")).toBe(true);
    expect(cats.has("cam")).toBe(false);
  });

  it("parseEnabledCategories always includes document", () => {
    const cats = parseEnabledCategories("cam");
    expect(cats.has("document")).toBe(true);
    expect(cats.has("cam")).toBe(true);
  });

  it("parseEnabledCategories ignores unknown categories", () => {
    const cats = parseEnabledCategories("sketch,bogus,modeling");
    expect(cats.has("sketch")).toBe(true);
    expect(cats.has("modeling")).toBe(true);
    expect(cats.has("document")).toBe(true);
    expect(cats.size).toBe(3);
  });

  it("registerAllTools with subset registers fewer tools", () => {
    const cats = parseEnabledCategories("sketch");
    registerAllTools(registry, bridge, cats);
    const tools = registry.getAll();
    // document (2) + sketch (10) = 12
    expect(tools.length).toBe(12);
    expect(registry.has("create_sketch")).toBe(true);
    expect(registry.has("get_document_info")).toBe(true);
    expect(registry.has("create_extrude")).toBe(false);
  });

  it("registerAllTools with sketch,modeling registers correct count", () => {
    const cats = parseEnabledCategories("sketch,modeling");
    registerAllTools(registry, bridge, cats);
    const tools = registry.getAll();
    // document (2) + sketch (10) + modeling (15) = 27
    expect(tools.length).toBe(27);
  });
});
