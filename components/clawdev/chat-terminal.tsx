"use client"

import React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useEffect, useRef } from "react"
import type { UIMessage } from "ai"

const transport = new DefaultChatTransport({
  api: "/api/clawdev/chat",
})

function getMessageText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ""
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

function getToolCalls(msg: UIMessage) {
  if (!msg.parts || !Array.isArray(msg.parts)) return []
  return msg.parts.filter(
    (p) => p.type === "tool-invocation"
  )
}

export function ChatTerminal() {
  const { messages, sendMessage, status } = useChat({ transport })
  const scrollRef = useRef<HTMLDivElement>(null)
  const isStreaming = status === "streaming" || status === "submitted"

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleCommand = async (input: string) => {
    // Map quick commands to chat messages
    const commandMap: Record<string, string> = {
      scan: "Scan the pump.fun market right now and tell me what you see.",
      generate: "Generate 3 new token ideas based on current market conditions.",
      analyze: "Run a deep analysis on the current top narratives on pump.fun.",
      cycle: "Run a full ClawDev cycle - scan, analyze, and decide what to do.",
      status: "Show me the current agent status and recent activity.",
      help: "What commands can I use? Show me everything you can do.",
    }

    const message = commandMap[input.toLowerCase()] || input
    sendMessage({ text: message })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-2 text-xs">
            <pre className="text-primary text-glow leading-tight">
{`  ██████╗██╗      █████╗ ██╗    ██╗██████╗ ███████╗██╗   ██╗
 ██╔════╝██║     ██╔══██╗██║    ██║██╔══██╗██╔════╝██║   ██║
 ██║     ██║     ███████║██║ █╗ ██║██║  ██║█████╗  ██║   ██║
 ██║     ██║     ██╔══██║██║███╗██║██║  ██║██╔══╝  ╚██╗ ██╔╝
 ╚██████╗███████╗██║  ██║╚███╔███╔╝██████╔╝███████╗ ╚████╔╝
  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝ ╚══════╝  ╚═══╝`}
            </pre>
            <p className="text-muted-foreground">
              {">"} The First AI Crypto Developer // pump.fun Agent
            </p>
            <p className="text-muted-foreground">
              {">"} Type a command or talk to me naturally.
            </p>
            <p className="text-muted-foreground">
              {">"} Quick commands: SCAN | GENERATE | ANALYZE | CYCLE | STATUS
            </p>
            <p className="text-muted-foreground">
              {">"} Ready.
              <span className="animate-blink ml-1 text-primary">_</span>
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const text = getMessageText(msg)
          const toolCalls = getToolCalls(msg)

          return (
            <div key={msg.id} className="mb-4">
              {msg.role === "user" ? (
                <div className="flex gap-2 text-xs">
                  <span className="shrink-0 text-green-500 font-bold">
                    {"you >"}
                  </span>
                  <span className="text-foreground">{text}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex gap-2 text-xs">
                    <span className="shrink-0 text-primary font-bold text-glow">
                      {"claw >"}
                    </span>
                  </div>

                  {/* Tool invocations */}
                  {toolCalls.map((tc, i) => {
                    if (tc.type !== "tool-invocation") return null
                    const invocation = tc as {
                      type: "tool-invocation"
                      toolInvocation: {
                        toolCallId: string
                        toolName: string
                        state: string
                        args: Record<string, unknown>
                        output?: unknown
                      }
                    }
                    return (
                      <div
                        key={invocation.toolInvocation.toolCallId || i}
                        className="ml-7 border-l border-border pl-3 text-xs"
                      >
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-primary">
                            {"[tool]"}
                          </span>
                          <span>{invocation.toolInvocation.toolName}</span>
                          <span className={
                            invocation.toolInvocation.state === "output-available"
                              ? "text-green-500"
                              : "text-yellow-500 animate-pulse"
                          }>
                            {invocation.toolInvocation.state === "output-available"
                              ? "completed"
                              : "running..."}
                          </span>
                        </div>
                        {invocation.toolInvocation.state === "output-available" &&
                          invocation.toolInvocation.output && (
                            <pre className="mt-1 max-h-32 overflow-auto text-[10px] text-muted-foreground">
                              {JSON.stringify(invocation.toolInvocation.output, null, 2)}
                            </pre>
                          )}
                      </div>
                    )
                  })}

                  {/* Text content */}
                  {text && (
                    <div className="ml-7 whitespace-pre-wrap text-xs text-secondary-foreground leading-relaxed">
                      {text}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {isStreaming && (
          <div className="flex gap-2 text-xs">
            <span className="text-primary text-glow animate-pulse">
              {"claw >"}
            </span>
            <span className="animate-blink text-primary">_</span>
          </div>
        )}
      </div>

      {/* Command Input */}
      <CommandInput
        onSubmit={handleCommand}
        isLoading={isStreaming}
      />
    </div>
  )
}

function CommandInput({
  onSubmit,
  isLoading,
}: {
  onSubmit: (input: string) => void
  isLoading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = inputRef.current?.value.trim()
    if (value && !isLoading) {
      onSubmit(value)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const quickCommands = [
    { label: "SCAN", cmd: "scan" },
    { label: "GENERATE", cmd: "generate" },
    { label: "ANALYZE", cmd: "analyze" },
    { label: "CYCLE", cmd: "cycle" },
    { label: "STATUS", cmd: "status" },
  ]

  return (
    <div className="border-t border-border bg-card">
      <div className="flex items-center gap-2 overflow-x-auto px-3 py-2">
        {quickCommands.map((qc) => (
          <button
            key={qc.cmd}
            type="button"
            onClick={() => onSubmit(qc.cmd)}
            disabled={isLoading}
            className="shrink-0 border border-border bg-secondary px-3 py-1 text-[10px] text-secondary-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
          >
            {qc.label}
          </button>
        ))}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border px-3 py-2"
      >
        <span className="text-xs text-primary text-glow">{">"}</span>
        <input
          ref={inputRef}
          type="text"
          placeholder={
            isLoading
              ? "ClawDev is thinking..."
              : "Talk to ClawDev or type a command..."
          }
          disabled={isLoading}
          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-40"
          autoFocus
        />
        {isLoading && (
          <span className="text-[10px] text-primary animate-pulse">
            PROCESSING
          </span>
        )}
      </form>
    </div>
  )
}
