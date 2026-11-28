// Vercel entry for the MCP server (public at /mcp). Logic is in core/mcp.js.
import { mcp } from "../core/mcp.js";
export const GET = mcp, POST = mcp, DELETE = mcp, OPTIONS = mcp;
