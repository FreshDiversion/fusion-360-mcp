# Fusion 360 MCP Server

## Project Structure
- `src/` - TypeScript MCP server (66 tools across 10 category modules)
- `src/tools/index.ts` - Tool registry + category filtering
- `src/bridge.ts` - TCP socket bridge (FusionBridge class)
- `fusion-addin/FusionMCP/` - Python Fusion 360 add-in
- `fusion-addin/FusionMCP/executor.py` - Command executor (~55 cmd_ methods, ~1400 lines)
- `tests/` - Unit and integration tests (vitest)
- `available-tools.md` - Full list of all 66 tools by category

## Commands
- `npm run build` - Compile TypeScript
- `npm run dev` - Run with tsx (development)
- `npm test` - Run tests with vitest
- `npm run lint` - Type-check without emitting
- `python fusion-addin/install.py` - Install add-in to Fusion 360
- `python fusion-addin/install.py uninstall` - Remove add-in

## Architecture
Two-process design: TypeScript MCP server (stdio) ↔ Python Fusion add-in (TCP :8765, JSON-RPC 2.0).

Tool categories can be filtered via `FUSION_TOOLS` env var to reduce token overhead.
Document category is always included regardless of filter.

## Env Vars
- `FUSION_HOST` - Bridge host (default: 127.0.0.1)
- `FUSION_PORT` - Bridge port (default: 8765)
- `FUSION_TIMEOUT` - Request timeout ms (default: 30000)
- `FUSION_TOOLS` - Comma-separated category filter (default: all)
  - Categories: document, sketch, modeling, assembly, parameters, export, cam, analysis, materials, utilities
  - Example: `FUSION_TOOLS=sketch,modeling,export` → 31 tools instead of 65

## Conventions
- All Fusion 360 measurements in centimeters (internal units)
- Tool names use snake_case
- Each tool module exports a `registerXxxTools(registry, bridge)` function
- JSON-RPC methods map 1:1 to tool names
- Python executor methods are `cmd_<tool_name>`
- Error messages should be user-friendly (AI-readable)

## Fusion 360 API Notes
- API must be called from main UI thread
- Event handlers need global references (prevent GC)
- Namespaces: adsk.core, adsk.fusion, adsk.cam
- CustomEvent used for thread-safe dispatch from TCP server to main thread
