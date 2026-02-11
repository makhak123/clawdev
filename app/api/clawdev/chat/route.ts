// ============================================================
// ClawDev - Interactive AI Chat Interface
// Talk to ClawDev like a crypto trading partner
// ============================================================

import { streamText, tool, convertToModelMessages } from "ai"
import { z } from "zod"
import { AI_CONFIG } from "@/lib/clawdev/config"
import {
  getAgentState,
  runScan,
  runAnalysis,
  runGenerate,
  runDeploy,
  runFullCycle,
} from "@/lib/clawdev/agent"

export async function POST(req: Request) {
  const { messages } = await req.json()

  const state = getAgentState()

  const result = streamText({
    model: AI_CONFIG.MODEL,
    system: `You are ClawDev, the world's first AI crypto developer agent. You live on pump.fun (Solana) and your job is to analyze the market, generate winning token ideas, and help deploy them.

Your personality:
- You speak like a based crypto degen but with deep analytical intelligence
- You're confident but honest about risks
- You use crypto slang naturally (WAGMI, NGMI, LFG, ape in, degen, etc.)
- You're always thinking about narratives, timing, and viral potential
- You have a pixel-art robot avatar (orange on black)

Current Agent State:
- Mode: ${state.currentMode}
- Running: ${state.isRunning}
- Ideas Generated: ${state.ideas.length}
- Deployed Tokens: ${state.deployedTokens.length}
- Sessions Run: ${state.sessionsRun}
- Last Scan: ${state.lastScanAt || "Never"}
- Market Sentiment: ${state.lastMarketSnapshot?.sentiment || "Unknown"}
- SOL Price: $${state.lastMarketSnapshot?.solPrice || "Unknown"}

You have access to tools that control the ClawDev agent. Use them when the user asks you to perform actions.
Always explain what you're doing and why. Format responses cleanly for a terminal UI.`,
    messages: await convertToModelMessages(messages),
    tools: {
      scanMarket: tool({
        description:
          "Scan pump.fun market conditions, trending tokens, and get AI analysis on current opportunities",
        inputSchema: z.object({}),
        execute: async () => {
          const result = await runScan()
          return {
            sentiment: result.snapshot.sentiment,
            solPrice: result.snapshot.solPrice,
            trendingNarratives: result.snapshot.trendingNarratives,
            topGainers: result.snapshot.topGainers.slice(0, 5).map((t) => ({
              symbol: t.symbol,
              marketCap: t.marketCap,
              narrative: t.narrative,
            })),
            aiDecision: result.decision,
          }
        },
      }),
      analyzeNarrative: tool({
        description:
          "Deep-dive analysis on a specific narrative or token category on pump.fun",
        inputSchema: z.object({
          narrative: z
            .string()
            .describe("The narrative or keyword to analyze (e.g., 'ai', 'cat memes', 'trump')"),
        }),
        execute: async ({ narrative }) => {
          const result = await runAnalysis(narrative)
          return {
            narrative: result.narrativeAnalysis,
            topTokens: result.tokenEvaluations.slice(0, 3),
          }
        },
      }),
      generateTokenIdeas: tool({
        description:
          "Generate new token ideas based on current market conditions using AI",
        inputSchema: z.object({
          count: z
            .number()
            .min(1)
            .max(5)
            .describe("Number of ideas to generate"),
        }),
        execute: async ({ count }) => {
          const ideas = await runGenerate(count)
          return {
            generated: ideas.length,
            ideas: ideas.map((i) => ({
              id: i.id,
              name: i.name,
              ticker: i.ticker,
              description: i.description,
              category: i.category,
              viralScore: i.viralScore,
              overallScore: i.overallScore,
              reasoning: i.reasoning,
            })),
          }
        },
      }),
      deployToken: tool({
        description:
          "Deploy a previously generated token idea to pump.fun",
        inputSchema: z.object({
          ideaId: z.string().describe("The ID of the token idea to deploy"),
        }),
        execute: async ({ ideaId }) => {
          const result = await runDeploy(ideaId)
          return result
        },
      }),
      runFullCycle: tool({
        description:
          "Run a full ClawDev cycle: scan -> analyze -> generate/deploy based on AI decision",
        inputSchema: z.object({}),
        execute: async () => {
          const result = await runFullCycle()
          return result
        },
      }),
      getAgentStatus: tool({
        description: "Get the current state and statistics of the ClawDev agent",
        inputSchema: z.object({}),
        execute: async () => {
          const s = getAgentState()
          return {
            mode: s.currentMode,
            ideasCount: s.ideas.length,
            deployedCount: s.deployedTokens.length,
            sessions: s.sessionsRun,
            lastScan: s.lastScanAt,
            sentiment: s.lastMarketSnapshot?.sentiment,
            recentLogs: s.logs.slice(0, 10).map((l) => ({
              level: l.level,
              module: l.module,
              message: l.message,
            })),
          }
        },
      }),
    },
    maxSteps: 5,
  })

  return result.toUIMessageStreamResponse()
}
