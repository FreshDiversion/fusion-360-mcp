import { describe, it, expect, vi, beforeEach } from "vitest";
import { ToolRegistry } from "../../src/tools/index.js";
import { FusionBridge } from "../../src/bridge.js";
import { registerAssemblyTools } from "../../src/tools/assembly.js";

vi.mock("../../src/bridge.js");

describe("Assembly Tools", () => {
  let registry: ToolRegistry;
  let bridge: FusionBridge;

  beforeEach(() => {
    registry = new ToolRegistry();
    bridge = new FusionBridge();
    vi.mocked(bridge.send).mockResolvedValue({});
    registerAssemblyTools(registry, bridge);
  });

  const assemblyTools = [
    "create_component",
    "insert_component",
    "create_joint",
    "get_assembly_info",
    "move_component",
    "check_interference",
    "body_to_component",
  ];

  for (const name of assemblyTools) {
    it(`should register ${name} tool`, () => {
      expect(registry.has(name)).toBe(true);
    });
  }

  it("body_to_component should pass bodyToken", async () => {
    const params = { bodyToken: "body1" };
    const tool = registry.get("body_to_component")!;
    await tool.handler(params);
    expect(bridge.send).toHaveBeenCalledWith("body_to_component", params);
  });

  it("body_to_component should pass optional name", async () => {
    const params = { bodyToken: "body1", name: "MyComponent" };
    const tool = registry.get("body_to_component")!;
    await tool.handler(params);
    expect(bridge.send).toHaveBeenCalledWith("body_to_component", params);
  });

  it("create_component should pass name", async () => {
    const params = { name: "NewComp" };
    const tool = registry.get("create_component")!;
    await tool.handler(params);
    expect(bridge.send).toHaveBeenCalledWith("create_component", params);
  });
});
