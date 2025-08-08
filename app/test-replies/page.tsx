"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestRepliesPage() {
  const [user, setUser] = useState<any>(null)
  const [discussions, setDiscussions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [replyContent, setReplyContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

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

  // Generate a better display name from user_id
  const generateUsername = (userId: string) => {
    // Create a more readable identifier from the UUID
    const shortId = userId.slice(-8)
    const colors = ['Red', 'Blue', 'Green', 'Purple', 'Orange', 'Pink', 'Cyan', 'Gold']
    const animals = ['Fox', 'Wolf', 'Eagle', 'Lion', 'Tiger', 'Bear', 'Shark', 'Hawk']
    
    // Use the user ID to consistently generate the same name
    const colorIndex = parseInt(shortId.slice(0, 2), 16) % colors.length
    const animalIndex = parseInt(shortId.slice(2, 4), 16) % animals.length
    
    return `${colors[colorIndex]}${animals[animalIndex]}`
  }

  const loadDiscussions = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/discussions/debug?movieId=550")
      const data = await response.json()
      console.log("Loaded discussions:", data)
      setDiscussions(data.discussions || [])
    } catch (error) {
      console.error("Error loading discussions:", error)
    } finally {
      setLoading(false)
    }
  }

  const postComment = async () => {
    if (!newComment.trim() || !user) return

    try {
      const response = await fetch("/api/discussions/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: "550",
          content: newComment,
          userId: user.id
        })
      })

      const data = await response.json()
      if (data.success) {
        setNewComment("")
        loadDiscussions()
      } else {
        alert("Failed: " + data.error)
      }
    } catch (error) {
      console.error("Error posting comment:", error)
    }
  }

  const postReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) return

    try {
      const response = await fetch("/api/discussions/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: "550",
          content: replyContent,
          userId: user.id,
          parentId: parentId
        })
      })

      const data = await response.json()
      if (data.success) {
        setReplyContent("")
        setReplyingTo(null)
        loadDiscussions()
      } else {
        alert("Failed: " + data.error)
      }
    } catch (error) {
      console.error("Error posting reply:", error)
    }
  }

  const renderDiscussion = (discussion: any, level: number = 0) => {
    return (
      <div key={discussion.id} className={`${level > 0 ? 'ml-6 border-l border-gray-600 pl-4' : ''} mb-4`}>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">{generateUsername(discussion.user_id)}</p>
                <p className="text-xs text-gray-500">{new Date(discussion.created_at).toLocaleString()}</p>
              </div>
              {level < 3 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReplyingTo(discussion.id)}
                  className="text-xs"
                  disabled={replyingTo === discussion.id}
                >
                  {replyingTo === discussion.id ? "Replying..." : "Reply"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-white mb-3">{discussion.content}</p>
            
            {replyingTo === discussion.id && (
              <div className="mt-4 space-y-2 border-t border-gray-600 pt-4">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="bg-gray-700"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => postReply(discussion.id)}>
                    Post Reply
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {discussion.replies && discussion.replies.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">{discussion.replies.length} replies:</p>
                {discussion.replies.map((reply: any) => renderDiscussion(reply, level + 1))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Reply System Test</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            {user ? (
              <div className="text-green-400">
                ✅ Authenticated as: {user.email}
              </div>
            ) : (
              <div className="text-red-400">
                ❌ Not authenticated. Please sign in first.
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button onClick={loadDiscussions} disabled={loading}>
              {loading ? "Loading..." : "Load Discussions"}
            </Button>
          </div>

          {user && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle>Post New Comment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment about Fight Club..."
                  className="bg-gray-800"
                />
                <Button onClick={postComment}>Post Comment</Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">
              Discussions ({discussions.length})
            </h2>
            {discussions.length === 0 ? (
              <p className="text-gray-400">No discussions yet. Post the first comment!</p>
            ) : (
              discussions.map(discussion => renderDiscussion(discussion))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}