import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import OpenAI from "openai";
import { createMiddleware } from "hono/factory";
import { batch, sampleParamsSchema } from "./sampler";

type Env = {
	OPENROUTER_API_KEY: string,
	FAMILIAR_API_KEY: string,
}

type HonoEnv = {
	Bindings: Env,
	Variables: {
		"openrouter": OpenAI,
	},
}

const app = new Hono<HonoEnv>()
	.use("*", async (c, next) => {
		if (c.req.header("X-Familiar-API-Key") !== c.env.FAMILIAR_API_KEY) {
			return c.json({ error: "Unauthorized" }, 401);
		}
		return next();
	})
	.use("*", createMiddleware<HonoEnv>(async (c, next) => {
		c.set("openrouter", new OpenAI({
			baseURL: "https://openrouter.ai/api/v1",
			apiKey: c.env.OPENROUTER_API_KEY,
		}));
		await next();
	}))
	.post(
		"/sample",
		zValidator("json", sampleParamsSchema.omit({ model: true }).transform((data) => ({ ...data, model: 'meta-llama/llama-3.1-405b' }))),
		async (c) => {
			const args = c.req.valid('json');
			const llm = c.get('openrouter');
			const samples: string[] = [];

			await batch({
				input: args.input,
				model: 'meta-llama/llama-3.1-405b',
				maxTokens: args.maxTokens,
				temperature: args.temperature,
				count: args.count,
				openai: llm,
				onChunk: (chunk) => {
					const choice = chunk.choices[0];
					if (choice.text.length && !samples.includes(choice.text)) {
						samples.push(choice.text);
					}
				},
			});

			return c.json(samples);
		}
	);

export default app;
export type App = typeof app;
