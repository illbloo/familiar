import { Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { toFetchResponse, toReqRes } from "fetch-to-node";
import { provider as memoryProvider } from "./memory";
import { provider as chatsProvider } from "./chats";
import { provider as postsProvider } from "./posts";
import { provider as notifyProvider } from "./notify";

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "familiar",
    version: "1.1.0",
  });

  memoryProvider(server);
  chatsProvider(server);
  postsProvider(server);
  notifyProvider(server);

  return server;
}

const app = new Hono()
  .post("/", async (c) => {
    const { req, res } = toReqRes(c.req.raw);

    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, await c.req.json());

    res.on("close", () => {
      console.log("Request closed");
      transport.close();
      server.close();
    });

    return toFetchResponse(res);
  })
  .get("/", async (c) => {
    return c.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed.",
        },
        id: null,
      },
      { status: 405 },
    );
  })
  .delete("/", async (c) => {
    return c.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed.",
        },
        id: null,
      },
      { status: 405 },
    );
  });

export default app;