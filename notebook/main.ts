import dotenv from "dotenv";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { $ } from "bun";
import { appendFile } from "fs/promises";

// Configuration
dotenv.config();

const NOTEBOOK_NAME = process.env.NOTEBOOK_NAME || "familiar";
const LOG_PATH = Bun.pathToFileURL("./notebook.log");

const log = async (text: string) => undefined; //appendFile(LOG_PATH, `${new Date().toISOString()} ${text}\n`);

async function main() {
  // check if nb is installed
  if ((await Bun.spawn(["nb", "--version"]).exited) !== 0) {
    throw new Error("nb is not installed");
  }

  const mcp = new McpServer({
    name: "notebook",
    version: "1.0.0",
  });

  mcp.tool(
    "notebook_note_show",
    "Read a note from your notebook",
    {
      id: z.number().describe("The ID of the note to read"),
    },
    async ({ id }) => {
      try {
        const data = await getNoteData(id);

        return {
          content: [{
            type: "text",
            text: JSON.stringify(data),
          }],
        };
      } catch (error) {
        console.error(error);
        return { content: [{ type: "text", text: "Failed to show note" }] };
      }
    }
  )

  mcp.tool(
    "notebook_notes_list",
    "List all notes in your notebook",
    async () => {
      const cmd: string[] = ["nb", `${NOTEBOOK_NAME}:list`, "--no-color"];
      const ps = Bun.spawn({
        cmd,
        stdio: ["ignore", "pipe", "inherit"],
      });
      const exitCode = await ps.exited;
      if (exitCode !== 0) {
        return { content: [{ type: "text", text: "Failed to list notes" }] };
      }

      const text = await new Response(ps.stdout).text();
      log(`[info] notebook_notes_list results: ${text}`);
      const lines = text.trim().split('\n');
      const results: Note[] = [];
      // Example line: [familiar:3] Important Information
      // New Regex: Match notebook name, ID, and title
      const regex = /^\[([^:]+):(\d+)\]\s+(.*)$/;

      for (const line of lines) {
        const match = line.match(regex);
        if (match) {
          // Destructure notebook, idStr, and title from the match
          const [, notebook, idStr, title] = match;
          if (notebook && idStr && title !== undefined) {
            results.push({
              id: parseInt(idStr, 10),
              // filename is not available in list output
              title: title.trim(),
            });
          }
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify(results),
        }],
      };
    },
  );

  mcp.tool(
    "notebook_add_note",
    "Add a new note to your notebook",
    {
      title: z.string().describe("The title for the new note"),
      content: z.string().describe("The content for the new note (markdown format)"),
      tags: z.array(z.string()).default([]).describe("Add tags to the new note"),
    },
    async ({ title, content, tags }) => {
      const cmd: string[] = ["nb", `${NOTEBOOK_NAME}:add`];
      if (tags.length > 0) cmd.push("--tags", tags.join(","));
      cmd.push("--title", title, "--content", content);

      const ps = Bun.spawn({
        cmd,
        stdio: ["ignore", "pipe", "inherit"],
      });

      const exitCode = await ps.exited;
      if (exitCode !== 0) {
        return { content: [{ type: "text", text: "Failed to add note" }] };
      }
      return { content: [{ type: "text", text: "Note added successfully" }] };
    },
  );

  mcp.tool(
    "notebook_search",
    "Perform a full-text search of your notes.",
    {
      query: z.string()
        .describe("The query to search for"),
      not: z.array(z.string().describe("Exclude items matching this term")).default([])
        .describe("Add a NOT query for items to exclude"),
      and: z.array(z.string().describe("Include items matching this term")).default([])
        .describe("Include items matching this term"),
      or: z.array(z.string().describe("Include items matching this term")).default([])
        .describe("Add an OR query for items to include"),
      tags: z.array(z.string()).default([])
        .describe("Include notes matching specific tags"),
    },
    async ({ query, not, and, or, tags }) => {
      const cmd: string[] = [
        "nb",
        `${NOTEBOOK_NAME}:search`,
        "-l",
        "--no-color",
        query
      ];
      if (and.length) cmd.push(...and.flatMap((a) => ["--and", a]));
      if (or.length) cmd.push(...or.flatMap((o) => ["--or", o]));
      if (not.length) cmd.push(...not.flatMap((n) => ["--not", n]));
      if (tags.length) cmd.push("--tags", tags.join(","));

      const ps = Bun.spawn({
        cmd,
        stdio: ["ignore", "pipe", "inherit"],
      });
      const exitCode = await ps.exited;
      if (exitCode !== 0) {
        return { content: [{ type: "text", text: "Failed to search notes" }] };
      }

      const text = await new Response(ps.stdout).text();
      log(`[info] notebook_search results: ${text}`);
      const lines = text.trim().split('\n');
      const results: Note[] = [];
      // Example line: [familiar:4] hi
      // Use the same updated regex as in list
      const regex = /^\[([^:]+):(\d+)\]\s+(.*)$/;

      for (const line of lines) {
        const match = line.match(regex);
        if (match) {
          // Destructure notebook, idStr, and title
          const [, notebook, idStr, title] = match;
          if (notebook && idStr && title !== undefined) {
            results.push({
              id: parseInt(idStr, 10),
              // filename is not available in search output
              title: title.trim(), // Trim title here too
            });
          }
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify(results),
        }],
      };
    },
  );

  // Connect to transport
  const transport = new StdioServerTransport();
  await mcp.connect(transport);
}

async function getNoteInfo(id: number): Promise<NoteInfo> {
  const output = (await $`nb ${NOTEBOOK_NAME}:show --print --info-line --no-color ${id}`.text()).trim();
  const match = output.match(/^\[[^:]+:\d+\]\s+(\S+)\s+\"(.*)\"$/);
  if (!match) {
    log(`---Regex failed to match on: [${output}]---`);
    throw new Error("Could not parse --info output");
  }
  return {
    filename: match[1]?.trim() ?? "",
    title: match[2]?.trim() ?? "",
  };
}

async function getNoteUpdated(id: number): Promise<Date> {
  return new Date((await $`nb ${NOTEBOOK_NAME}:show --print --updated ${id}`.text()).trim());
}

async function getNoteContent(id: number): Promise<string> {
  return (await $`nb ${NOTEBOOK_NAME}:show --print --no-color ${id}`.text()).trim();
}

async function getNoteData(id: number): Promise<NoteData> {
  const [{ filename, title }, updated, content] = await Promise.all([
    getNoteInfo(id),
    getNoteUpdated(id),
    getNoteContent(id),
  ]);
  
  return { id, filename, title, updated, content };
}

main();

export interface Note {
  id: number;
  filename?: string; // Make filename optional
  title: string;
}

export interface NoteInfo {
  filename: string;
  title: string;
}

export interface NoteData {
  id: number;
  filename: string;
  title: string;
  updated: Date;
  content: string;
}