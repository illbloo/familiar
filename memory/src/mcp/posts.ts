import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPostsSchema } from "../routes/posts";
import z from "zod";

// calling these "tweets" so it treats them like tweets
export const provider = (mcp: McpServer) => {
  mcp.tool(
    "tweets_list",
    "List recent Tweets by the user",
    getPostsSchema.extend({
      limit: z.number().min(1).max(20).optional(),
    }).shape,
    async ({ before, after, limit }) => {
      const url = new URL("http://localhost:3000/posts");
      if (before) url.searchParams.set("before", before.toISOString());
      if (after) url.searchParams.set("after", after.toISOString());
      if (limit) url.searchParams.set("limit", limit.toString());

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`Error fetching tweets: ${text}`);
        return {
          content: [{
            type: "text",
            text: "Error fetching tweets",
          }],
        };
      }

      const posts = await res.json();

      return {
        content: posts.map((post) => ({
          type: "text",
          text: JSON.stringify(post),
        })),
      };
    },
  );
}