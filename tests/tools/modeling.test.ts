import { describe, it, expect, vi, beforeEach } from "vitest";
import { ToolRegistry } from "../../src/tools/index.js";
import { FusionBridge } from "../../src/bridge.js";
import { registerModelingTools } from "../../src/tools/modeling.js";

vi.mock("../../src/bridge.js");

describe("Modeling Tools", () => {
  let registry: ToolRegistry;
  let bridge: FusionBridge;

  beforeEach(() => {
    registry = new ToolRegistry();
    bridge = new FusionBridge();
    vi.mocked(bridge.send).mockResolvedValue({});
    registerModelingTools(registry, bridge);
  });

  const modelingTools = [
    "create_extrude",
    "create_revolve",
    "create_sweep",
    "create_loft",
    "create_fillet",
    "create_chamfer",
    "create_shell",
    "boolean_operation",
    "create_hole",
    "create_thread",
    "create_pattern_rectangular",
    "create_pattern_circular",
    "create_mirror",
    "create_construction_plane",
    "create_construction_axis",
  ];

  for (const name of modelingTools) {
    it(`should register ${name} tool`, () => {
      expect(registry.has(name)).toBe(true);
    });
  }

  it("create_extrude should pass sketch and distance", async () => {
    const params = { sketchName: "Sketch1", distance: 2.5, operation: "join" };
    const tool = registry.get("create_extrude")!;
    await tool.handler(params);
    expect(bridge.send).toHaveBeenCalledWith("create_extrude", params);
  });

  it("create_fillet should pass edge tokens and radius", async () => {
    const params = { edgeTokens: ["edge1", "edge2"], radius: 0.2 };
    const tool = registry.get("create_fillet")!;
    await tool.handler(params);
    expect(bridge.send).toHaveBeenCalledWith("create_fillet", params);
  });

  it("boolean_operation should pass bodies and operation", async () => {
    const params = { targetBodyToken: "body1", toolBodyToken: "body2", operation: "cut" };
    const tool = registry.get("boolean_operation")!;
    await tool.handler(params);
    expect(bridge.send).toHaveBeenCalledWith("boolean_operation", params);
  });

  it("create_construction_plane should pass type and offset", async () => {
    const params = { planeType: "offset", basePlane: "XY", offset: 5.0 };
    const tool = registry.get("create_construction_plane")!;
    await tool.handler(params);
    expect(bridge.send).toHaveBeenCalledWith("create_construction_plane", params);
  });
});
