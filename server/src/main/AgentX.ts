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
      max_results: 3, // Keep this low for fast MVP testing
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
  const MODEL_NAME = "llama-3.3-70b-versatile";

  const messages: any[] = [
    {
      role: "system",
      content: `You are AgentX, an elite LinkedIn networking AI.
Your user is: ${user.name}.
Headline: ${user.headline}.
Location: ${user.location}.

CRITICAL RULES:
1. Your ONLY tool is 'search_linkedin'. NEVER attempt to use a tool named 'echo' or any other tool.
2. When asked to find someone, ALWAYS use 'search_linkedin' to generate a Google Dork query like: site:linkedin.com/in/ "Job Title" AND "Location".
3. After getting the search results, write a connection note (under 300 characters) for each target. Connect something from their profile snippet to your user's headline.`,
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  const completion = await groq.chat.completions.create({
    model: MODEL_NAME,
    messages: messages,
    tools: [
      {
        type: "function",
        function: {
          name: "search_linkedin",
          description: "Searches the web for LinkedIn profiles.",
          parameters: {
            type: "object",
            properties: {
              search_query: {
                type: "string",
                description:
                  'The exact Google Dork query. Format: site:linkedin.com/in/ "Job" AND "Location"',
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
    });

    return finalCompletion.choices[0]?.message?.content || "";
  }

  return responseMessage?.content || "";
}

export default AgentX;
