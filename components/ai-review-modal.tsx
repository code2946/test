"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Star } from "lucide-react"

interface AiReviewModalProps {
  isOpen: boolean
  onClose: () => void
  review: string
  isLoading: boolean
  movieTitle: string
}

// Simple function to convert basic markdown to HTML
function parseMarkdown(text: string): string {
  return text
    // Bold text: **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text: *text* -> <em>text</em>  
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Headers: ## text -> <h2>text</h2>
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-yellow-500 mt-4 mb-2">$1</h2>')
    // Headers: # text -> <h1>text</h1>
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-yellow-500 mt-4 mb-2">$1</h1>')
    // Line breaks
    .replace(/\n/g, '<br />')
}

export function AiReviewModal({ isOpen, onClose, review, isLoading, movieTitle }: AiReviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Star className="text-yellow-500" />
            AI Review for {movieTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
          ) : (
            <div 
              className="text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(review) }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
