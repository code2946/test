import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET /api/discussions/test - Test if discussions table exists and is accessible
export async function GET(request: NextRequest) {
  try {
    console.log("Testing discussions API...")

    // Test 1: Check if discussions table exists
    const { data: discussions, error: discussionsError } = await supabase
      .from("discussions")
      .select("*")
      .limit(1)

    if (discussionsError) {
      console.error("Discussions table error:", discussionsError)
      return NextResponse.json({ 
        error: "Discussions table not accessible", 
        details: discussionsError,
        step: "checking_discussions_table"
      }, { status: 500 })
    }

    // Test 2: Check if discussion_reactions table exists
    const { data: reactions, error: reactionsError } = await supabase
      .from("discussion_reactions")
      .select("*")
      .limit(1)

    if (reactionsError) {
      console.error("Reactions table error:", reactionsError)
      return NextResponse.json({ 
        error: "Discussion reactions table not accessible", 
        details: reactionsError,
        step: "checking_reactions_table"
      }, { status: 500 })
    }

    // Test 3: Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    return NextResponse.json({ 
      success: true,
      message: "All tables accessible",
      data: {
        discussionsCount: discussions?.length || 0,
        reactionsCount: reactions?.length || 0,
        hasSession: !!session,
        authError: authError?.message || null
      }
    })

  } catch (error) {
    console.error("Test error:", error)
    return NextResponse.json({ 
      error: "Test failed", 
      details: error instanceof Error ? error.message : "Unknown error",
      step: "general_error"
    }, { status: 500 })
  }
}