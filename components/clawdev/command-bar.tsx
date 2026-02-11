"use client"

import React from "react"

import { useState } from "react"

interface CommandBarProps {
  onExecute: (command: string) => void
  isLoading: boolean
}

const QUICK_COMMANDS = [
  { label: "SCAN", command: "scan", desc: "Scan market" },
  { label: "GENERATE", command: "generate", desc: "Generate ideas" },
  { label: "ANALYZE", command: "analyze", desc: "Deep analysis" },
  { label: "CYCLE", command: "cycle", desc: "Full AI cycle" },
  { label: "STATUS", command: "status", desc: "Agent status" },
]

export function CommandBar({ onExecute, isLoading }: CommandBarProps) {
  const [input, setInput] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onExecute(input.trim())
      setInput("")
    }
  }

  return (
    <div className="border-t border-border bg-card">
      <div className="flex items-center gap-2 overflow-x-auto px-3 py-2">
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd.command}
            type="button"
            onClick={() => onExecute(cmd.command)}
            disabled={isLoading}
            className="shrink-0 border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
            title={cmd.desc}
          >
            {cmd.label}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border px-3 py-2">
        <span className="text-xs text-primary text-glow">{">"}</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isLoading ? "Processing..." : "Talk to ClawDev... (or type a command)"}
          disabled={isLoading}
          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-40"
          autoFocus
        />
        {isLoading && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <span className="animate-pulse">PROCESSING</span>
          </div>
        )}
      </form>
    </div>
  )
}
