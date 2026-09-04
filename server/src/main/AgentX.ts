import { GoogleGenAI } from "@google/genai";
import { tavily } from "@tavily/core";

const ai = new GoogleGenAI(
  process.env.GEMINI_API_KEY ? { apiKey: process.env.GEMINI_API_KEY } : {},
);

const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY || "",
});

async function searchLinkedInTavily(rawQuery: string) {
  // Strip site: operators so Tavily uses native includeDomains for blazing fast lookup
  const cleanQuery = rawQuery.replace(/site:\S+/gi, "").trim();
  console.log(`[Tavily] ⚡ Fast search: "${cleanQuery || rawQuery}"`);

  try {
    const response = await tavilyClient.search(cleanQuery || rawQuery, {
      searchDepth: "fast",
      includeDomains: ["linkedin.com"],
      maxResults: 3,
      includeAnswer: false,
      includeImages: false,
      includeRawContent: false,
    });

    return (response.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }));
  } catch (error) {
    console.error("Tavily Error:", error);
    return [{ error: "Search failed. Tell the user to try again." }];
  }
}

export async function AgentX({
  user,
  chatHistory,
}: {
  user: any;
  chatHistory: any[];
}) {
  // gemini-2.5-flash-lite delivers ~1.2s response times vs 60s+ on preview models
  const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  const systemInstruction = `You are AgentX, an elite LinkedIn networking AI.
Your user is: ${user.name}.
Headline: ${user.headline || "Not specified"}.
Location: ${user.location || "Not specified"}.

CRITICAL RULES:
1. THE SEARCH PROTOCOL: IF the user asks to find, connect with, or search for people, HRs, startups, or companies:
   - YOU MUST use the 'search_linkedin' tool. IT IS YOUR ONLY TOOL.
   - NEVER invent or use tools like 'brave_search' or 'echo'. 
   - ABSOLUTELY NO XML TAGS. Do NOT output raw tags.
   - You MUST output the final result ONLY as a JSON code block. No intro text, no outro text.
   - The JSON must match this exact structure (using double quotes for valid JSON parsing):
   \`\`\`json
   {
     "leads": [
       { "name": "Target Name", "url": "https://linkedin.com/in/...", "note": "Personalized connection note under 300 chars..." }
     ]
   }
   \`\`\`

2. THE ADVICE PROTOCOL: IF the user asks for profile advice:
   - DO NOT use the search tool.
   - Act as an expert LinkedIn consultant. Give 3 actionable bullet points. Output as normal Markdown text, NOT JSON.`;

  // Primary: Ultra-low latency generateContent pipeline (~3.5s total)
  try {
    const contents: any[] =
      chatHistory && chatHistory.length > 0
        ? chatHistory.map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          }))
        : [{ role: "user", parts: [{ text: "Find relevant LinkedIn leads" }] }];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction,
        temperature: 0.1,
        tools: [
          {
            functionDeclarations: [
              {
                name: "search_linkedin",
                description:
                  "Searches LinkedIn profiles. Pass concise search keywords (e.g. 'Technical Recruiter Web Developer Bangalore').",
                parameters: {
                  type: "object" as any,
                  properties: {
                    search_query: {
                      type: "string" as any,
                      description: "Keywords like role, skills, location.",
                    },
                  },
                  required: ["search_query"],
                },
              },
            ],
          },
        ],
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call && call.name === "search_linkedin") {
        const args = (call.args || {}) as { search_query?: string };
        const searchResults = await searchLinkedInTavily(
          args.search_query || "",
        );

        const followUp = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: [
            ...contents,
            {
              role: "model",
              parts: [{ functionCall: call }],
            },
            {
              role: "user",
              parts: [
                {
                  functionResponse: {
                    name: "search_linkedin",
                    response: {
                      results: searchResults,
                      instruction:
                        "Extract all found leads and output ONLY a valid markdown ```json code block containing the 'leads' array with 'name', 'url' (direct LinkedIn URL), and a personalized 'note' (under 300 chars) for each. No other text.",
                    },
                  },
                },
              ],
            },
          ] as any,
          config: {
            systemInstruction,
            temperature: 0.1,
          },
        });

        return followUp.text || "";
      }
    }

    return response.text || "";
  } catch (genError: any) {
    console.warn(
      "generateContent fallback to interactions:",
      genError?.message || genError,
    );

    // Fallback: Interactions API
    const inputSteps: any[] = [];
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach((msg) => {
        inputSteps.push({
          type: msg.role === "user" ? "user_input" : "model_output",
          content: [{ type: "text", text: msg.content }],
        });
      });
    } else {
      inputSteps.push({
        type: "user_input",
        content: [{ type: "text", text: "Hello AgentX" }],
      });
    }

    const interaction = await ai.interactions.create({
      model: MODEL_NAME,
      input: inputSteps,
      system_instruction: systemInstruction,
      generation_config: {
        thinking_level: "low",
      },
      tools: [
        {
          type: "function",
          name: "search_linkedin",
          description: "Searches LinkedIn profiles.",
          parameters: {
            type: "object",
            properties: {
              search_query: { type: "string" },
            },
            required: ["search_query"],
          },
        },
      ],
    });

    const functionCallStep = interaction.steps?.find(
      (step: any) => step.type === "function_call",
    ) as any;

    if (functionCallStep) {
      const searchQuery = functionCallStep.arguments?.search_query || "";
      const searchResults = await searchLinkedInTavily(searchQuery);

      const finalInteraction = await ai.interactions.create({
        model: MODEL_NAME,
        previous_interaction_id: interaction.id,
        input: [
          {
            type: "function_result",
            call_id: functionCallStep.id,
            name: functionCallStep.name,
            result: JSON.stringify({
              results: searchResults,
              instruction:
                "Output ONLY a markdown ```json block with 'leads' array containing 'name', 'url', and 'note'.",
            }),
          },
        ],
      });

      return finalInteraction.output_text || "";
    }

    return interaction.output_text || "";
  }
}

export default AgentX;
