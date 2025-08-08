import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// POST /api/discussions/reactions - Add or update a reaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { discussionId, userId, reactionType } = body

    if (!discussionId || !userId || !reactionType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!['like', 'dislike', 'love', 'laugh'].includes(reactionType)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 })
    }

    // Check if user already has a reaction for this discussion
    const { data: existing, error: fetchError } = await supabase
      .from("discussion_reactions")
      .select("id, reaction_type")
      .eq("discussion_id", discussionId)
      .eq("user_id", userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error("Error checking existing reaction:", fetchError)
      return NextResponse.json({ error: "Failed to check existing reaction" }, { status: 500 })
    }

    let result

    if (existing) {
      if (existing.reaction_type === reactionType) {
        // Same reaction - remove it
        const { error: deleteError } = await supabase
          .from("discussion_reactions")
          .delete()
          .eq("id", existing.id)

        if (deleteError) {
          console.error("Error removing reaction:", deleteError)
          return NextResponse.json({ error: "Failed to remove reaction" }, { status: 500 })
        }

        result = { action: "removed", reactionType: null }
      } else {
        // Different reaction - update it
        const { data: reaction, error: updateError } = await supabase
          .from("discussion_reactions")
          .update({ reaction_type: reactionType })
          .eq("id", existing.id)
          .select()
          .single()

        if (updateError) {
          console.error("Error updating reaction:", updateError)
          return NextResponse.json({ error: "Failed to update reaction" }, { status: 500 })
        }

        result = { action: "updated", reaction, reactionType }
      }
    } else {
      // No existing reaction - create new one
      const { data: reaction, error: insertError } = await supabase
        .from("discussion_reactions")
        .insert({
          discussion_id: discussionId,
          user_id: userId,
          reaction_type: reactionType
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error creating reaction:", insertError)
        return NextResponse.json({ error: "Failed to create reaction" }, { status: 500 })
      }

      result = { action: "created", reaction, reactionType }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in POST /api/discussions/reactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/discussions/reactions - Get reactions for discussions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const discussionIds = searchParams.get("discussionIds")?.split(",")
    const userId = searchParams.get("userId")

    if (!discussionIds) {
      return NextResponse.json({ error: "Discussion IDs are required" }, { status: 400 })
    }

    // Get reaction counts for each discussion
    const { data: reactionCounts, error: countsError } = await supabase
      .from("discussion_reactions")
      .select("discussion_id, reaction_type")
      .in("discussion_id", discussionIds)

    if (countsError) {
      console.error("Error fetching reaction counts:", countsError)
      return NextResponse.json({ error: "Failed to fetch reaction counts" }, { status: 500 })
    }

    // Aggregate counts by discussion and reaction type
    const counts = reactionCounts?.reduce((acc, reaction) => {
      const { discussion_id, reaction_type } = reaction
      if (!acc[discussion_id]) {
        acc[discussion_id] = { like: 0, dislike: 0, love: 0, laugh: 0 }
      }
      acc[discussion_id][reaction_type]++
      return acc
    }, {} as Record<string, Record<string, number>>) || {}

    // Get user's reactions if userId provided
    let userReactions = {}
    if (userId) {
      const { data: userReactionData, error: userError } = await supabase
        .from("discussion_reactions")
        .select("discussion_id, reaction_type")
        .eq("user_id", userId)
        .in("discussion_id", discussionIds)

      if (userError) {
        console.error("Error fetching user reactions:", userError)
      } else {
        userReactions = userReactionData?.reduce((acc, reaction) => {
          acc[reaction.discussion_id] = reaction.reaction_type
          return acc
        }, {} as Record<string, string>) || {}
      }
    }

    return NextResponse.json({ counts, userReactions })
  } catch (error) {
    console.error("Error in GET /api/discussions/reactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}