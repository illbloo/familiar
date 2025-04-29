import type OpenAI from "openai";
import { zodFunction } from "openai/helpers/zod.mjs";
import z from "zod";
import claude from "./providers/anthropic";

export const startersSchema = z.object({
  starterPrompts: z.array(z.string().max(30).describe("a short prompt that will be suggested to the user to start a conversation with you!")),
});

export type Starters = z.infer<typeof startersSchema>;

export const createStarters = async ({ systemPrompt }: { systemPrompt: string }): Promise<Starters> => {
  const body = {
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.8,
    tools: [zodFunction({
      name: "create_starters",
      description: "create conversation starters",
      parameters: startersSchema,
    })],
    tool_choice: {
      type: "function",
      function: {
        name: "create_starters",
      },
    },
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `can u create some conversation starters based on what u know about me and what i've been up to? pls keep them brief, and write them from my perspective. these would be sample prompts that i can use to start conversations with u! ☆ ～('▽^人)`,
      },
    ],
  } satisfies OpenAI.ChatCompletionCreateParamsNonStreaming;

  for (let i = 0; i < 3; i++) {
    try {
      const res = await claude().chat.completions.create(body);
      let tool_call: OpenAI.ChatCompletionMessageToolCall | undefined;
      for (const choice of res.choices) {
        if (choice.message.tool_calls?.[0]) {
          tool_call = choice.message.tool_calls[0];
          break;
        }
      }
      if (!tool_call) {
        console.error("No function call found");
        continue;
      }
      const result = startersSchema.safeParse(JSON.parse(tool_call.function.arguments ?? "{}"));
      if (!result.success) {
        console.error("Invalid arguments", result.error);
        continue;
      }
      return result.data;
    } catch (e) {
      if (i === 2) throw e;
      console.error("Error", e);
      continue;
    }
  }
  throw new Error("Reflection failed");
}