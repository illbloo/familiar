import dotenv from "dotenv";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Configuration
dotenv.config();

async function main() {
  const mcp = new McpServer({
    name: "uithub",
    version: "1.0.0",
  });

  mcp.tool(
    "github_repo_contents",
    "Read an entire GitHub repo's contents into context. Unless otherwise instructed, ensure to always first get the tree only (omitFiles:true) to get an idea of the file structure. Afterwards, use the different filters to get only the context relevant to cater to the user request.",
    {
      owner: z.string().describe("GitHub repository owner"),
      repo: z.string().describe("GitHub repository name"),
      branch: z.string().default("main").describe("Branch name (defaults to main if not provided)"),
      path: z.string().default("").describe("File or directory path within the repository"),
      ext: z.array(z.string()).optional().describe("List of file extensions to include"),
      dir: z.array(z.string()).optional().describe("List of directories to include"),
      excludeExt: z.array(z.string()).optional().describe("List of file extensions to exclude"),
      excludeDir: z.array(z.string()).optional().describe("List of directories to exclude"),
      maxFileSize: z.number().optional().describe("Maximum file size to include (in bytes)"),
      maxTokens: z.number().default(50000).describe("Limit the response to a maximum number of tokens (defaults to 50000)"),
      omitFiles: z.boolean().optional().describe("If true, response will not include the file contents"),
      omitTree: z.boolean().optional().describe("If true, response will not include the directory tree"),
      accept: z.enum([
        "text/markdown",
        "text/yaml",
        "text/html",
        "application/json",
      ]).default("text/markdown").describe("Format of the response"),
    },
    async ({
      owner,
      repo,
      branch = "main",
      path = "",
      ext,
      dir,
      excludeExt,
      excludeDir,
      maxFileSize,
      maxTokens = 50000,
      omitFiles,
      omitTree,
      accept,
    }) => {
      const url = new URL(`${owner}/${repo}/tree/${branch}${path ? `/${path}` : ""}`, "https://uithub.com/");
      if (ext) url.searchParams.append("ext", ext.join(","));
      if (dir) url.searchParams.append("dir", dir.join(","));
      if (excludeExt) url.searchParams.append("exclude-ext", excludeExt.join(","));
      if (excludeDir) url.searchParams.append("exclude-dir", excludeDir.join(","));
      if (maxFileSize) url.searchParams.append("maxFileSize", maxFileSize.toString());
      url.searchParams.append("maxTokens", maxTokens.toString());
      if (omitFiles) url.searchParams.append("omitFiles", "true");
      if (omitTree) url.searchParams.append("omitTree", "true");

      try {
        const res = await fetch(url, {
          headers: { "Accept": accept }
        });
        if (!res.ok) {
          const error = await res.text();
          throw new Error(`API error: ${error}`);
        }
        const responseText = await res.text();
        return {
          content: [{ type: "text", text: responseText }],
          metadata: {},
        };
      } catch (error) {
        console.error("Request error:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)
                }`,
            },
          ],
          metadata: {},
          isError: true,
        };
      }
    },
  );

  // Connect to transport
  console.log("Starting uithub tool...");
  const transport = new StdioServerTransport();
  await mcp.connect(transport);
}

main();