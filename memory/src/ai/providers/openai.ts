import OpenAI from "openai";

export default new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

export async function createEmbedding(openai: OpenAI, input: string) {
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input,
  });

  return embedding.data[0].embedding;
}
