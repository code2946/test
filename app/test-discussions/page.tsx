"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function TestDiscussionsPage() {
  const [user, setUser] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const runTests = async () => {
    setLoading(true)
    try {
      // Test 1: Check if tables exist
      const testResponse = await fetch("/api/discussions/test")
      const testData = await testResponse.json()
      
      // Test 2: Try to create a discussion (if user is authenticated)
      let createResult = null
      if (user) {
        const createResponse = await fetch("/api/discussions/simple", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movieId: "550", // Fight Club
            content: "This is a test comment",
            userId: user.id
          })
        })
        createResult = await createResponse.json()
      }

      // Test 3: Try to fetch discussions
      const fetchResponse = await fetch("/api/discussions/simple?movieId=550")
      const fetchData = await fetchResponse.json()

      setTestResults({
        tableTest: testData,
        createTest: createResult,
        fetchTest: fetchData,
        user: user ? { id: user.id, email: user.email } : null
      })
    } catch (error) {
      setTestResults({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Discussion System Test</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            {user ? (
              <div className="text-green-400">
                ✅ Authenticated as: {user.email}
                <br />
                User ID: {user.id}
              </div>
            ) : (
              <div className="text-red-400">
                ❌ Not authenticated. Please sign in first.
              </div>
            )}
          </div>

          <Button onClick={runTests} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Running Tests..." : "Run Tests"}
          </Button>

          {testResults && (
            <div className="bg-gray-900 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              <pre className="text-sm overflow-auto max-h-96 bg-gray-800 p-4 rounded">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}