// ============================================================
// ClawDev - Agent Control API
// POST /api/clawdev - Execute agent commands
// GET  /api/clawdev - Get agent state
// ============================================================

import { NextResponse } from "next/server"
import {
  getAgentState,
  updateConfig,
  runScan,
  runAnalysis,
  runGenerate,
  runDeploy,
  runMonitor,
  runFullCycle,
  clearLogs,
  resetAgent,
} from "@/lib/clawdev/agent"

export async function GET() {
  const state = getAgentState()
  return NextResponse.json({
    success: true,
    agent: "ClawDev",
    version: "1.0.0",
    state,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { command, params } = body as {
      command: string
      params?: Record<string, unknown>
    }

    switch (command) {
      // ---- Core Agent Commands ----

      case "scan": {
        const result = await runScan()
        return NextResponse.json({ success: true, command: "scan", ...result })
      }

      case "analyze": {
        const narrative = params?.narrative as string | undefined
        const result = await runAnalysis(narrative)
        return NextResponse.json({
          success: true,
          command: "analyze",
          ...result,
        })
      }

      case "generate": {
        const count = (params?.count as number) || 3
        const ideas = await runGenerate(count)
        return NextResponse.json({
          success: true,
          command: "generate",
          ideas,
        })
      }

      case "deploy": {
        const ideaId = params?.ideaId as string
        if (!ideaId) {
          return NextResponse.json(
            { success: false, error: "ideaId is required" },
            { status: 400 }
          )
        }
        const result = await runDeploy(ideaId)
        return NextResponse.json({
          success: true,
          command: "deploy",
          ...result,
        })
      }

      case "monitor": {
        const result = await runMonitor()
        return NextResponse.json({
          success: true,
          command: "monitor",
          ...result,
        })
      }

      case "cycle": {
        const result = await runFullCycle()
        return NextResponse.json({
          success: true,
          command: "cycle",
          ...result,
        })
      }

      // ---- Config Commands ----

      case "config": {
        const state = updateConfig(params || {})
        return NextResponse.json({
          success: true,
          command: "config",
          state,
        })
      }

      case "clear_logs": {
        clearLogs()
        return NextResponse.json({
          success: true,
          command: "clear_logs",
        })
      }

      case "reset": {
        const state = resetAgent()
        return NextResponse.json({
          success: true,
          command: "reset",
          state,
        })
      }

      case "state": {
        const state = getAgentState()
        return NextResponse.json({
          success: true,
          command: "state",
          state,
        })
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown command: ${command}`,
            availableCommands: [
              "scan",
              "analyze",
              "generate",
              "deploy",
              "monitor",
              "cycle",
              "config",
              "clear_logs",
              "reset",
              "state",
            ],
          },
          { status: 400 }
        )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
