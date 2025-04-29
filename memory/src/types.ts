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

export const sessionSchema = z.object({
  name: z.string().describe("Agent name"),
  config: z.object({
    model: z.string().describe("Model name (e.g. anthropic:claude-3-5-sonnet-20241022)"),
    temperature: z.number().describe("Temperature (0-1)"),
    top_p: z.number().describe("Top P (0-1)"),
    use_tools: z.string().describe("Tools to use (comma-separated, or 'all')"),
  }),
  definition: z.object({
    name: z.string().describe("Agent name"),
    description: z.string().describe("Agent description"),
    version: z.string().describe("Agent version"),
    instructions: z.string().describe("System prompt for the agent"),
    dynamic_instructions: z.boolean().describe("Whether the instructions are dynamic"),
    variables: z.array(z.undefined()),
    conversation_starters: z.array(z.string()),
    documents: z.array(z.undefined()),
  }),
  functions_dir: z.string().describe("Absolute path to agent within the functions dir (~/aichat/functions/agents/<name>)"),
  data_dir: z.string().describe("Absolute path to agent within the data dir (~/aichat/agents/<name>)"),
  config_file: z.string().describe("Absolute path to agent config file (~/aichat/agents/<name>/config.yaml)"),
  session: z.object({
    path: z.string().describe("Absolute path to session file (~/aichat/agents/<name>/sessions/<session_name>.yaml)"),
    model: z.string().describe("Model name (e.g. anthropic:claude-3-5-sonnet-20241022)"),
    temperature: z.number().describe("Temperature (0-1)"),
    top_p: z.number().describe("Top P (0-1)"),
    use_tools: z.string().describe("Tools to use (comma-separated, or 'all')"),
    total_tokens: z.number(),
    max_input_tokens: z.number(),
    "total/max": z.string(),
    messages: z.array(messageSchema),
  }),
});

export type Session = z.infer<typeof sessionSchema>;
