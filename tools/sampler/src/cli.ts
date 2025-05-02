import { Command } from "commander";
import { config as dotenv} from "dotenv";
import OpenAI from "openai";
import { batch } from "./sampler";

async function main() {
  dotenv();

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const cmd = new Command("gen")
    .option('-i, --input <string>', 'The input to sample', await Bun.stdin.text())
    .requiredOption('-c, --count <number>', 'The number of samples to generate', '3')
    .requiredOption('-m, --model <string>', 'The model to use', process.env.SAMPLER_MODEL || 'meta-llama/llama-3.1-405b')
    .requiredOption('-t, --temperature <number>', 'The temperature to use', '0.7')
    .requiredOption('-M, --max-tokens <number>', 'The maximum number of tokens to generate', '30')
    .parse(process.argv);

  const opts = cmd.opts();
  if (opts.input === undefined || opts.input.length === 0) {
    throw new Error('Input is required');
  }

  const llm = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  const samples: string[] = [];

  await batch({
    input: opts.input,
    model: opts.model,
    maxTokens: parseInt(opts.maxTokens),
    temperature: parseFloat(opts.temperature),
    count: parseInt(opts.count),
    openai: llm,
    onChunk: (chunk) => {
      const choice = chunk.choices[0];
      if (choice.text.length && !samples.includes(choice.text)) {
        samples.push(choice.text);
      }
    },
  });

  Bun.stdout.write(JSON.stringify(samples));
}

main();
