"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
// import { useChat } from "ai/react" // Not available in AI v5.x
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Bot, User, Sparkles, Film, RotateCcw, AlertCircle, X, Minimize2, Maximize2, Brain, Zap, Stars } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

const SUGGESTED_PROMPTS = [
  "Recommend me a thriller like Gone Girl",
  "What's a good comedy for tonight?",
  "Best sci-fi movies of 2024",
  "Movies similar to Inception",
  "Hidden gem movies I should watch",
  "Best movies for a date night",
]

// Simple function to convert basic markdown to HTML
function parseMarkdown(text: string): string {
  return text
    // Bold text: **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    // Italic text: *text* -> <em>text</em>  
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    // Line breaks
    .replace(/\n/g, '<br />')
}

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [authUser, setAuthUser] = useState<any | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Simple chat state replacement for useChat
  const [messages, setMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string}>>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    const userMessage = { id: Date.now().toString(), role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)
    setShowSuggestions(false)

    // Create placeholder assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage = { 
      id: assistantMessageId, 
      role: 'assistant' as const, 
      content: "" 
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage], stream: true })
      })
      
      if (!response.ok) throw new Error('Failed to get response')
      
      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      setIsLoading(false) // Stop loading, start streaming
      let accumulatedContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                throw new Error(data.error)
              }
              
              if (data.text) {
                accumulatedContent += data.text
                // Update the assistant message content
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                )
              }
              
              if (data.done) {
                return // Streaming complete
              }
            } catch (parseError) {
              // Ignore malformed JSON chunks
            }
          }
        }
      }
    } catch (err) {
      setError(err as Error)
      console.error("Chat error:", err)
      // Update the assistant message with error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: "Sorry, I couldn't process that request." }
            : msg
        )
      )
      setIsLoading(false)
    }
  }

  const reload = () => {
    setMessages([])
    setError(null)
    setShowSuggestions(true)
  }

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const handleSuggestedPrompt = (prompt: string) => {
    handleInputChange({ target: { value: prompt } } as any)
    setShowSuggestions(false)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      handleSubmit(e)
      setShowSuggestions(false)
    }
  }

  const resetChat = () => {
    window.location.reload() // Simple way to reset chat
  }

  // Add smooth opening effect
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll immediately for smooth experience
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-3xl shadow-2xl bg-[#EAB308] hover:bg-[#D97706] text-white z-50 transition-all duration-300 hover:scale-105 border border-yellow-400/30 backdrop-blur-sm group"
        >
          <div className="relative flex items-center justify-center">
            {/* Premium AI text */}
            <span className="text-lg font-black text-white tracking-wider transform transition-all duration-200 group-hover:scale-110">AI</span>
            
            {/* Simple glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-yellow-400/20 blur-sm group-hover:blur-md transition-all duration-200" />
          </div>
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[90vh] flex flex-col gap-0 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 text-white border-slate-700/50 p-0 backdrop-blur-xl animate-in slide-in-from-bottom-2 fade-in-0 duration-200">
        {/* Header */}
        <SheetHeader className="relative p-6 pb-5 border-b border-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 bg-gradient-to-r from-slate-900/80 via-gray-900/80 to-slate-900/80 backdrop-blur-sm">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
          
          <div className="relative flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold text-white flex items-center gap-4">
              {/* Simple Chat Avatar */}
              <div className="relative">
                <div className="w-12 h-12 bg-[#EAB308] rounded-2xl flex items-center justify-center shadow-xl border border-yellow-400/30">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                {/* Simple animated glow */}
                <div className="absolute inset-0 rounded-2xl bg-yellow-400/20 blur-md animate-pulse" />
                {/* Status indicator */}
                <div className="absolute -bottom-1 -right-1">
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 shadow-lg">
                    <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75" />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col">
                <div className="text-xl font-bold bg-gradient-to-r from-white via-yellow-100 to-amber-100 bg-clip-text text-transparent">
                  CineSensei
                </div>
                <div className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  AI Movie Expert
                </div>
              </div>
            </SheetTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={resetChat}
                className="h-9 w-9 text-slate-400 hover:text-white hover:bg-yellow-500/10 rounded-xl transition-all duration-200"
                title="New Conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!authUser && (
            <div className="relative mt-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-4 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
              <div className="relative flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Film className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    <span className="font-medium text-blue-300">Guest Mode Active</span> - You can chat without signing in! 
                    Sign in later to get personalized recommendations based on your watchlist and preferences.
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 px-6 bg-gradient-to-b from-slate-950/50 to-slate-900/50" ref={scrollAreaRef}>
          <div className="space-y-6 py-6">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="text-center py-12 px-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                {/* Hero Avatar with Enhanced Animation */}
                <div className="relative mx-auto mb-8 group animate-in zoom-in-50 fade-in-0 duration-300" style={{ animationDelay: '100ms' }}>
                  <div className="w-20 h-20 bg-[#EAB308] rounded-3xl flex items-center justify-center shadow-2xl border border-yellow-400/30 transform group-hover:scale-105 transition-all duration-300">
                    <MessageCircle className="w-10 h-10 text-white" />
                  </div>
                  {/* Simple animated rings */}
                  <div className="absolute inset-0 rounded-3xl bg-yellow-400/20 blur-xl animate-pulse" />
                  <div className="absolute -inset-2 rounded-3xl bg-yellow-600/10 blur-2xl animate-ping" style={{ animationDuration: '2s' }} />
                  
                  {/* Simple floating particles */}
                  <div className="absolute -top-2 -right-2">
                    <Stars className="w-4 h-4 text-yellow-400 animate-bounce" style={{ animationDelay: '0s' }} />
                  </div>
                  <div className="absolute -bottom-2 -left-2">
                    <Sparkles className="w-3 h-3 text-yellow-400 animate-bounce" style={{ animationDelay: '1s' }} />
                  </div>
                  <div className="absolute top-0 left-8">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
                  </div>
                </div>

                {/* Welcome Text with Gradient */}
                <div className="space-y-4 mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '200ms' }}>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-white via-yellow-100 to-amber-100 bg-clip-text text-transparent">
                    Welcome to CineSensei
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-lg animate-in fade-in-0 slide-in-from-bottom-1 duration-300" style={{ animationDelay: '300ms' }}>
                    <Film className="w-5 h-5 text-yellow-400" />
                    <span className="text-slate-300 font-medium">Your AI Movie Expert</span>
                    <Zap className="w-4 h-4 text-yellow-400" />
                  </div>
                  <p className="text-slate-400 max-w-lg mx-auto leading-relaxed text-sm animate-in fade-in-0 slide-in-from-bottom-1 duration-300" style={{ animationDelay: '400ms' }}>
                    Get personalized movie recommendations, detailed reviews, and discover your next favorite film. 
                    I analyze your preferences to suggest movies you'll love!
                  </p>
                </div>

                {/* Enhanced Suggested Prompts */}
                {showSuggestions && (
                  <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '500ms' }}>
                    <div className="flex items-center justify-center gap-3 animate-in fade-in-0 duration-300" style={{ animationDelay: '600ms' }}>
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent flex-1" />
                      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        Try these suggestions
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent flex-1" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
                      {SUGGESTED_PROMPTS.map((prompt, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={() => handleSuggestedPrompt(prompt)}
                          className="group relative bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-600/30 text-slate-300 hover:text-white hover:border-yellow-500/50 hover:bg-gradient-to-br hover:from-yellow-900/20 hover:to-amber-900/20 text-left justify-start h-auto py-4 px-4 rounded-2xl backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-500/10 animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
                          style={{ animationDelay: `${700 + index * 50}ms` }}
                        >
                          <div className="flex items-start gap-3 w-full">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover:from-yellow-500/30 group-hover:to-amber-500/30 transition-all duration-200">
                              <Sparkles className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform duration-200" />
                            </div>
                            <div className="text-left">
                              <span className="text-sm font-medium block leading-relaxed">{prompt}</span>
                            </div>
                          </div>
                          
                          {/* Hover effect overlay */}
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-600/5 to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </Button>
                      ))}
                    </div>

                    {/* Call to Action */}
                    <div className="mt-8 p-4 bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-2xl border border-slate-600/20 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-1 duration-200" style={{ animationDelay: '1000ms' }}>
                      <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                        <span>Ready to discover your next favorite movie?</span>
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4 group animate-in fade-in-50 slide-in-from-bottom-2",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {message.role === "assistant" && (
                  <div className="relative flex-shrink-0 mt-1">
                    <div className="w-9 h-9 bg-[#EAB308] rounded-2xl flex items-center justify-center shadow-lg border border-yellow-400/30">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    {/* Simple glow for AI avatar */}
                    <div className="absolute inset-0 rounded-2xl bg-yellow-400/20 blur-sm group-hover:blur-md transition-all duration-200" />
                  </div>
                )}

                <div className="flex flex-col max-w-[85%] min-w-0">
                  <div
                    className={cn(
                      "rounded-3xl px-5 py-4 text-sm shadow-xl transition-all duration-300",
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white border border-blue-500/30 shadow-blue-500/20 ml-auto"
                        : "bg-gradient-to-br from-slate-800 to-slate-700 text-slate-100 border border-slate-600/50 shadow-slate-900/50 backdrop-blur-sm",
                    )}
                  >
                    {message.content ? (
                      <div 
                        className="leading-relaxed [&>strong]:font-semibold [&>strong]:text-white [&>em]:italic [&>em]:text-slate-200"
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <span className="text-xs ml-2">Thinking...</span>
                      </div>
                    )}
                  </div>

                  {message.role === "assistant" && message.content && (
                    <div className="flex items-center gap-2 mt-2 ml-2">
                      <Badge variant="secondary" className="bg-slate-800/80 text-slate-400 text-xs border border-slate-700/50 backdrop-blur-sm">
                        <Sparkles className="w-3 h-3 mr-1 text-yellow-400" />
                        AI Generated
                      </Badge>
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-600 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg border border-slate-500/50">
                    <User className="w-5 h-5 text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading State */}
            {isLoading && (
              <div className="flex gap-4 justify-start animate-in fade-in-50 slide-in-from-bottom-2">
                <div className="relative flex-shrink-0 mt-1">
                  <div className="w-9 h-9 bg-[#EAB308] rounded-2xl flex items-center justify-center shadow-lg border border-yellow-400/30">
                    <MessageCircle className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-yellow-400/20 blur-md animate-pulse" />
                </div>
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 text-slate-100 border border-slate-600/50 shadow-slate-900/50 backdrop-blur-sm rounded-3xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                    <span className="text-sm text-slate-300 font-medium">CineSensei is thinking...</span>
                    <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-500/30 rounded-2xl p-6 text-center backdrop-blur-sm animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-red-300 text-sm font-medium">Oops! Something went wrong.</p>
                  </div>
                </div>
                <p className="text-red-400/80 text-xs mb-4 max-w-sm mx-auto leading-relaxed">
                  {error.message || "I'm having trouble connecting to my AI brain right now. Please try again!"}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reload()}
                  className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-400/50 hover:text-red-200 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <RotateCcw className="w-3 h-3 mr-2" />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Enhanced Input Form */}
        <div className="relative border-t border-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 bg-gradient-to-r from-slate-900/80 via-gray-900/80 to-slate-900/80 backdrop-blur-sm p-6">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(120,119,198,0.05),transparent_70%)]" />
          
          <div className="relative">
            <form onSubmit={handleFormSubmit} className="flex items-end gap-4">
              <div className="flex-1 relative group">
                {/* Enhanced textarea with gradient border */}
                <div className="relative">
                  <Textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask me about movies, get recommendations, or request reviews..."
                    className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 border border-slate-600/50 text-white placeholder:text-slate-400 resize-none min-h-[52px] max-h-32 rounded-2xl px-4 py-3 pr-12 backdrop-blur-sm focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:bg-slate-800/95 transition-all duration-300 shadow-lg group-hover:border-slate-500/70"
                    rows={1}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleFormSubmit(e)
                      }
                    }}
                  />
                  
                  {/* Character count indicator */}
                  {input.length > 100 && (
                    <div className="absolute bottom-2 right-3 text-xs text-slate-500">
                      {input.length}/500
                    </div>
                  )}
                  
                  {/* Glow effect on focus */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600/10 to-blue-600/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>

                {/* Typing indicator */}
                {isLoading && (
                  <div className="absolute -top-8 left-0 flex items-center gap-2 text-xs text-slate-400 bg-slate-800/90 px-3 py-1 rounded-full border border-slate-600/50 backdrop-blur-sm">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-yellow-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-1 h-1 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                    <span>CineSensei is responding...</span>
                  </div>
                )}
              </div>

              {/* Enhanced send button */}
              <Button
                type="submit"
                size="icon"
                className="relative group bg-[#EAB308] hover:bg-[#D97706] text-white rounded-2xl h-12 w-12 shadow-xl border border-yellow-400/30 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={isLoading || !input.trim()}
              >
                <div className="relative">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  )}
                </div>
                
                {/* Button glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-yellow-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Button>
            </form>

            {/* Enhanced footer with better styling */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  <span>AI Ready</span>
                </div>
                <div className="text-slate-600">•</div>
                <span className="text-slate-500">Press Enter to send • Shift+Enter for new line</span>
              </div>
              
              {/* Quick actions */}
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reload}
                    className="h-7 px-3 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
