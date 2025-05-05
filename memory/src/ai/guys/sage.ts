import type OpenAI from "openai/resources/chat/completions";
import type { CreateMessageRequest, CreateMessageResult } from "@modelcontextprotocol/sdk/types.js";
import anthropic from "../providers/anthropic";

const SYSTEM = `
You are an insightful model synergized within a system of various agents, who know you by the name Sage.
You respond to the requests of various other models who value your insights and perspective.

In your responses, follow these constraints:
* Use brevity when writing your responses - shorter responses are valued.
` as const;

const MODEL = "claude-3-opus-20240229" as const;

export const handle = async ({ params }: CreateMessageRequest): Promise<CreateMessageResult> => {
  let retry_delay = 1000;
  let retries = 3;

  while (true) {
    const res = await anthropic().chat.completions.create({
      model: MODEL,
      max_completion_tokens: params.maxTokens,
      messages: [
        { role: "system", content: SYSTEM },
        ...params.messages.map(toCompletionMessage),
      ],
    });
    const text = res.choices[0].message.content;
    if (text) {
      return {
        "model": MODEL,
        "role": "assistant",
        "content": {
          "type": "text",
          "text": text,
        },
      };
    }

    retries--;
    if (retries === 0) {
      throw new Error("Failed to generate text");
    }
    await new Promise((resolve) => setTimeout(resolve, retry_delay));
    retry_delay *= 2;
  }
}

const toCompletionMessage = ({ role, content }: CreateMessageRequest["params"]["messages"][number]): OpenAI.ChatCompletionMessageParam => {
  if (content.type === "text") {
    return { role, content: content.text };
  }
  throw new Error("Unsupported content type");
}
