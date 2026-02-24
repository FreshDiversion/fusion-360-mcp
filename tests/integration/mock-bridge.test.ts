import { describe, it, expect, vi, beforeEach } from "vitest";
import { createServer } from "../../src/server.js";

vi.mock("../../src/bridge.js", () => {
  return {
    FusionBridge: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn(),
      isConnected: vi.fn().mockReturnValue(true),
      send: vi.fn().mockImplementation(async (method: string, params?: Record<string, unknown>) => {
        // Mock responses for common tools
        const mockResponses: Record<string, unknown> = {
          get_document_info: {
            name: "Test Design",
            path: "",
            designType: "parametric",
            units: "mm",
            isSaved: false,
            activeComponentName: "Root",
          },
          get_design_structure: {
            name: "Root",
            entityToken: "root-token",
            bodies: [],
            sketches: [],
            joints: [],
            occurrences: [],
          },
          create_sketch: {
            name: "Sketch1",
            entityToken: "sketch-token",
            profileCount: 0,
            curveCount: 0,
            constraintCount: 0,
            dimensionCount: 0,
          },
          draw_rectangle: {
            lines: [
              { entityToken: "line1" },
              { entityToken: "line2" },
              { entityToken: "line3" },
              { entityToken: "line4" },
            ],
            profileCount: 1,
          },
          create_extrude: {
            featureName: "Extrude1",
            entityToken: "extrude-token",
            bodies: [
              {
                name: "Body1",
                entityToken: "body-token",
                type: "solid",
                isVisible: true,
                faceCount: 6,
                edgeCount: 12,
              },
            ],
          },
          create_fillet: {
            featureName: "Fillet1",
            entityToken: "fillet-token",
          },
          export_stl: {
            success: true,
            outputPath: "/tmp/test.stl",
          },
        };
        return mockResponses[method] ?? { success: true };
      }),
    })),
  };
});

describe("MCP Server Integration (Mock Bridge)", () => {
  it("should create server and bridge", () => {
    const { server, bridge } = createServer();
    expect(server).toBeDefined();
    expect(bridge).toBeDefined();
  });

  it("should simulate sketch → extrude → fillet → export workflow", async () => {
    const { bridge } = createServer();

    // Step 1: Create a sketch
    const sketch = await bridge.send("create_sketch", { plane: "XY" });
    expect(sketch).toHaveProperty("name", "Sketch1");

    // Step 2: Draw a rectangle
    const rect = await bridge.send("draw_rectangle", {
      sketchName: "Sketch1",
      x1: 0,
      y1: 0,
      x2: 5,
      y2: 3,
    });
    expect(rect).toHaveProperty("profileCount", 1);

    // Step 3: Extrude the profile
    const extrude = (await bridge.send("create_extrude", {
      sketchName: "Sketch1",
      distance: 2,
    })) as { bodies: { name: string }[] };
    expect(extrude.bodies).toHaveLength(1);
    expect(extrude.bodies[0].name).toBe("Body1");

    // Step 4: Fillet edges
    const fillet = await bridge.send("create_fillet", {
      edgeTokens: ["edge1"],
      radius: 0.2,
    });
    expect(fillet).toHaveProperty("featureName", "Fillet1");

    // Step 5: Export as STL
    const exported = await bridge.send("export_stl", {
      outputPath: "/tmp/test.stl",
    });
    expect(exported).toHaveProperty("success", true);
  });
});
