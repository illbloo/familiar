import { serve } from '@hono/node-server'
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import mcp from './mcp/server';
import chats from './routes/chats';
import posts from './routes/posts';
import users from './routes/users';
import jobs from './routes/jobs';

type HonoEnv = {};

const app = new Hono<HonoEnv>()
const routes = app
  .route("/mcp", mcp)
  .route("/chats", chats)
  .route("/posts", posts)
  .route("/users", users)
  .route("/jobs", jobs);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

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
