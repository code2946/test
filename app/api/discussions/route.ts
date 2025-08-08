import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET /api/discussions - Get discussions for a movie
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get("movieId")
    const sortBy = searchParams.get("sortBy") || "newest"

    if (!movieId) {
      return NextResponse.json({ error: "Movie ID is required" }, { status: 400 })
    }

    // Get root-level discussions
    const { data: discussions, error } = await supabase
      .from("discussions")
      .select("*")
      .eq("movie_id", movieId)
      .is("parent_id", null)
      .order("created_at", { ascending: sortBy === "oldest" })

    if (error) {
      console.error("Error fetching discussions:", error)
      return NextResponse.json({ error: "Failed to fetch discussions" }, { status: 500 })
    }

    // For each root discussion, get its replies recursively
    const discussionsWithReplies = await Promise.all(
      discussions?.map(async (discussion) => {
        const replies = await getReplies(discussion.id)
        return {
          ...discussion,
          replies
        }
      }) || []
    )

    return NextResponse.json({ discussions: discussionsWithReplies })
  } catch (error) {
    console.error("Error in GET /api/discussions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/discussions - Create a new discussion or reply
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { movieId, parentId, content, userId } = body

    if (!movieId || !content || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: discussion, error } = await supabase
      .from("discussions")
      .insert({
        movie_id: movieId,
        parent_id: parentId || null,
        content,
        user_id: userId
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating discussion:", error)
      return NextResponse.json({ error: "Failed to create discussion" }, { status: 500 })
    }

    return NextResponse.json({ discussion })
  } catch (error) {
    console.error("Error in POST /api/discussions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to recursively get replies
async function getReplies(parentId: string): Promise<any[]> {
  const { data: replies, error } = await supabase
    .from("discussions")
    .select("*")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: true })

  if (error || !replies) {
    return []
  }

  // Get nested replies for each reply
  const repliesWithNested = await Promise.all(
    replies.map(async (reply) => {
      const nestedReplies = await getReplies(reply.id)
      return {
        ...reply,
        replies: nestedReplies
      }
    })
  )

  return repliesWithNested
}