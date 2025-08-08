import { xai } from "@ai-sdk/xai"
import { generateText } from "ai"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { mood, genre, preferences } = await req.json()

    // Get user's movie data
    const { data: userData } = await supabase.rpc("get_user_movies", {
      p_user_id: session.user.id,
    })

    const userContext = userData
      ? `
User's liked movies: ${userData.likes?.join(", ") || "None"}
User's watchlist: ${userData.watchlist?.join(", ") || "Empty"}
Already seen: ${userData.seen?.join(", ") || "None"}
`
      : ""

    const prompt = `Based on this user's profile:
${userContext}

Suggest 5 specific movies for someone who wants ${mood ? `something ${mood}` : `${genre} movies`}${preferences ? ` and prefers ${preferences}` : ""}.

Format your response as a numbered list with movie title, year, and a brief reason why it fits. Avoid movies they've already seen.`

    // Use xAI with grok-3-mini model
    const { text } = await generateText({
      model: xai("grok-3-mini"),
      messages: [
        {
          role: "system",
          content: "You are a movie recommendation expert. Provide specific, personalized suggestions.",
        },
        { role: "user", content: prompt },
      ],
      maxTokens: 500,
      temperature: 0.8,
    })

    return Response.json({ suggestions: text })
  } catch (error) {
    console.error("Movie suggestions API error:", error)
    return Response.json({ error: "Failed to get suggestions" }, { status: 500 })
  }
}
