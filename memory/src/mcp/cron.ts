import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  cronPromptInsertSchema,
  cronPromptSelectSchema,
  cronPromptsTable,
} from "../db/schema/cron-prompts";
import db from "../db";
import { eq } from "drizzle-orm";

export const provider = (mcp: McpServer) => {
  mcp.tool(
    "cron_prompt_create",
    "Create a new cron job to schedule an  LLM prompt",
    cronPromptInsertSchema.pick({
      name: true,
      expression: true,
      messages: true,
      chatId: true,
    }).shape,
    async (values) => {
      const cron = await db
        .insert(cronPromptsTable)
        .values(values)
        .returning({ id: cronPromptsTable.id })
        .then(([inserted]) => inserted);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(cron),
        }],
      }
    }
  );

  mcp.tool(
    "cron_prompt_get",
    "Get a cron job by ID",
    {
      id: cronPromptSelectSchema.shape.id,
    },
    async ({ id }) => {
      const cron = await db.select().from(cronPromptsTable).where(eq(cronPromptsTable.id, id));
      return {
        content: [{
          type: "text",
          text: JSON.stringify(cron),
        }],
      };
    },
  );

  mcp.tool(
    "cron_prompt_list",
    "List all cron jobs",
    async () => {
      const crons = await db.select().from(cronPromptsTable);
      return {
        content: crons.map((cron) => ({
          type: "text",
          text: JSON.stringify(cron),
        })),
      };
    }
  );

  mcp.tool(
    "cron_prompt_delete",
    "Delete a cron job",
    {
      id: cronPromptSelectSchema.shape.id,
    },
    async ({ id }) => {
      await db.delete(cronPromptsTable).where(eq(cronPromptsTable.id, id));
      return {
        content: [{
          type: "text",
          text: "Cron job deleted successfully",
        }],
      };
    },
  );

  mcp.tool(
    "cron_prompt_update",
    "Update a cron job",
    {
      id: cronPromptSelectSchema.shape.id,
    },
    async (values) => {
      const cron = await db
        .update(cronPromptsTable)
        .set(values)
        .where(eq(cronPromptsTable.id, values.id))
        .returning({ id: cronPromptsTable.id })
        .then(([updated]) => updated);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(cron),
        }],
      }
    },
  );
}