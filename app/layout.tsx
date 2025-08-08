import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { FloatingChatButton } from "@/components/floating-chat-button"
import PerformanceMonitor from "@/components/performance-monitor"
import ServiceWorkerInitializer from "@/components/service-worker-initializer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ScreenOnFire",
  description: "Your ultimate movie recommender.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ServiceWorkerInitializer />
        <PerformanceMonitor />
        {children}
        <FloatingChatButton />
      </body>
    </html>
  )
}
