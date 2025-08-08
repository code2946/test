"use client"

import { lazy } from "react"

// Lazy load heavy components for better initial load performance
export const AuthModal = lazy(() => 
  import("@/components/auth-modal").then(module => ({
    default: module.AuthModal
  }))
)

export const FloatingChatButton = lazy(() => 
  import("@/components/floating-chat-button")
)

export const DiscussionModal = lazy(() => 
  import("@/components/discussion-modal")
)

export const AIReviewModal = lazy(() => 
  import("@/components/ai-review-modal")
)