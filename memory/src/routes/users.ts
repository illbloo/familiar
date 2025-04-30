import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import db from "../db";
import { usersTable } from "../db/schema/users";

const app = new Hono()
  .post(
    "/",
    zValidator("json", z.object({ 
      name: z.string().min(1),
    })),
    async (c) => {
      const { name } = c.req.valid("json");

      const [user] = await db
        .insert(usersTable)
        .values({ name })
        .returning();

      return c.json({ id: user.id });
    }
  )
  .put(
    "/:userId/facts",
    zValidator("param", z.object({ userId: z.string().uuid() })),
    zValidator("json", z.object({
      facts: z.string().min(1).describe("Markdown-formatted summary of info about the user"),
    })),
    async (c) => {
      const { userId } = c.req.param();
      const { facts } = c.req.valid("json");

      await db
        .update(usersTable)
        .set({ facts })
        .where(eq(usersTable.id, userId));

      return c.json({ success: true });
    },
  )
  .get(
    "/:userId/facts",
    zValidator("param", z.object({ userId: z.string().uuid() })),
    async (c) => {
      const { userId } = c.req.param();

      const [user] = await db
        .select({ facts: usersTable.facts })
        .from(usersTable)
        .where(eq(usersTable.id, userId));

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }
      return c.json({ facts: user.facts });
    }
  )
;

export default app;
