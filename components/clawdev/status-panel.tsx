"use client"

import { useEffect, useState, useCallback } from "react"
import type { AgentState } from "@/lib/clawdev/types"

export function StatusPanel() {
  const [state, setState] = useState<AgentState | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/clawdev")
      const data = await res.json()
      if (data.success) setState(data.state)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchState()
    const interval = setInterval(fetchState, 5000)
    return () => clearInterval(interval)
  }, [fetchState])

  if (loading) {
    return (
      <div className="border border-border bg-card p-4">
        <div className="text-xs text-muted-foreground">
          Loading agent state...
        </div>
      </div>
    )
  }

  if (!state) return null

  const sentimentColors: Record<string, string> = {
    extreme_greed: "text-green-400",
    greed: "text-green-500",
    neutral: "text-primary",
    fear: "text-destructive",
    extreme_fear: "text-red-400",
  }

  return (
    <div className="grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
      <StatBox
        label="MODE"
        value={state.currentMode.toUpperCase()}
        color="text-primary"
      />
      <StatBox
        label="IDEAS"
        value={String(state.ideas.length)}
        color="text-primary"
      />
      <StatBox
        label="DEPLOYED"
        value={String(state.deployedTokens.length)}
        color="text-primary"
      />
      <StatBox
        label="SESSIONS"
        value={String(state.sessionsRun)}
        color="text-primary"
      />
      <StatBox
        label="SENTIMENT"
        value={
          state.lastMarketSnapshot?.sentiment?.toUpperCase().replace("_", " ") ||
          "UNKNOWN"
        }
        color={
          sentimentColors[state.lastMarketSnapshot?.sentiment || "neutral"] ||
          "text-primary"
        }
      />
      <StatBox
        label="SOL PRICE"
        value={
          state.lastMarketSnapshot?.solPrice
            ? `$${state.lastMarketSnapshot.solPrice.toFixed(2)}`
            : "--"
        }
        color="text-primary"
      />
      <StatBox
        label="NARRATIVES"
        value={
          state.lastMarketSnapshot?.trendingNarratives?.slice(0, 2).join(", ") ||
          "--"
        }
        color="text-primary"
      />
      <StatBox
        label="LAST SCAN"
        value={
          state.lastScanAt
            ? new Date(state.lastScanAt).toLocaleTimeString()
            : "NEVER"
        }
        color="text-muted-foreground"
      />
    </div>
  )
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-card p-3">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-bold ${color} truncate`}>{value}</div>
    </div>
  )
}
