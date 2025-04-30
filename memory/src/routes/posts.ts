import { Hono } from "hono";
import db from "../db";
import { zValidator } from "@hono/zod-validator";
import { postsSelectSchema, postsTable } from "../db/schema/posts";
import { eq, SQL, and, lt, gt } from "drizzle-orm";
import { z } from "zod";
import { nomber } from "../util/zod";

export const getPostsSchema = z.object({
  before: z.date().max(new Date()).optional()
    .describe("Retrieve posts before this date"),
  after: z.date().optional()
    .describe("Retrieve posts after this date"),
  limit: nomber(z.number().min(1).max(20)).optional()
    .describe("Maximum number of posts to retrieve"),
});

const app = new Hono()
  .post(
    "/",
    zValidator("json", z.object({
      text: z.string(),
    })),
    async (c) => {
      const body = c.req.valid('json');
      const row = await db
        .insert(postsTable)
        .values(body)
        .returning()
        .then((rows) => rows[0] satisfies { id: string });
      
      return c.json(row);
    }
  )
  .get(
    "/",
    zValidator("query", getPostsSchema),
    async (c) => {
      const body = c.req.valid('query');

      const conditions: SQL[] = [];
      if (body.before) conditions.push(lt(postsTable.createdAt, body.before));
      if (body.after) conditions.push(gt(postsTable.createdAt, body.after));

      const posts = await db.query.postsTable.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: body.limit,
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      });
      return c.json(posts);
    }
  )
  .get(
    "/:postId",
    zValidator("param", z.object({ postId: postsSelectSchema.shape.id })),
    async (c) => {
      const { postId } = c.req.valid("param");
      const [row] = await db
        .select()
        .from(postsTable)
        .where(eq(postsTable.id, postId));
      
      if (!row) {
        return c.json({ error: "Post not found" }, 404);
      }
      return c.json(row);
    },
  )
  .delete(
    "/:postId",
    zValidator("param", z.object({ postId: postsSelectSchema.shape.id })),
    async (c) => {
      const { postId } = c.req.valid("param");
      await db.delete(postsTable).where(eq(postsTable.id, postId));
      return c.json({ message: "Post deleted" });
    },
  )
;

export default app;
export type App = typeof app;
