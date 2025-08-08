"use client"

import { useEffect } from "react"
import { registerServiceWorker } from "@/lib/service-worker"

export default function ServiceWorkerInitializer() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return null // This component doesn't render anything
}