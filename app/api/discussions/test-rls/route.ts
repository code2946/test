import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { movieId, content, userId } = body

    console.log("🧪 Testing RLS policies...")
    console.log("Test data:", { movieId, content: content?.substring(0, 20), userId })

    // Test 1: Try with regular client (subject to RLS)
    console.log("📝 Test 1: Regular client (with RLS)...")
    const { data: regularData, error: regularError } = await supabase
      .from("discussions")
      .insert({
        movie_id: movieId,
        user_id: userId,
        content: content,
        parent_id: null
      })
      .select()
      .single()

    if (regularError) {
      console.log("❌ Regular client failed (expected if RLS not fixed):", regularError.message)
    } else {
      console.log("✅ Regular client succeeded!")
    }

    // Test 2: Try with admin client (bypasses RLS)  
    console.log("📝 Test 2: Admin client (bypasses RLS)...")
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("discussions")
      .insert({
        movie_id: movieId + "_admin_test",
        user_id: userId,
        content: content + " (admin test)",
        parent_id: null
      })
      .select()
      .single()

    if (adminError) {
      console.log("❌ Admin client failed:", adminError.message)
    } else {
      console.log("✅ Admin client succeeded!")
    }

    return NextResponse.json({
      success: true,
      results: {
        regularClient: {
          success: !regularError,
          error: regularError?.message || null,
          data: regularData?.id || null
        },
        adminClient: {
          success: !adminError,
          error: adminError?.message || null,
          data: adminData?.id || null
        }
      },
      recommendation: regularError 
        ? "RLS policies need to be fixed. Run the fix-rls-policies.sql script."
        : "RLS policies are working correctly!"
    })

  } catch (error) {
    console.error("💥 RLS test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}