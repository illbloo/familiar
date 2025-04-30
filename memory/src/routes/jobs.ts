import { Hono } from "hono";
import { createAllObservationEmbeddings } from "../memory/memory";

const app = new Hono()
  .post("/memory_embeddings", async (c) => {
    createAllObservationEmbeddings();
    return c.json({ message: "Accepted" }, 202);
  });

export default app;
