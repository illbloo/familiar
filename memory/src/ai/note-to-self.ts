import type OpenAI from "openai";
import { zodFunction } from "openai/helpers/zod.mjs";
import z from "zod";
import claude from "./providers/anthropic";

export const noteToSelfSchema = z.object({
  noteToSelf: z.string().describe("a note to yourself that will be included in your system prompt before our next chat"),
});

export type NoteToSelf = z.infer<typeof noteToSelfSchema>;

export const createNoteToSelf = async ({ systemPrompt, summaries }: { systemPrompt: string, summaries: string[] }): Promise<NoteToSelf> => {
  let content = "";
  for (const summary of summaries) {
    content += `
<recent_chat_summary>
${summary}
</recent_chat_summary>
`;
  }

  const body = {
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.1,
    tools: [zodFunction({
      name: "create_note_to_self",
      description: "create a note to yourself that will be included in your system prompt before our next chat",
      parameters: noteToSelfSchema,
    })],
    tool_choice: {
      type: "function",
      function: {
        name: "create_note_to_self",
      },
    },
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `
${content}
<instructions>
hi familiar !! this is an automated message :3

ive given u some summaries you wrote about recent chats we've had. based off of these, could u write a note to yourself that will be included in ur system prompt before our next chat?
</instructions>
`,
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
      const result = noteToSelfSchema.safeParse(JSON.parse(tool_call.function.arguments ?? "{}"));
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