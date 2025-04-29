import { serve } from '@hono/node-server'
import { Hono } from 'hono';
import mcp from './mcp/server';
import chats from './routes/chats';

const app = new Hono()
const routes = app
  .route("/mcp", mcp)
  .route("/chats", chats)
;

async function main() {
  console.log("Starting server on port 3000");
  serve({
    fetch: app.fetch,
    port: 3000,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

export default app;
export type App = typeof routes;
