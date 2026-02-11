"use client"

import { useEffect, useState, useCallback } from "react"
import type { TokenIdea } from "@/lib/clawdev/types"

export function IdeasPanel() {
  const [ideas, setIdeas] = useState<TokenIdea[]>([])

  const fetchIdeas = useCallback(async () => {
    try {
      const res = await fetch("/api/clawdev")
      const data = await res.json()
      if (data.success && data.state.ideas) {
        setIdeas(data.state.ideas)
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchIdeas()
    const interval = setInterval(fetchIdeas, 5000)
    return () => clearInterval(interval)
  }, [fetchIdeas])

  return (
    <div className="flex h-full flex-col border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-bold text-primary">TOKEN IDEAS</span>
        <span className="text-[10px] text-muted-foreground">
          {ideas.length} generated
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {ideas.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground">
            No ideas generated yet. Run GENERATE or CYCLE to create token ideas.
          </div>
        ) : (
          ideas.map((idea) => (
            <div
              key={idea.id}
              className="border-b border-border p-3 transition-colors hover:bg-secondary"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-primary">
                    ${idea.ticker}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {idea.name}
                  </span>
                </div>
                <ScoreBadge score={idea.overallScore} />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">
                {idea.description}
              </p>
              <div className="mt-2 flex items-center gap-3 text-[10px]">
                <span className="text-muted-foreground">
                  VIRAL: <span className="text-primary">{idea.viralScore}</span>
                </span>
                <span className="text-muted-foreground">
                  RISK: <span className={idea.riskScore > 60 ? "text-destructive" : "text-green-500"}>
                    {idea.riskScore}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  TIME: <span className="text-primary">{idea.timingScore}</span>
                </span>
                <span className="border border-border px-1.5 py-0.5 text-muted-foreground">
                  {idea.category.toUpperCase()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  let color = "text-muted-foreground border-muted-foreground"
  if (score >= 80) color = "text-green-400 border-green-400"
  else if (score >= 60) color = "text-primary border-primary"
  else if (score >= 40) color = "text-yellow-500 border-yellow-500"
  else color = "text-destructive border-destructive"

  return (
    <span className={`border px-1.5 py-0.5 text-[10px] font-bold ${color}`}>
      {score}/100
    </span>
  )
}
