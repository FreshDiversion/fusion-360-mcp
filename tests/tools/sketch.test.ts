import { describe, it, expect, vi, beforeEach } from "vitest";
import { ToolRegistry } from "../../src/tools/index.js";
import { FusionBridge } from "../../src/bridge.js";
import { registerSketchTools } from "../../src/tools/sketch.js";

vi.mock("../../src/bridge.js");

describe("Sketch Tools", () => {
  let registry: ToolRegistry;
  let bridge: FusionBridge;

  beforeEach(() => {
    registry = new ToolRegistry();
    bridge = new FusionBridge();
    vi.mocked(bridge.send).mockResolvedValue({});
    registerSketchTools(registry, bridge);
  });

  const sketchTools = [
    "create_sketch",
    "draw_line",
    "draw_rectangle",
    "draw_circle",
    "draw_arc",
    "draw_polygon",
    "draw_spline",
    "add_sketch_constraint",
    "add_sketch_dimension",
    "get_sketch_info",
  ];

  for (const name of sketchTools) {
    it(`should register ${name} tool`, () => {
      expect(registry.has(name)).toBe(true);
    });
  }

  it("create_sketch should pass plane parameter", async () => {
    const tool = registry.get("create_sketch")!;
    await tool.handler({ plane: "XY" });
    expect(bridge.send).toHaveBeenCalledWith("create_sketch", { plane: "XY" });
  });

  it("draw_line should pass coordinates", async () => {
    const params = { sketchName: "Sketch1", startX: 0, startY: 0, endX: 5, endY: 5 };
    const tool = registry.get("draw_line")!;
    await tool.handler(params);
    expect(bridge.send).toHaveBeenCalledWith("draw_line", params);
  });

  it("draw_rectangle should pass twoPoint parameters", async () => {
    const params = { sketchName: "Sketch1", x1: 0, y1: 0, x2: 10, y2: 5 };
    const tool = registry.get("draw_rectangle")!;
    await tool.handler(params);
    expect(bridge.send).toHaveBeenCalledWith("draw_rectangle", params);
  });

  it("draw_circle should pass center and radius", async () => {
    const params = { sketchName: "Sketch1", centerX: 0, centerY: 0, radius: 5 };
    const tool = registry.get("draw_circle")!;
    await tool.handler(params);
    expect(bridge.send).toHaveBeenCalledWith("draw_circle", params);
  });

  it("draw_polygon should pass sides and radius", async () => {
    const params = { sketchName: "Sketch1", centerX: 0, centerY: 0, radius: 3, sides: 6 };
    const tool = registry.get("draw_polygon")!;
    await tool.handler(params);
    expect(bridge.send).toHaveBeenCalledWith("draw_polygon", params);
  });
});
