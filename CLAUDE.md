# Fusion 360 MCP Server

## Project Structure
- `src/` - TypeScript MCP server
- `fusion-addin/` - Python Fusion 360 add-in
- `tests/` - Unit and integration tests

## Commands
- `npm run build` - Compile TypeScript
- `npm run dev` - Run with tsx (development)
- `npm test` - Run tests with vitest
- `npm run lint` - Type-check without emitting

## Architecture
Two-process design: TypeScript MCP server (stdio) ↔ Python Fusion add-in (TCP :8765, JSON-RPC 2.0).

## Conventions
- All Fusion 360 measurements in centimeters (internal units)
- Tool names use snake_case
- Each tool module exports a `register(server, bridge)` function
- JSON-RPC methods map to tool names: `tool_name` → RPC method `tool_name`
- Zod schemas for all tool input validation
- Error messages should be user-friendly (AI-readable)

## Fusion 360 API Notes
- API must be called from main UI thread
- Event handlers need global references (prevent GC)
- Namespaces: adsk.core, adsk.fusion, adsk.cam
- CustomEvent used for thread-safe dispatch from TCP server to main thread
