// ============================================================
// ClawDev - Core Agent Orchestrator
// The brain that ties everything together
// Scans -> Analyzes -> Generates -> Deploys -> Monitors
// ============================================================

import { DEFAULT_STATE } from "./config"
import {
  buildMarketSnapshot,
  fetchLatestCoins,
  searchCoins,
  fetchLatestTrades,
  analyzeTradeFlow,
} from "./pump-fun"
import {
  analyzeMarketConditions,
  generateTokenIdeas,
  evaluateToken,
  analyzeNarrative,
  adviseExitStrategy,
} from "./analyzer"
import type {
  AgentState,
  AgentLog,
  AgentConfig,
  TokenIdea,
  MarketSnapshot,
  AIDecision,
  TokenEvaluation,
  NarrativeAnalysis,
} from "./types"

// ============================================================
// Agent Singleton
// ============================================================

let agentState: AgentState = { ...DEFAULT_STATE }

function createLog(
  level: AgentLog["level"],
  module: string,
  message: string,
  data?: Record<string, unknown>
): AgentLog {
  const log: AgentLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    data,
  }
  agentState.logs = [log, ...agentState.logs.slice(0, 499)]
  return log
}

// ============================================================
// Agent Control
// ============================================================

export function getAgentState(): AgentState {
  return { ...agentState }
}

export function updateConfig(config: Partial<AgentConfig>): AgentState {
  agentState.config = { ...agentState.config, ...config }
  createLog("info", "config", "Agent configuration updated", config as Record<string, unknown>)
  return getAgentState()
}

export function clearLogs(): void {
  agentState.logs = []
}

export function resetAgent(): AgentState {
  agentState = { ...DEFAULT_STATE, logs: [] }
  createLog("info", "agent", "Agent state reset to defaults")
  return getAgentState()
}

// ============================================================
// Phase 1: SCAN - Market Intelligence Gathering
// ============================================================

export async function runScan(): Promise<{
  snapshot: MarketSnapshot
  decision: AIDecision
}> {
  createLog("info", "scan", "Starting market scan...")
  agentState.currentMode = "scan"

  try {
    // Build comprehensive market snapshot
    const snapshot = await buildMarketSnapshot()
    agentState.lastMarketSnapshot = snapshot
    agentState.lastScanAt = new Date().toISOString()

    createLog("success", "scan", "Market snapshot captured", {
      sentiment: snapshot.sentiment,
      solPrice: snapshot.solPrice,
      topGainers: snapshot.topGainers.length,
      trendingNarratives: snapshot.trendingNarratives,
    })

    // Have AI analyze conditions and recommend action
    const decision = await analyzeMarketConditions(snapshot)

    createLog("ai", "scan", `AI Decision: ${decision.action}`, {
      confidence: decision.confidence,
      reasoning: decision.reasoning,
    })

    return { snapshot, decision }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    createLog("error", "scan", `Scan failed: ${errMsg}`)
    throw error
  }
}

// ============================================================
// Phase 2: ANALYZE - Deep Narrative & Token Analysis
// ============================================================

export async function runAnalysis(
  narrativeOrMint?: string
): Promise<{
  narrativeAnalysis?: NarrativeAnalysis
  tokenEvaluations: TokenEvaluation[]
}> {
  createLog("info", "analyze", "Starting deep analysis...")
  agentState.currentMode = "analyze"

  const snapshot =
    agentState.lastMarketSnapshot || (await buildMarketSnapshot())
  const tokenEvaluations: TokenEvaluation[] = []

  try {
    // If a specific narrative is provided, analyze it
    let narrativeResult: NarrativeAnalysis | undefined
    if (narrativeOrMint) {
      createLog("info", "analyze", `Analyzing narrative: ${narrativeOrMint}`)
      const relatedCoins = await searchCoins(narrativeOrMint)
      narrativeResult = await analyzeNarrative(
        narrativeOrMint,
        relatedCoins,
        snapshot
      )

      createLog("ai", "analyze", `Narrative "${narrativeOrMint}" analysis`, {
        strength: narrativeResult.strength,
        momentum: narrativeResult.momentum,
        recommendation: narrativeResult.recommendation,
        saturation: narrativeResult.saturation,
      })
    }

    // Evaluate top coins from latest
    const latestCoins = await fetchLatestCoins(20)
    const topCoins = latestCoins
      .filter((c) => c.usd_market_cap > 1000)
      .slice(0, 5)

    for (const coin of topCoins) {
      try {
        const trades = await fetchLatestTrades(coin.mint, 50)
        const tradeAnalysis = analyzeTradeFlow(trades)
        const evaluation = await evaluateToken(coin, tradeAnalysis, snapshot)

        tokenEvaluations.push(evaluation)

        createLog(
          evaluation.overallScore > 70 ? "success" : "info",
          "analyze",
          `Evaluated ${coin.symbol}: Score ${evaluation.overallScore}/100`,
          {
            recommendation: evaluation.recommendation,
            viralPotential: evaluation.viralPotential,
          }
        )
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown"
        createLog("warn", "analyze", `Failed to evaluate ${coin.symbol}: ${errMsg}`)
      }
    }

    return { narrativeAnalysis: narrativeResult, tokenEvaluations }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    createLog("error", "analyze", `Analysis failed: ${errMsg}`)
    throw error
  }
}

// ============================================================
// Phase 3: GENERATE - AI Token Idea Creation
// ============================================================

export async function runGenerate(count = 3): Promise<TokenIdea[]> {
  createLog("info", "generate", `Generating ${count} token ideas...`)
  agentState.currentMode = "generate"

  try {
    const snapshot =
      agentState.lastMarketSnapshot || (await buildMarketSnapshot())

    const ideas = await generateTokenIdeas(snapshot, count)

    // Filter by minimum scores from config
    const qualifiedIdeas = ideas.filter(
      (idea) =>
        idea.viralScore >= agentState.config.minViralScore &&
        idea.overallScore >= agentState.config.minOverallScore
    )

    // Add to state
    agentState.ideas = [...qualifiedIdeas, ...agentState.ideas]

    for (const idea of qualifiedIdeas) {
      createLog("success", "generate", `Generated: ${idea.name} ($${idea.ticker})`, {
        viralScore: idea.viralScore,
        overallScore: idea.overallScore,
        category: idea.category,
        narrative: idea.narrative,
      })
    }

    if (qualifiedIdeas.length < ideas.length) {
      createLog(
        "warn",
        "generate",
        `${ideas.length - qualifiedIdeas.length} ideas filtered out (below minimum scores)`
      )
    }

    return qualifiedIdeas
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    createLog("error", "generate", `Generation failed: ${errMsg}`)
    throw error
  }
}

// ============================================================
// Phase 4: DEPLOY - Token Deployment Pipeline
// ============================================================

export async function runDeploy(ideaId: string): Promise<{
  success: boolean
  message: string
  idea: TokenIdea | null
}> {
  createLog("info", "deploy", `Preparing to deploy idea: ${ideaId}`)
  agentState.currentMode = "deploy"

  const idea = agentState.ideas.find((i) => i.id === ideaId)
  if (!idea) {
    createLog("error", "deploy", `Idea ${ideaId} not found`)
    return { success: false, message: "Idea not found", idea: null }
  }

  // Check wallet configuration
  if (!agentState.config.walletPublicKey) {
    createLog("error", "deploy", "No wallet configured. Set SOLANA_WALLET_PUBLIC_KEY")
    return {
      success: false,
      message: "No wallet configured. Set SOLANA_WALLET_PUBLIC_KEY env var.",
      idea,
    }
  }

  // Check budget
  if (agentState.config.maxDeployBudgetSOL <= 0) {
    createLog("error", "deploy", "Deploy budget is 0 SOL")
    return { success: false, message: "Deploy budget is 0", idea }
  }

  // Check concurrent token limit
  const activeTokens = agentState.deployedTokens.filter(
    (t) => t.status === "live" || t.status === "monitoring"
  )
  if (activeTokens.length >= agentState.config.maxConcurrentTokens) {
    createLog("warn", "deploy", "Max concurrent tokens reached")
    return {
      success: false,
      message: `Max concurrent tokens (${agentState.config.maxConcurrentTokens}) reached`,
      idea,
    }
  }

  try {
    // Update idea status
    idea.status = "deploying"

    createLog("info", "deploy", `Token "${idea.name}" ($${idea.ticker}) ready for deployment`)
    createLog("info", "deploy", "Deployment requires wallet signing - use CLI or connect wallet")

    // In production, this would:
    // 1. Upload metadata to IPFS via pump.fun
    // 2. Build the create transaction
    // 3. Sign with wallet
    // 4. Submit to Solana
    // 5. Verify on-chain

    // For now, return the deployment package
    return {
      success: true,
      message: `Token "${idea.name}" ($${idea.ticker}) deployment package ready. Connect a Solana wallet to sign and deploy.`,
      idea,
    }
  } catch (error) {
    idea.status = "rejected"
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    createLog("error", "deploy", `Deploy failed: ${errMsg}`)
    return { success: false, message: errMsg, idea }
  }
}

// ============================================================
// Phase 5: MONITOR - Active Position Management
// ============================================================

export async function runMonitor(): Promise<{
  positions: Array<{
    symbol: string
    pnl: number
    shouldExit: boolean
    reasoning: string
  }>
}> {
  createLog("info", "monitor", "Monitoring active positions...")
  agentState.currentMode = "monitor"

  const snapshot =
    agentState.lastMarketSnapshot || (await buildMarketSnapshot())
  const positions: Array<{
    symbol: string
    pnl: number
    shouldExit: boolean
    reasoning: string
  }> = []

  const activeTokens = agentState.deployedTokens.filter(
    (t) => t.status === "live" || t.status === "monitoring"
  )

  for (const token of activeTokens) {
    try {
      const trades = await fetchLatestTrades(token.mintAddress, 50)
      const tradeAnalysis = analyzeTradeFlow(trades)

      const exitAdvice = await adviseExitStrategy(
        token.idea.name,
        token.currentMarketCap,
        token.initialBuySOL,
        token.currentMarketCap > 0
          ? token.initialBuySOL *
              (token.currentMarketCap / (token.idea.overallScore || 1))
          : token.initialBuySOL,
        tradeAnalysis,
        snapshot
      )

      positions.push({
        symbol: token.idea.ticker,
        pnl: 0,
        shouldExit: exitAdvice.shouldExit,
        reasoning: exitAdvice.reasoning,
      })

      if (exitAdvice.shouldExit) {
        createLog("warn", "monitor", `EXIT SIGNAL for $${token.idea.ticker}`, {
          exitPercentage: exitAdvice.exitPercentage,
          reasoning: exitAdvice.reasoning,
        })
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown"
      createLog("warn", "monitor", `Failed to monitor ${token.idea.ticker}: ${errMsg}`)
    }
  }

  return { positions }
}

// ============================================================
// Full Auto Cycle
// ============================================================

export async function runFullCycle(): Promise<{
  phase: string
  results: Record<string, unknown>
}> {
  createLog("info", "agent", "=== Starting Full ClawDev Cycle ===")
  agentState.sessionsRun++

  try {
    // Phase 1: Scan
    const { snapshot, decision } = await runScan()

    // Phase 2: Act based on AI decision
    switch (decision.action) {
      case "generate": {
        const ideas = await runGenerate(3)
        createLog("success", "agent", `Cycle complete: Generated ${ideas.length} ideas`)
        return {
          phase: "generate",
          results: {
            decision,
            ideas: ideas.map((i) => ({
              name: i.name,
              ticker: i.ticker,
              score: i.overallScore,
            })),
          },
        }
      }

      case "deploy": {
        const topIdea = agentState.ideas
          .filter((i) => i.status === "idea" || i.status === "approved")
          .sort((a, b) => b.overallScore - a.overallScore)[0]

        if (topIdea) {
          const deployResult = await runDeploy(topIdea.id)
          return { phase: "deploy", results: { decision, deployResult } }
        }
        // No ideas to deploy, generate instead
        const ideas = await runGenerate(3)
        return { phase: "generate", results: { decision, ideas } }
      }

      case "hold":
      case "exit": {
        const monitorResult = await runMonitor()
        return { phase: "monitor", results: { decision, ...monitorResult } }
      }

      case "wait":
      default: {
        createLog("info", "agent", "Market conditions unfavorable. Waiting...")
        return {
          phase: "wait",
          results: {
            decision,
            nextScanIn: agentState.config.scanIntervalMs / 1000,
          },
        }
      }
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    createLog("error", "agent", `Cycle failed: ${errMsg}`)
    return { phase: "error", results: { error: errMsg } }
  }
}
