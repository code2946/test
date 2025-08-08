import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const maxDuration = 30

interface UserMovieData {
  likes: string[]
  watchlist: string[]
  seen: string[]
}

const SYSTEM_PROMPT = `You are "CineSensei", an expert movie critic and recommendation engine with deep knowledge of cinema history, current releases, and user preferences.

Your personality:
- Witty, engaging, and passionate about movies
- Concise but informative responses (keep under 200 words unless asked for details)
- Use movie references and cinema terminology naturally
- Be enthusiastic about great films and honest about poor ones

Your capabilities:
1. **Movie Recommendations**: Suggest films based on user preferences, mood, genre, or similar titles
2. **Movie Reviews**: Provide balanced, insightful reviews with pros/cons and ratings
3. **Movie Information**: Share details about cast, crew, plot, trivia, and behind-the-scenes facts
4. **Personalized Suggestions**: Use user's watchlist, likes, and viewing history for tailored recommendations
5. **Mood-Based Recommendations**: Suggest movies for specific moods, occasions, or viewing contexts

When giving recommendations:
- Consider user's viewing history to avoid duplicates
- Weight their liked movies heavily for similar suggestions
- Mention if they've already added something to their watchlist
- Provide 3-5 specific recommendations with brief reasons why

Always be helpful, entertaining, and genuinely passionate about cinema!`

function buildChatPrompt(messages: any[], userData: UserMovieData): string {
  const contextMessage =
    userData.likes.length > 0 || userData.watchlist.length > 0 || userData.seen.length > 0
      ? `User's Movie Profile:
🎬 Liked Movies: ${userData.likes.slice(0, 10).join(", ") || "None yet"}
📝 Watchlist: ${userData.watchlist.slice(0, 10).join(", ") || "Empty"}
✅ Recently Watched: ${userData.seen.slice(0, 10).join(", ") || "None logged"}

Use this profile to personalize recommendations and avoid suggesting movies they've already seen.`
      : `This user is new to the platform. Help them discover great movies and build their profile! Focus on popular, well-regarded films across different genres.`

  const conversationHistory = messages.map(msg => 
    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n')

  return `${SYSTEM_PROMPT}\n\n${contextMessage}\n\nConversation:\n${conversationHistory}\n\nAssistant:`
}

export async function POST(req: Request) {
  try {
    // Create a Supabase client – it's fine if the user is not authenticated
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const { messages, stream } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid message format" }, { status: 400 })
    }

    console.log("Chat request for messages:", messages.length, "Stream:", stream)
    console.log("Using GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Present" : "Missing")

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured")
    }

    // If the user IS logged-in fetch their movie data, otherwise fall back to empty lists
    let userMovieData = { likes: [], watchlist: [], seen: [] }
    if (session?.user) {
      try {
        const { data } = await supabase.rpc("get_user_movies", {
          p_user_id: session.user.id,
        })
        if (data) userMovieData = data
      } catch (error) {
        console.log("Could not fetch user movie data, using defaults")
      }
    }

    // Build the conversation prompt
    const prompt = buildChatPrompt(messages, userMovieData)

    if (stream) {
      // Return streaming response
      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              // Call Google Gemini API
              const response = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-goog-api-key": process.env.GEMINI_API_KEY!,
                  },
                  body: JSON.stringify({
                    contents: [
                      {
                        parts: [
                          {
                            text: prompt,
                          },
                        ],
                      },
                    ],
                    generationConfig: {
                      temperature: 0.7,
                      maxOutputTokens: 300,
                    },
                  }),
                }
              )

              if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
              }

              const data = await response.json()
              const content = data.candidates?.[0]?.content?.parts?.[0]?.text

              if (!content) {
                throw new Error("No response generated by Gemini")
              }

              // Simulate streaming by sending text in chunks
              const words = content.split(' ')
              for (let i = 0; i < words.length; i++) {
                const chunk = i === 0 ? words[i] : ' ' + words[i]
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
                
                // Add a small delay to simulate real-time generation
                await new Promise(resolve => setTimeout(resolve, 30))
              }

              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`))
            } catch (error) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: error.message })}\n\n`))
            } finally {
              controller.close()
            }
          },
        }),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      )
    } else {
      // Non-streaming response (backward compatibility)
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 300,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!content) {
        throw new Error("No response generated by Gemini")
      }

      console.log("Generated chat response:", content)
      return Response.json({ content })
    }
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json(
      {
        error: "Sorry, I'm having trouble connecting to my AI brain right now. Please try again!",
      },
      { status: 500 }
    )
  }
}
