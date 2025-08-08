import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Simple discussions API for testing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get("movieId")

    if (!movieId) {
      return NextResponse.json({ error: "Movie ID is required" }, { status: 400 })
    }

    console.log("Fetching discussions for movie:", movieId)

    const { data, error } = await supabase
      .from("discussions")
      .select("*")
      .eq("movie_id", movieId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ 
        error: "Database error", 
        details: error 
      }, { status: 500 })
    }

    console.log("Found discussions:", data?.length || 0)

    return NextResponse.json({ 
      discussions: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { movieId, content, userId, parentId } = body

    console.log("Creating discussion:", { movieId, content: content?.substring(0, 50), userId, parentId })

    if (!movieId || !content || !userId) {
      return NextResponse.json({ 
        error: "Missing required fields",
        received: { movieId: !!movieId, content: !!content, userId: !!userId }
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("discussions")
      .insert({
        movie_id: movieId,
        user_id: userId,
        parent_id: parentId || null,
        content: content.trim()
      })
      .select()
      .single()

    if (error) {
      console.error("Insert error:", error)
      return NextResponse.json({ 
        error: "Failed to create discussion",
        details: error
      }, { status: 500 })
    }

    console.log("Created discussion:", data.id)

    return NextResponse.json({ 
      success: true,
      discussion: data
    })

  } catch (error) {
    console.error("POST error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}