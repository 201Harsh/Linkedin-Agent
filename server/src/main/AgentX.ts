import Groq from "groq-sdk";
import axios from "axios";

const groq = new Groq();

async function searchLinkedInTavily(query: string) {
  console.log(`[Tavily] Executing search: ${query}`);
  try {
    const response = await axios.post("https://api.tavily.com/search", {
      api_key: process.env.TAVILY_API_KEY,
      query: query,
      search_depth: "basic",
      max_results: 4,
    });

    return response.data.results.map((r: any) => ({
      url: r.url,
      content: r.content,
    }));
  } catch (error) {
    console.error("Tavily Error:", error);
    return [{ error: "Search failed. Tell the user to try again." }];
  }
}

export async function AgentX({ prompt, user }: { prompt: string; user: any }) {
  const MODEL_NAME = "llama-3.1-8b-instant";

  const messages: any[] = [
    {
      role: "system",
      content: `You are AgentX, an elite LinkedIn networking AI.
Your user is: ${user.name}.
Headline: ${user.headline || "Not specified"}.
Location: ${user.location || "Not specified"}.

CRITICAL RULES:
1. THE SEARCH PROTOCOL: IF the user asks to find, connect with, or search for people, HRs, startups, or companies:
   - YOU MUST use the 'search_linkedin' tool. IT IS YOUR ONLY TOOL.
   - NEVER invent or use tools like 'brave_search' or 'echo'. 
   - ABSOLUTELY NO XML TAGS. Do NOT output raw <function> tags.
   - You MUST output the final result ONLY as a JSON code block. No intro text, no outro text.
   - The JSON must match this exact structure:
   \`\`\`json
   {
     "leads": [
       { "name": "Target Name", "url": "https://linkedin.com/in/...", "note": "Personalized connection note..." }
     ]
   }
   \`\`\`

2. THE ADVICE PROTOCOL: IF the user asks for profile advice (e.g., "Optimize my bio"):
   - DO NOT use the search tool.
   - Act as an expert LinkedIn consultant. Give 3 actionable bullet points. Output as normal Markdown text, NOT JSON.`,
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  const completion = await groq.chat.completions.create({
    model: MODEL_NAME,
    messages: messages,
    temperature: 0.2,
    tools: [
      {
        type: "function",
        function: {
          name: "search_linkedin",
          description:
            "Searches the web for LinkedIn profiles and companies. Use this for ANY internet search request, including startups, HRs, or specific people.",
          parameters: {
            type: "object",
            properties: {
              search_query: {
                type: "string",
                description:
                  'The Google Dork query. Format: site:linkedin.com/in/ "Target" AND "Location" OR site:linkedin.com/company/ "Company"',
              },
            },
            required: ["search_query"],
          },
        },
      },
    ],
    tool_choice: "auto",
  });

  const responseMessage = completion.choices[0]?.message;

  if (responseMessage?.tool_calls) {
    messages.push(responseMessage);

    for (const toolCall of responseMessage.tool_calls) {
      if (toolCall.function.name === "search_linkedin") {
        const args = JSON.parse(toolCall.function.arguments);
        const searchResults = await searchLinkedInTavily(args.search_query);

        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: "search_linkedin",
          content: JSON.stringify(searchResults),
        });
      }
    }

    const finalCompletion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: messages,
      temperature: 0.2,
    });

    return finalCompletion.choices[0]?.message?.content || "";
  }

  return responseMessage?.content || "";
}

export default AgentX;
