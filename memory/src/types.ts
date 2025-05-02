import { z } from "zod";

// Tentative Tool Result Schema (based on existing content object)
// NOTE: The structure for actual tool *calls* (from assistant) and tool *results* (role=tool)
// needs confirmation based on Rust serialization.
const toolResultSchema = z.object({
  call: z.object({
    name: z.string().describe("Tool name"),
    arguments: z.record(z.any()).describe("Tool arguments"),
  }),
  output: z.string().or(z.array(z.record(z.any())).or(z.record(z.any()))).describe("Tool output"),
});

// Improved Message Schema (Still needs verification against Rust serialization)
export const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]).describe("Message role"),
  // Content needs verification: How are text, tool_calls, and tool_results (for role=tool) serialized?
  // This structure allows string, null, or an object (potentially for assistant responses combining text/results).
  content: z.union([
    z.string(),
    z.object({
      // Assuming tool_results might appear within an assistant's content object
      tool_results: z.array(toolResultSchema).optional().describe("Results of tool calls, possibly in assistant message"),
      text: z.string().optional().describe("Text content, potentially alongside tool results"),
    }).nullable(), // Allow content to be null (e.g., assistant message initiating tool_calls)
  ]).describe("Message content (string, object, or null)"),
  // TODO: Confirm how tool *calls* requested by the assistant are serialized.
  // It might be a top-level field like this:
  // tool_calls: z.array(toolCallSchema).optional(),
});

export type Message = z.infer<typeof messageSchema>;

const modelNameSchema = z.string().describe("Model name (e.g. anthropic:claude-3-5-sonnet-20241022)");

export const sessionConfigSchema = z.object({
  model: modelNameSchema,
  temperature: z.number().optional().describe("Temperature (0-1)"), // Made optional
  top_p: z.number().optional().describe("Top P (0-1)"), // Made optional
  use_tools: z.string().optional().describe("Tools to use (comma-separated, or 'all')"), // Made optional
});

export type SessionConfig = z.infer<typeof sessionConfigSchema>;

export const sessionSchema = sessionConfigSchema.extend({
  // Fields from Rust Session struct
  save_session: z.boolean().optional().describe("Whether to save the session automatically"), // Added
  compress_threshold: z.number().optional().describe("Token threshold for triggering compression"),
  role_name: z.string().optional().describe("Name of the role/agent applied to the session"), // Added
  agent_variables: z.record(z.any()).optional().describe("Variables used for agent instructions"), // Added (assuming record structure)
  agent_instructions: z.string().optional().describe("Interpolated instructions used for the session"), // Already optional
  data_urls: z.record(z.string()).optional().describe("Map of data URLs used in messages"), // Added

  // Message arrays
  compressed_messages: z.array(messageSchema).optional().describe("Messages compressed into the system prompt"), // Already optional
  messages: z.array(messageSchema).describe("Current message history"),
});

// Type alias for the data structure saved to a session file
export type SavedSessionData = z.infer<typeof sessionSchema>;

// Re-export Session for backward compatibility if needed, but SavedSessionData is more descriptive
export type Session = SavedSessionData;

const absolutePathSchema = z.string();

const agentNameSchema = z.string().describe("Agent name");

export const agentDefinitionSchema = z.object({
  name: agentNameSchema,
  description: z.string().describe("Agent description"),
  version: z.string().describe("Agent version"),
  instructions: z.string().describe("Base system prompt/instructions for the agent"),
  dynamic_instructions: z.boolean().describe("Whether the instructions are dynamic (interpolated)"),
});

export type AgentDefinition = z.infer<typeof agentDefinitionSchema>;

/** Output of `aichat --session <session_name> --info`. */
export const sessionInfoSchema = z.object({
  name: agentNameSchema.describe("Session name (could be generated if unnamed)"), // Corresponds to skipped `name` in Rust Session struct
  config: sessionConfigSchema.describe("Core model configuration"), // Core config part
  definition: agentDefinitionSchema.optional().describe("Agent definition if an agent is active"), // Agent details (optional if no agent)
  functions_dir: absolutePathSchema.describe("Absolute path to agent's functions directory"),
  data_dir: absolutePathSchema.describe("Absolute path to agent's data directory"),
  config_file: absolutePathSchema.describe("Absolute path to agent config file"),
  // Represents the session state itself, omitting fields already covered or internal
  session: sessionSchema.omit({
    // Fields omitted because they are handled elsewhere in the --info output,
    // represent config defaults, or are internal state.
    compressed_messages: true,  // Summarized elsewhere or too verbose for info
    compress_threshold: true,  // Part of config/defaults
    agent_instructions: true,  // In definition.instructions (or derived)
    agent_variables: true,     // Internal state, not typically shown in info
    role_name: true,           // Implied by definition.name or lack thereof
    save_session: true,        // Config setting
    // Keep model, temperature, top_p, use_tools (from configSchema via extend)
    // Keep messages (often useful in info)
    // Keep data_urls (might be relevant)
  }).extend({
    // Add fields specific to the --info output context
    path: absolutePathSchema.optional().describe("Absolute path to session file"), // Corresponds to skipped `path`
    total_tokens: z.number().describe("Calculated total tokens for current messages"), // Calculated value
  }),
});

/** Output of `aichat --session <session_name> --info`. */
// Keeping SessionInfo name as per the original comment for now.
export type SessionInfo = z.infer<typeof sessionInfoSchema>;
