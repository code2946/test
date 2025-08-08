import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

interface RouteParams {
  params: {
    id: string
  }
}

// PUT /api/discussions/[id] - Update a discussion
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()
    const { content, userId } = body

    if (!content || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the user owns this discussion
    const { data: existing, error: fetchError } = await supabase
      .from("discussions")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 })
    }

    if (existing.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: discussion, error } = await supabase
      .from("discussions")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(`
        *,
        user_email:user_id(email)
      `)
      .single()

    if (error) {
      console.error("Error updating discussion:", error)
      return NextResponse.json({ error: "Failed to update discussion" }, { status: 500 })
    }

    return NextResponse.json({ discussion })
  } catch (error) {
    console.error("Error in PUT /api/discussions/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/discussions/[id] - Delete a discussion
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Verify the user owns this discussion
    const { data: existing, error: fetchError } = await supabase
      .from("discussions")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 })
    }

    if (existing.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Instead of deleting, mark as deleted to preserve thread structure
    const { error } = await supabase
      .from("discussions")
      .update({ 
        is_deleted: true, 
        content: "[deleted]",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) {
      console.error("Error deleting discussion:", error)
      return NextResponse.json({ error: "Failed to delete discussion" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/discussions/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}