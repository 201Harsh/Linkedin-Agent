import "./src/config/dotenv.js";
import { GoogleGenAI } from "@google/genai";
import { tavily } from "@tavily/core";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const tv = tavily({ apiKey: process.env.TAVILY_API_KEY });

async function benchmark() {
  const t0 = Date.now();
  console.log("Starting benchmark with gemini-2.5-flash-lite...");

  const call1 = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: "Find 2 Web Dev HRs in Bangalore",
    config: {
      tools: [
        {
          functionDeclarations: [
            {
              name: "search_linkedin",
              description: "search",
              parameters: {
                type: "object" as any,
                properties: { search_query: { type: "string" as any } },
                required: ["search_query"],
              },
            },
          ],
        },
      ],
    },
  });

  const fc = call1.functionCalls?.[0];
  console.log(`1. Gemini Tool Call: ${Date.now() - t0} ms -> query:`, fc?.args);

  const t1 = Date.now();
  const rawQ = (fc?.args as any)?.search_query || "Web Dev HR Bangalore";
  const cleanQ = rawQ.replace(/site:\S+/gi, "").trim() || rawQ;

  const searchRes = await tv.search(cleanQ, {
    searchDepth: "fast",
    includeDomains: ["linkedin.com"],
    maxResults: 3,
  });
  console.log(`2. Tavily Search: ${Date.now() - t1} ms -> count:`, searchRes.results?.length);

  const t2 = Date.now();
  const finalRes = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [
      { role: "user", parts: [{ text: "Find 2 Web Dev HRs in Bangalore" }] },
      { role: "model", parts: [{ functionCall: fc }] },
      {
        role: "user",
        parts: [
          {
            functionResponse: {
              name: "search_linkedin",
              response: {
                results: searchRes.results,
                instruction:
                  "Output ONLY a markdown JSON code block matching: ```json\n{\n  \"leads\": [\n    { \"name\": \"...\", \"url\": \"https://linkedin.com/in/...\", \"note\": \"...\" }\n  ]\n}\n```. No other text.",
              },
            },
          },
        ],
      },
    ] as any,
  });

  console.log(`3. Gemini Final Response: ${Date.now() - t2} ms`);
  console.log(`TOTAL PIPELINE TIME: ${Date.now() - t0} ms`);
  console.log("FINAL OUTPUT:\n", finalRes.text);
}

benchmark().catch(console.error);
