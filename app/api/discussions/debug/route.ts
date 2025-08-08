import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { supabaseAdmin } from "@/lib/supabase-admin"

// Debug API to test basic functionality
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get("movieId")

    console.log("🔍 Starting debug tests...", { movieId })

    // Test 1: Basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from("discussions")
      .select("count", { count: "exact", head: true })

    if (connectionError) {
      console.error("❌ Connection test failed:", connectionError)
      return NextResponse.json({
        step: "connection_test",
        success: false,
        error: connectionError.message,
        details: connectionError
      })
    }

    console.log("✅ Connection test passed")

    // Test 2: Get discussions for movie (if movieId provided)
    let movieDiscussions = null
    if (movieId) {
      const { data: discussionsData, error: discussionsError } = await supabaseAdmin
        .from("discussions")
        .select("*")
        .eq("movie_id", movieId)
        .order("created_at", { ascending: false })

      if (discussionsError) {
        console.error("❌ Movie discussions query failed:", discussionsError)
      } else {
        // Try to get user info for discussions
        const discussionsWithUserInfo = await Promise.all(
          discussionsData.map(async (discussion) => {
            try {
              const { data: userData } = await supabaseAdmin.auth.admin.getUserById(discussion.user_id)
              return {
                ...discussion,
                user_email: userData?.user?.email || null
              }
            } catch (error) {
              return discussion
            }
          })
        )

        // Build threaded structure
        movieDiscussions = buildThreadedDiscussions(discussionsWithUserInfo || [])
        console.log(`✅ Found ${discussionsData?.length || 0} total discussions for movie ${movieId}`)
        console.log(`✅ Organized into ${movieDiscussions?.length || 0} root threads`)
      }
    }

    // Test 3: Authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    console.log("📋 Test Results:")
    
    if (movieId && movieDiscussions !== null) {
      // Return as discussions format for the modal
      return NextResponse.json({
        discussions: movieDiscussions,
        success: true,
        debug: {
          connection: "✅ PASSED",
          tableExists: "✅ PASSED",
          totalRecords: connectionTest?.count || 0,
          movieRecords: movieDiscussions?.length || 0,
          session: session ? "✅ AUTHENTICATED" : "❌ NOT AUTHENTICATED",
          userId: session?.user?.id || null,
          userEmail: session?.user?.email || null
        }
      })
    } else {
      // Return debug info
      return NextResponse.json({
        success: true,
        tests: {
          connection: "✅ PASSED",
          tableExists: "✅ PASSED",
          recordCount: connectionTest?.count || 0,
          session: session ? "✅ AUTHENTICATED" : "❌ NOT AUTHENTICATED",
          userId: session?.user?.id || null,
          userEmail: session?.user?.email || null
        }
      })
    }

  } catch (error) {
    console.error("💥 Debug test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🔍 Debug POST request:", body)

    const { movieId, content, userId, parentId } = body

    // Validate input
    if (!movieId || !content || !userId) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields",
        received: { movieId: !!movieId, content: !!content, userId: !!userId, parentId: !!parentId }
      }, { status: 400 })
    }

    console.log("📝 Attempting to insert discussion...", {
      movieId,
      userId,
      parentId: parentId || "null (root comment)",
      contentLength: content.length
    })

    // Try to insert using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from("discussions")
      .insert({
        movie_id: movieId,
        user_id: userId,
        content: content,
        parent_id: parentId || null
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Insert failed:", error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 })
    }

    console.log("✅ Insert successful:", data.id)

    return NextResponse.json({
      success: true,
      message: "Discussion created successfully",
      data: data
    })

  } catch (error) {
    console.error("💥 POST error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Helper function to build threaded discussions
function buildThreadedDiscussions(flatDiscussions: any[]): any[] {
  const discussionMap = new Map()
  const rootDiscussions: any[] = []

  // First pass: create a map of all discussions
  flatDiscussions.forEach(discussion => {
    discussionMap.set(discussion.id, { ...discussion, replies: [] })
  })

  // Second pass: build the tree structure
  flatDiscussions.forEach(discussion => {
    const discussionWithReplies = discussionMap.get(discussion.id)
    
    if (discussion.parent_id) {
      // This is a reply - add it to its parent's replies array
      const parent = discussionMap.get(discussion.parent_id)
      if (parent) {
        parent.replies.push(discussionWithReplies)
        // Sort replies by creation time (oldest first for natural conversation flow)
        parent.replies.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }
    } else {
      // This is a root discussion
      rootDiscussions.push(discussionWithReplies)
    }
  })

  // Sort root discussions by creation time (newest first)
  rootDiscussions.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return rootDiscussions
}