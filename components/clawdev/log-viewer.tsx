"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { AgentLog } from "@/lib/clawdev/types"

export function LogViewer() {
  const [logs, setLogs] = useState<AgentLog[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/clawdev")
      const data = await res.json()
      if (data.success && data.state.logs) {
        setLogs(data.state.logs)
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 3000)
    return () => clearInterval(interval)
  }, [fetchLogs])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [logs])

  const levelColors: Record<string, string> = {
    info: "text-muted-foreground",
    warn: "text-yellow-500",
    error: "text-destructive",
    success: "text-green-500",
    ai: "text-primary",
  }

  const levelIcons: Record<string, string> = {
    info: "[i]",
    warn: "[!]",
    error: "[x]",
    success: "[+]",
    ai: "[*]",
  }

  return (
    <div className="flex h-full flex-col border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-bold text-primary">AGENT LOGS</span>
        <span className="text-[10px] text-muted-foreground">
          {logs.length} entries
        </span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="p-2 text-muted-foreground">
            {">"} Waiting for agent activity...
            <span className="animate-blink ml-1">_</span>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-2 py-0.5 leading-relaxed">
              <span className="shrink-0 text-muted-foreground">
                {new Date(log.timestamp).toLocaleTimeString("en-US", {
                  hour12: false,
                })}
              </span>
              <span className={`shrink-0 ${levelColors[log.level] || "text-foreground"}`}>
                {levelIcons[log.level] || "[?]"}
              </span>
              <span className="shrink-0 text-muted-foreground">
                [{log.module}]
              </span>
              <span className={levelColors[log.level] || "text-foreground"}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
