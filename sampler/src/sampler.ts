import type { OpenAI } from 'openai';
import { z } from 'zod';
import { sleep } from 'bun';

export const sampleParamsSchema = z.object({
  input: z.string(),
  count: z.number().min(1).max(10),
  model: z.string().default('meta-llama/llama-3.1-405b'),
  maxTokens: z.number().min(1).max(30),
  temperature: z.number().min(0).max(1),
});

export type SampleParams = z.infer<typeof sampleParamsSchema>;

type BatchParams = SampleParams & {
  openai: OpenAI,
  onChunk: (chunk: OpenAI.Completions.Completion) => void,
}

export const batch = async ({
  input: prompt,
  model,
  maxTokens: max_tokens,
  temperature,
  openai,
  onChunk,
}: BatchParams): Promise<void> => {
  let wait = 1000; // ms
  const wait_timeout = model.startsWith('gpt-') ? 120_000 : 60_000;
  const maxRetries = [
    'gpt-4-base',
    'gpt-3.5-turbo-instruct',
  ].includes(model) ? 8 : 5;
  const timeout = [
    'gpt-4-base',
    'gpt-3.5-turbo-instruct',
  ].includes(model) ? 120_000 : 60_000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await openai.completions.create({
        prompt,
        model,
        max_tokens,
        temperature,
        top_p: 0.9,
        n: 1,
        stream: true,
        stream_options: {
          include_usage: false,
        },
      }, {
        timeout,
      });

      for await (const chunk of res) {
        onChunk(chunk);
        if (chunk.choices[0]?.finish_reason) {
          return;
        }
      }
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err);
    }

    if (attempt < maxRetries) {
      await sleep(wait);
      wait = Math.min(wait * 2, wait_timeout);
    }
  }
}