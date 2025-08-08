"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  Heart, 
  ThumbsDown, 
  Laugh, 
  Send, 
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Reply
} from "lucide-react"
import { Discussion, DiscussionReaction } from "@/lib/supabase"
import { supabase } from "@/lib/supabase"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"

interface DiscussionModalProps {
  isOpen: boolean
  onClose: () => void
  movieId: string
  movieTitle: string
  userId?: string
}

interface DiscussionWithReactions extends Discussion {
  reactions?: {
    like: number
    dislike: number
    love: number
    laugh: number
  }
  userReaction?: string | null
}

export function DiscussionModal({ isOpen, onClose, movieId, movieTitle, userId }: DiscussionModalProps) {
  const [discussions, setDiscussions] = useState<DiscussionWithReactions[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "mostLiked">("newest")

  useEffect(() => {
    if (isOpen && movieId) {
      loadDiscussions()
    }
  }, [isOpen, movieId, sortBy])

  const loadDiscussions = async () => {
    setLoading(true)
    try {
      console.log("Loading discussions for movie:", movieId)
      const response = await fetch(`/api/discussions/debug?movieId=${movieId}&sortBy=${sortBy}`)
      const data = await response.json()
      
      console.log("Discussions response:", data)
      
      if (data.discussions) {
        console.log("Processing discussions:", data.discussions.length)
        // Load reactions for all discussions
        const allDiscussionIds = getAllDiscussionIds(data.discussions)
        console.log("Discussion IDs:", allDiscussionIds)
        
        const reactions = await loadReactions(allDiscussionIds)
        
        const discussionsWithReactions = addReactionsToDiscussions(data.discussions, reactions)
        setDiscussions(discussionsWithReactions)
        console.log("Set discussions:", discussionsWithReactions.length)
      } else if (data.error) {
        console.error("Error from API:", data.error)
      } else {
        console.log("No discussions found, setting empty array")
        setDiscussions([])
      }
    } catch (error) {
      console.error("Error loading discussions:", error)
    } finally {
      setLoading(false)
    }
  }

  const getAllDiscussionIds = (discussions: Discussion[]): string[] => {
    const ids: string[] = []
    const traverse = (items: Discussion[]) => {
      items.forEach(item => {
        ids.push(item.id)
        if (item.replies && item.replies.length > 0) {
          traverse(item.replies)
        }
      })
    }
    traverse(discussions)
    return ids
  }

  const loadReactions = async (discussionIds: string[]) => {
    if (discussionIds.length === 0) return { counts: {}, userReactions: {} }
    
    try {
      const params = new URLSearchParams({
        discussionIds: discussionIds.join(",")
      })
      if (userId) {
        params.set("userId", userId)
      }
      
      const response = await fetch(`/api/discussions/reactions?${params}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error loading reactions:", error)
      return { counts: {}, userReactions: {} }
    }
  }

  const addReactionsToDiscussions = (discussions: Discussion[], reactions: any): DiscussionWithReactions[] => {
    const addReactions = (items: Discussion[]): DiscussionWithReactions[] => {
      return items.map(item => ({
        ...item,
        reactions: reactions.counts[item.id] || { like: 0, dislike: 0, love: 0, laugh: 0 },
        userReaction: reactions.userReactions[item.id] || null,
        replies: item.replies ? addReactions(item.replies) : []
      }))
    }
    return addReactions(discussions)
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      console.log("Comment is empty")
      return
    }
    
    if (!userId) {
      console.log("User not authenticated")
      alert("Please sign in to post a comment")
      return
    }

    console.log("Submitting comment:", { movieId, content: newComment, userId })

    try {
      const response = await fetch("/api/discussions/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId,
          content: newComment,
          userId
        })
      })

      const responseData = await response.json()
      console.log("Response:", responseData)

      if (response.ok) {
        setNewComment("")
        loadDiscussions()
        console.log("Comment posted successfully")
      } else {
        console.error("Failed to post comment:", responseData)
        alert(`Failed to post comment: ${responseData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
      alert("Network error. Please try again.")
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) {
      console.log("Reply content is empty")
      return
    }
    
    if (!userId) {
      console.log("User not authenticated for reply")
      alert("Please sign in to reply")
      return
    }

    console.log("Submitting reply:", { movieId, parentId, content: replyContent, userId })

    try {
      const response = await fetch("/api/discussions/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId,
          parentId,
          content: replyContent,
          userId
        })
      })

      const responseData = await response.json()
      console.log("Reply response:", responseData)

      if (response.ok && responseData.success) {
        setReplyContent("")
        setReplyingTo(null)
        loadDiscussions()
        console.log("Reply posted successfully")
      } else {
        console.error("Failed to post reply:", responseData)
        alert(`Failed to post reply: ${responseData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error submitting reply:", error)
      alert("Network error. Please try again.")
    }
  }

  const handleEditComment = async (discussionId: string) => {
    if (!editContent.trim() || !userId) return

    try {
      const response = await fetch(`/api/discussions/${discussionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent,
          userId
        })
      })

      if (response.ok) {
        setEditContent("")
        setEditingId(null)
        loadDiscussions()
      }
    } catch (error) {
      console.error("Error editing comment:", error)
    }
  }

  const handleDeleteComment = async (discussionId: string) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/discussions/${discussionId}?userId=${userId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        loadDiscussions()
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const handleReaction = async (discussionId: string, reactionType: string) => {
    if (!userId) return

    try {
      const response = await fetch("/api/discussions/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discussionId,
          userId,
          reactionType
        })
      })

      if (response.ok) {
        loadDiscussions()
      }
    } catch (error) {
      console.error("Error handling reaction:", error)
    }
  }

  const toggleThreadCollapse = (discussionId: string) => {
    const newCollapsed = new Set(collapsedThreads)
    if (newCollapsed.has(discussionId)) {
      newCollapsed.delete(discussionId)
    } else {
      newCollapsed.add(discussionId)
    }
    setCollapsedThreads(newCollapsed)
  }

  const renderDiscussion = (discussion: DiscussionWithReactions, level: number = 0) => {
    const isCollapsed = collapsedThreads.has(discussion.id)
    const hasReplies = discussion.replies && discussion.replies.length > 0
    const isOwner = userId === discussion.user_id
    const isEditing = editingId === discussion.id
    const isReplying = replyingTo === discussion.id

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

    return (
      <div key={discussion.id} className={`${level > 0 ? 'ml-6 border-l border-gray-700 pl-4' : ''} mb-4`}>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          {/* Discussion Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 text-black">
                <span className="text-sm font-semibold">
                  {discussion.user_email 
                    ? discussion.user_email.charAt(0).toUpperCase()
                    : generateUsername(discussion.user_id).charAt(0)
                  }
                </span>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white">
                  {discussion.user_email 
                    ? discussion.user_email.split("@")[0] 
                    : generateUsername(discussion.user_id)
                  }
                </p>
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
                  {discussion.updated_at !== discussion.created_at && " (edited)"}
                </p>
              </div>
            </div>
            
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => {
                    setEditingId(discussion.id)
                    setEditContent(discussion.content)
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteComment(discussion.id)}
                    className="text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Discussion Content */}
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px] bg-gray-800 border-gray-700"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEditComment(discussion.id)}>
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setEditingId(null)
                    setEditContent("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-300 mb-3 whitespace-pre-wrap">{discussion.content}</p>
          )}

          {/* Reactions and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Reaction Buttons */}
              <div className="flex gap-1">
                {[
                  { type: 'like', icon: Heart, count: discussion.reactions?.like || 0 },
                  { type: 'dislike', icon: ThumbsDown, count: discussion.reactions?.dislike || 0 },
                  { type: 'laugh', icon: Laugh, count: discussion.reactions?.laugh || 0 }
                ].map(({ type, icon: Icon, count }) => (
                  <Button
                    key={type}
                    variant="ghost"
                    size="sm"
                    className={`text-xs ${
                      discussion.userReaction === type 
                        ? 'text-yellow-400 bg-yellow-400/10' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => handleReaction(discussion.id, type)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {count > 0 && count}
                  </Button>
                ))}
              </div>

              {/* Reply Count */}
              {hasReplies && (
                <Badge variant="secondary" className="text-xs">
                  {discussion.replies?.length} {discussion.replies?.length === 1 ? 'reply' : 'replies'}
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              {/* Reply Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log("Opening reply form for discussion:", discussion.id)
                  setReplyingTo(discussion.id)
                  setReplyContent("")
                }}
                className="text-gray-400 hover:text-white"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>

              {/* Collapse Button */}
              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleThreadCollapse(discussion.id)}
                  className="text-gray-400 hover:text-white"
                >
                  {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                </Button>
              )}
            </div>
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-4 space-y-3 border-t border-gray-700 pt-4">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[80px] bg-gray-800 border-gray-700"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSubmitReply(discussion.id)}>
                  <Send className="h-3 w-3 mr-2" />
                  Reply
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyContent("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Nested Replies */}
        {hasReplies && !isCollapsed && (
          <div className="mt-4">
            {discussion.replies?.map(reply => renderDiscussion(reply, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-black border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">
            <MessageCircle className="h-5 w-5 inline mr-2" />
            Discuss: {movieTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[70vh]">
          {/* Sorting Options */}
          <div className="flex gap-2 mb-4">
            {[
              { key: "newest", label: "Newest" },
              { key: "oldest", label: "Oldest" },
              { key: "mostLiked", label: "Most Liked" }
            ].map(({ key, label }) => (
              <Button
                key={key}
                size="sm"
                variant={sortBy === key ? "default" : "outline"}
                onClick={() => setSortBy(key as any)}
                className={sortBy === key ? "bg-yellow-500 text-black" : "border-gray-600 text-white"}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* New Comment Form */}
          {userId && (
            <div className="space-y-3 mb-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this movie..."
                className="min-h-[100px] bg-gray-800 border-gray-700"
              />
              <Button onClick={handleSubmitComment} className="bg-yellow-500 text-black hover:bg-yellow-600">
                <Send className="h-4 w-4 mr-2" />
                Post Comment
              </Button>
            </div>
          )}

          {/* Discussions List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Loading discussions...</p>
              </div>
            ) : discussions.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No discussions yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {discussions.map(discussion => renderDiscussion(discussion))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}