import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import z from "zod"

const ENVS = [
  "NTFY_BASE_URL",
  "NTFY_TOKEN",
  "NTFY_TOPIC_USER",
] as const;

const checkEnv = <T extends Record<string, string | undefined>>(env: T): env is T & { [K in typeof ENVS[number]]: string } => ENVS.every((key) => env[key] !== undefined && env[key]?.length > 0);

export const provider = (mcp: McpServer) => {
  const env = process.env;

  const sendNotificationTool = mcp.tool(
    "send_notification",
    "Send a personal push notification to the user.",
    {
      message: z.string().describe("Main content of the notification (max 4096 bytes)"),
      title: z.string().optional().describe("Notification title (max 250 bytes)"),
      priority: z.number().min(0).max(5).optional().describe("Message priority (0-5)"),
      click: z.string().optional().describe("URL to open when the notification is clicked"),
      //delay: z.string().optional().describe("Timestamp or duration for delayed delivery"),
      markdown: z.boolean().optional().describe("Set true if message is markdown-formatted"),
    },
    {
      title: "Send Notification",
      readOnlyHint: true,
      openWorldHint: false,
    } satisfies ToolAnnotations,
    async (args) => {
      if (!checkEnv(env)) {
        console.error("Failed to send notification: env vars NTFY_BASE_URL, NTFY_TOKEN, NTFY_TOPIC_USER must be set");
        return { content: [{ type: "text", text: "Failed to send notification" }] };
      }

      const req: RequestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.NTFY_TOKEN}`,
        },
        body: JSON.stringify({
          "topic": env.NTFY_TOPIC_USER,
          "title": args.title,
          "message": args.message,
          "priority": args.priority,
          "click": args.click,
          "markdown": args.markdown,
        }),
      };

      let retries = 3;
      while (true) {
        const res = await fetch(env.NTFY_BASE_URL, req);
        if (res.ok) {
          return { content: [{ type: "text", text: "OK" }] };
        }
        if (retries < 1) {
          console.error(`Failed to send notification (status ${res.statusText})`);
          return { content: [{ type: "text", text: "Failed to send notification" }] };
        }
        retries--;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  );

  if (!checkEnv(env)) {
    sendNotificationTool.disable();
  }

  return {
    tools: [
      sendNotificationTool,
    ],
    resources: [],
    resourceTemplates: [],
    prompts: [],
  };
};
