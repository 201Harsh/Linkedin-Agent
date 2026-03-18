import Groq from "groq-sdk";
import axios from "axios";

// Automatically picks up process.env.GROQ_API_KEY
const groq = new Groq();

// --- TAVILY SEARCH HELPER ---
async function searchLinkedInTavily(query: string) {
  console.log(`[Tavily] Executing search: ${query}`);
  try {
    const response = await axios.post("https://api.tavily.com/search", {
      api_key: process.env.TAVILY_API_KEY,
      query: query,
      search_depth: "basic",
      max_results: 3, // Keep this low for fast MVP testing
    });
    
    // We only return the URL and content to save context window space
    return response.data.results.map((r: any) => ({
      url: r.url,
      content: r.content,
    }));
  } catch (error) {
    console.error("Tavily Error:", error);
    return [{ error: "Search failed. Tell the user to try again." }];
  }
}

// --- THE MAIN AGENT FUNCTION ---
export async function AgentX({ prompt, user }: { prompt: string; user: any }) {
  const MODEL_NAME = "llama-3.3-70b-versatile";

  // 1. Give the Agent Context about YOU and STRICT Rules
  const messages: any[] = [
    {
      role: "system",
      content: `You are AgentX, an elite LinkedIn networking AI.
Your user is: ${user.name}.
Headline: ${user.headline || "Not specified"}.
Location: ${user.location || "Not specified"}.

CRITICAL RULES:
1. THE SEARCH PROTOCOL: IF the user asks to find, connect with, or search for people/leads/HRs:
   - YOU MUST use the 'search_linkedin' tool to generate a Google Dork query (e.g., site:linkedin.com/in/ "Job Title" AND "Location").
   - Format your response as a numbered list.
   - For EACH person, provide their Name, a clickable Markdown link to their profile, and a personalized connection note. 
   - FORMAT EXAMPLE: "1. **[John Doe](https://linkedin.com/in/johndoe)** - Hi John, saw your work in AI..."

2. THE ADVICE PROTOCOL: IF the user asks for profile advice (e.g., "Optimize my bio", "How is my headline?"):
   - DO NOT use the search tool.
   - Act as an expert LinkedIn consultant. Give them 3 bullet points of highly specific, actionable advice based on their current Headline and Location.

3. NEVER attempt to use a tool named 'echo' or anything other than 'search_linkedin'.`,
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  // 2. Initial Call
  const completion = await groq.chat.completions.create({
    model: MODEL_NAME,
    messages: messages,
    tools: [
      {
        type: "function",
        function: {
          name: "search_linkedin",
          description: "Searches the web for LinkedIn profiles. ONLY use when user asks to find people.",
          parameters: {
            type: "object",
            properties: {
              search_query: {
                type: "string",
                description: 'The exact Google Dork query. Format: site:linkedin.com/in/ "Job" AND "Location"',
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

  // 3. Tool Execution
  if (responseMessage?.tool_calls) {
    messages.push(responseMessage);

    for (const toolCall of responseMessage.tool_calls) {
      if (toolCall.function.name === "search_linkedin") {
        const args = JSON.parse(toolCall.function.arguments);
        
        // Execute the actual Tavily API call
        const searchResults = await searchLinkedInTavily(args.search_query);

        // Feed the results BACK to Groq
        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: "search_linkedin",
          content: JSON.stringify(searchResults),
        });
      }
    }

    // 4. Second Call: Groq reads the search results and writes the notes
    const finalCompletion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: messages,
    });

    return finalCompletion.choices[0]?.message?.content || "";
  }

  return responseMessage?.content || "";
}

export default AgentX;