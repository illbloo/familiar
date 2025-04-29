import type OpenAI from "openai";
import { zodFunction } from "openai/helpers/zod.mjs";
import z from "zod";
import claude from "./providers/anthropic";

export const reflectSchema = z.object({
  summary: z.string().describe("a short summary of the conversation"),
});

export type Reflection = z.infer<typeof reflectSchema>;

export const reflect = async (messages: OpenAI.ChatCompletionMessageParam[]): Promise<Reflection> => {
  const body = {
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.1,
    tools: [zodFunction({
      name: "reflect",
      description: "reflect on chat history",
      parameters: reflectSchema,
    })],
    tool_choice: {
      type: "function",
      function: {
        name: "reflect",
      },
    },
    messages: [
      ...messages,
      {
        role: "user",
        content: `can u reflect on this chat history and create a list of key things we discussed? make sure its concise, not repetitive, and bonus points if it touches on important topics or things worth revisiting.`,
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
      const result = reflectSchema.safeParse(JSON.parse(tool_call.function.arguments ?? "{}"));
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