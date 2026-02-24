import { describe, it, expect, vi, beforeEach } from "vitest";
import { ToolRegistry } from "../../src/tools/index.js";
import { FusionBridge } from "../../src/bridge.js";
import { registerDocumentTools } from "../../src/tools/document.js";

vi.mock("../../src/bridge.js");

describe("Document Tools", () => {
  let registry: ToolRegistry;
  let bridge: FusionBridge;

  beforeEach(() => {
    registry = new ToolRegistry();
    bridge = new FusionBridge();
    vi.mocked(bridge.send).mockResolvedValue({});
    registerDocumentTools(registry, bridge);
  });

  it("should register get_document_info tool", () => {
    expect(registry.has("get_document_info")).toBe(true);
  });

  it("should register get_design_structure tool", () => {
    expect(registry.has("get_design_structure")).toBe(true);
  });

  it("get_document_info should call bridge.send", async () => {
    const mockResult = {
      name: "Test Design",
      designType: "parametric",
      units: "mm",
    };
    vi.mocked(bridge.send).mockResolvedValue(mockResult);

    const tool = registry.get("get_document_info")!;
    const result = await tool.handler({});
    expect(bridge.send).toHaveBeenCalledWith("get_document_info");
    expect(result).toEqual(mockResult);
  });

  it("get_design_structure should call bridge.send", async () => {
    const mockResult = {
      name: "Root",
      bodies: [],
      sketches: [],
      joints: [],
      occurrences: [],
    };
    vi.mocked(bridge.send).mockResolvedValue(mockResult);

    const tool = registry.get("get_design_structure")!;
    const result = await tool.handler({});
    expect(bridge.send).toHaveBeenCalledWith("get_design_structure");
    expect(result).toEqual(mockResult);
  });
});
