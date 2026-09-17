import { reasoning, fast, embedder } from "./models.js";

const r = await reasoning.invoke("Réponds juste OK.");
console.log("reasoning (gpt-5.5):", r.content);

const f = await fast.invoke("Réponds juste OK.");
console.log("fast (gpt-4.1):", f.content);

const e = await embedder.embedQuery("chhal taman");
console.log("embedding dims:", e.length);