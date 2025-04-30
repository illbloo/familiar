import { client } from "familiar-memory/src/client";

export const create = async (text: string): Promise<{ id: string }> => {
  const res = await client("http://localhost:3000").posts.$post({
    json: { text },
  });

  if (!res.ok) {
    throw new Error(res.statusText);
  }

  return await res.json();
}
