import { z } from "zod";

export const messageSchema = z.object({
  role: z.string().describe("Message role (system, user, assistant)"),
  content: z.string().describe("Message text content").or(z.object({
    tool_results: z.array(z.object({
      call: z.object({
        name: z.string().describe("Tool name"),
        arguments: z.record(z.any()).describe("Tool arguments"),
      }),
      output: z.array(z.record(z.any())).or(z.record(z.any())).describe("Tool output"),
    })),
    text: z.string().describe("Message from assistant"),
    sequence: z.boolean().describe("Whether the message is a sequence"),
  })).describe("Message object content, for tools and other kinds of messages"),
});

export type Message = z.infer<typeof messageSchema>;

const modelNameSchema = z.string().describe("Model name (e.g. anthropic:claude-3-5-sonnet-20241022)");

export const sessionConfigSchema = z.object({
  model: modelNameSchema,
  temperature: z.number().describe("Temperature (0-1)"),
  top_p: z.number().describe("Top P (0-1)"),
  use_tools: z.string().describe("Tools to use (comma-separated, or 'all')"),
});

export type SessionConfig = z.infer<typeof sessionConfigSchema>;

export const sessionSchema = sessionConfigSchema.extend({
  agent_instructions: z.string().optional().describe("System prompt for the agent"),
  compress_threshold: z.number().optional(),
  compressed_messages: z.array(messageSchema).optional(),
  messages: z.array(messageSchema),
});

export type Session = z.infer<typeof sessionSchema>;

const absolutePathSchema = z.string();

const agentNameSchema = z.string().describe("Agent name");

export const agentDefinitionSchema = z.object({
  name: agentNameSchema,
  description: z.string().describe("Agent description"),
  version: z.string().describe("Agent version"),
  instructions: z.string().describe("System prompt for the agent"),
  dynamic_instructions: z.boolean().describe("Whether the instructions are dynamic"),
});

export type AgentDefinition = z.infer<typeof agentDefinitionSchema>;

/** Output of `aichat --session <session_name> --info`. */
export const sessionInfoSchema = z.object({
  name: agentNameSchema,
  config: sessionConfigSchema,
  definition: agentDefinitionSchema,
  functions_dir: absolutePathSchema.describe("Absolute path to agent within the functions dir (~/aichat/functions/agents/<name>)"),
  data_dir: absolutePathSchema.describe("Absolute path to agent within the data dir (~/aichat/agents/<name>)"),
  config_file: absolutePathSchema.describe("Absolute path to agent config file (~/aichat/agents/<name>/config.yaml)"),
  session: sessionSchema.omit({
    compressed_messages: true,
    compress_threshold: true,
    agent_instructions: true, // this is just in system prompt
  }).extend({
    path: absolutePathSchema.describe("Absolute path to session file (~/aichat/agents/<name>/sessions/<session_name>.yaml)"),
    total_tokens: z.number(),
  }),
});

/** Output of `aichat --session <session_name> --export`. */
export type SessionInfo = z.infer<typeof sessionInfoSchema>;
