// ============================================================
// ClawDev - AI-Powered Market Analyzer
// Uses Claude to analyze market conditions, narratives, and
// determine optimal token creation strategies
// ============================================================

import { generateText, Output } from "ai"
import { z } from "zod"
import { AI_CONFIG } from "./config"
import type {
  MarketSnapshot,
  NarrativeAnalysis,
  TokenEvaluation,
  AIDecision,
  TokenIdea,
  PumpFunCoinData,
} from "./types"
import type { TradeAnalysis } from "./pump-fun"

// ============================================================
// Market Sentiment Analysis
// ============================================================

export async function analyzeMarketConditions(
  snapshot: MarketSnapshot
): Promise<AIDecision> {
  const { output } = await generateText({
    model: AI_CONFIG.MODEL,
    output: Output.object({
      schema: z.object({
        action: z.enum(["generate", "deploy", "hold", "exit", "wait"]),
        confidence: z.number().min(0).max(100),
        reasoning: z.string(),
        marketPhase: z.string(),
        riskLevel: z.string(),
        topOpportunity: z.string().nullable(),
      }),
    }),
    prompt: `You are ClawDev, an elite AI crypto agent specialized in pump.fun token creation and trading on Solana.

Analyze the current market conditions and decide the best action:

MARKET SNAPSHOT:
- SOL Price: $${snapshot.solPrice}
- Market Sentiment: ${snapshot.sentiment}
- Trending Narratives: ${snapshot.trendingNarratives.join(", ")}
- Top Gainers: ${snapshot.topGainers
      .slice(0, 5)
      .map((t) => `${t.symbol} ($${t.marketCap.toLocaleString()})`)
      .join(", ")}
- Recent Graduates: ${snapshot.recentGraduates
      .map((t) => `${t.symbol} ($${t.marketCap.toLocaleString()})`)
      .join(", ")}

ACTIONS:
- "generate": Create new token ideas (market is favorable for new launches)
- "deploy": Deploy a previously generated token (timing is right)
- "hold": Keep monitoring existing positions
- "exit": Sell existing positions (market turning bearish)
- "wait": Market conditions unfavorable, wait for better entry

Consider: market sentiment, narrative momentum, graduation rate, and SOL price stability.
Provide a confidence score (0-100) and detailed reasoning.`,
  })

  if (!output) {
    return {
      action: "wait",
      confidence: 0,
      reasoning: "Failed to analyze market conditions",
    }
  }

  return {
    action: output.action,
    confidence: output.confidence,
    reasoning: output.reasoning,
    data: {
      marketPhase: output.marketPhase,
      riskLevel: output.riskLevel,
      topOpportunity: output.topOpportunity,
    },
  }
}

// ============================================================
// Narrative Analysis
// ============================================================

export async function analyzeNarrative(
  narrative: string,
  relatedCoins: PumpFunCoinData[],
  snapshot: MarketSnapshot
): Promise<NarrativeAnalysis> {
  const coinSummary = relatedCoins
    .slice(0, 10)
    .map(
      (c) =>
        `${c.name} (${c.symbol}): $${c.usd_market_cap.toLocaleString()} mcap, ${c.reply_count} replies`
    )
    .join("\n")

  const { output } = await generateText({
    model: AI_CONFIG.ANALYSIS_MODEL,
    output: Output.object({
      schema: z.object({
        strength: z.number().min(0).max(100),
        momentum: z.enum(["rising", "peaking", "declining", "dead"]),
        saturation: z.number().min(0).max(100),
        recommendation: z.enum(["launch", "wait", "avoid"]),
        reasoning: z.string(),
        uniqueAngle: z.string(),
        riskFactors: z.array(z.string()),
      }),
    }),
    prompt: `You are ClawDev, analyzing the "${narrative}" narrative on pump.fun.

EXISTING COINS IN THIS NARRATIVE:
${coinSummary || "None found"}

MARKET CONTEXT:
- Overall Sentiment: ${snapshot.sentiment}
- Trending: ${snapshot.trendingNarratives.join(", ")}

Analyze:
1. Narrative strength (0-100): How strong is this trend?
2. Momentum: Is it rising, peaking, declining, or dead?
3. Saturation (0-100): How crowded is this space?
4. Should we launch a token in this narrative?
5. What unique angle could differentiate a new token?
6. What are the key risk factors?

Be brutally honest. Most narratives are oversaturated.`,
  })

  if (!output) {
    return {
      narrative,
      strength: 0,
      momentum: "dead",
      relatedTokens: relatedCoins.map((c) => c.symbol),
      saturation: 100,
      recommendation: "avoid",
      reasoning: "Analysis failed",
    }
  }

  return {
    narrative,
    strength: output.strength,
    momentum: output.momentum,
    relatedTokens: relatedCoins.map((c) => c.symbol),
    saturation: output.saturation,
    recommendation: output.recommendation,
    reasoning: output.reasoning,
  }
}

// ============================================================
// Token Evaluation
// ============================================================

export async function evaluateToken(
  coin: PumpFunCoinData,
  tradeAnalysis: TradeAnalysis,
  snapshot: MarketSnapshot
): Promise<TokenEvaluation> {
  const { output } = await generateText({
    model: AI_CONFIG.ANALYSIS_MODEL,
    output: Output.object({
      schema: z.object({
        viralPotential: z.number().min(0).max(100),
        marketTiming: z.number().min(0).max(100),
        narrativeStrength: z.number().min(0).max(100),
        uniqueness: z.number().min(0).max(100),
        riskAssessment: z.number().min(0).max(100),
        recommendation: z.enum(["strong_buy", "buy", "hold", "avoid"]),
        reasoning: z.string(),
      }),
    }),
    prompt: `You are ClawDev, evaluating a pump.fun token for potential.

TOKEN:
- Name: ${coin.name} (${coin.symbol})
- Description: ${coin.description}
- Market Cap: $${coin.usd_market_cap.toLocaleString()}
- Created: ${new Date(coin.created_timestamp * 1000).toISOString()}
- Replies: ${coin.reply_count}
- Has graduated to Raydium: ${coin.complete ? "Yes" : "No"}
- NSFW: ${coin.nsfw}

TRADE FLOW:
- Buy/Sell Ratio: ${tradeAnalysis.totalBuys}/${tradeAnalysis.totalSells}
- Buy Pressure: ${tradeAnalysis.buyPressure.toFixed(1)}%
- Net Flow: ${tradeAnalysis.netFlow.toFixed(4)} SOL
- Unique Buyers: ${tradeAnalysis.uniqueBuyers}
- Whale Activity: ${tradeAnalysis.isWhaleActivity ? "DETECTED" : "None"}

MARKET CONTEXT:
- SOL Price: $${snapshot.solPrice}
- Sentiment: ${snapshot.sentiment}

Score each dimension 0-100 and provide recommendation.
Consider memeability, community engagement, buy pressure, and market timing.`,
  })

  if (!output) {
    return {
      tokenId: coin.mint,
      viralPotential: 0,
      marketTiming: 0,
      narrativeStrength: 0,
      uniqueness: 0,
      riskAssessment: 100,
      overallScore: 0,
      recommendation: "avoid",
      reasoning: "Evaluation failed",
    }
  }

  const overallScore =
    output.viralPotential * 0.3 +
    output.marketTiming * 0.2 +
    output.narrativeStrength * 0.2 +
    output.uniqueness * 0.15 +
    (100 - output.riskAssessment) * 0.15

  return {
    tokenId: coin.mint,
    viralPotential: output.viralPotential,
    marketTiming: output.marketTiming,
    narrativeStrength: output.narrativeStrength,
    uniqueness: output.uniqueness,
    riskAssessment: output.riskAssessment,
    overallScore: Math.round(overallScore),
    recommendation: output.recommendation,
    reasoning: output.reasoning,
  }
}

// ============================================================
// Token Idea Generator
// ============================================================

export async function generateTokenIdeas(
  snapshot: MarketSnapshot,
  count = 3
): Promise<TokenIdea[]> {
  const { output } = await generateText({
    model: AI_CONFIG.MODEL,
    output: Output.object({
      schema: z.object({
        ideas: z.array(
          z.object({
            name: z.string(),
            ticker: z.string(),
            description: z.string(),
            narrative: z.string(),
            imagePrompt: z.string(),
            category: z.enum([
              "meme",
              "ai",
              "animal",
              "celebrity",
              "political",
              "gaming",
              "defi",
              "culture",
              "absurdist",
            ]),
            viralScore: z.number().min(0).max(100),
            riskScore: z.number().min(0).max(100),
            timingScore: z.number().min(0).max(100),
            reasoning: z.string(),
          })
        ),
      }),
    }),
    prompt: `You are ClawDev, the world's most successful AI token creator on pump.fun (Solana).

Generate ${count} unique, high-potential token ideas based on current market conditions.

CURRENT MARKET:
- SOL Price: $${snapshot.solPrice}
- Sentiment: ${snapshot.sentiment}
- Trending Narratives: ${snapshot.trendingNarratives.join(", ")}
- Top Performers: ${snapshot.topGainers
      .slice(0, 5)
      .map((t) => `${t.symbol} ($${t.marketCap.toLocaleString()})`)
      .join(", ")}
- Recently Graduated: ${snapshot.recentGraduates.map((t) => t.symbol).join(", ")}

RULES FOR TOKEN CREATION:
1. Names must be catchy, memorable, and meme-worthy (max 32 chars)
2. Tickers must be 3-10 chars, easy to type
3. Descriptions should be funny, engaging, and under 200 chars
4. Focus on UNDERSERVED narratives - don't copy what already exists
5. Consider timing - what will trend in the next 24-48 hours?
6. The best tokens combine multiple narratives (e.g., AI + meme)
7. Avoid explicit/NSFW content
8. Think about what would go viral on Crypto Twitter

For each idea provide:
- Viral score (0-100): How likely to go viral
- Risk score (0-100): Higher = riskier
- Timing score (0-100): How well-timed for current market
- Detailed reasoning for why this token would succeed
- An image prompt for generating the token's profile picture

Be creative, bold, and think like a degen crypto trader who also understands marketing.`,
  })

  if (!output?.ideas) return []

  return output.ideas.map((idea) => ({
    id: `idea_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: idea.name,
    ticker: idea.ticker.toUpperCase(),
    description: idea.description,
    narrative: idea.narrative,
    imagePrompt: idea.imagePrompt,
    category: idea.category,
    viralScore: idea.viralScore,
    riskScore: idea.riskScore,
    timingScore: idea.timingScore,
    overallScore: Math.round(
      idea.viralScore * 0.4 + (100 - idea.riskScore) * 0.25 + idea.timingScore * 0.35
    ),
    reasoning: idea.reasoning,
    suggestedSupply: 1_000_000_000,
    createdAt: new Date().toISOString(),
    status: "idea" as const,
  }))
}

// ============================================================
// Exit Strategy Advisor
// ============================================================

export async function adviseExitStrategy(
  tokenName: string,
  currentMcap: number,
  initialInvestment: number,
  currentValue: number,
  tradeAnalysis: TradeAnalysis,
  snapshot: MarketSnapshot
): Promise<{
  shouldExit: boolean
  exitPercentage: number
  reasoning: string
  priceTarget: number | null
}> {
  const pnlPercent = ((currentValue - initialInvestment) / initialInvestment) * 100

  const { output } = await generateText({
    model: AI_CONFIG.ANALYSIS_MODEL,
    output: Output.object({
      schema: z.object({
        shouldExit: z.boolean(),
        exitPercentage: z.number().min(0).max(100),
        reasoning: z.string(),
        priceTarget: z.number().nullable(),
      }),
    }),
    prompt: `You are ClawDev's risk management AI. Advise on exit strategy.

TOKEN: ${tokenName}
- Current Market Cap: $${currentMcap.toLocaleString()}
- Initial Investment: ${initialInvestment} SOL
- Current Value: ${currentValue} SOL
- PnL: ${pnlPercent.toFixed(2)}%
- Buy Pressure: ${tradeAnalysis.buyPressure.toFixed(1)}%
- Whale Activity: ${tradeAnalysis.isWhaleActivity ? "DETECTED" : "None"}
- Net Flow: ${tradeAnalysis.netFlow.toFixed(4)} SOL

MARKET:
- Sentiment: ${snapshot.sentiment}

Rules:
- Always take profit at 5x+
- Consider partial exits (sell 25-75% of position)
- If buy pressure drops below 40%, consider full exit
- Whale sells are major red flags
- Never be greedy - the pump.fun game is about quick entries and exits`,
  })

  if (!output) {
    return {
      shouldExit: pnlPercent > 200,
      exitPercentage: 100,
      reasoning: "Defaulting to exit on high profit",
      priceTarget: null,
    }
  }

  return output
}

// ============================================================
// Competitive Analysis
// ============================================================

export async function analyzeCompetition(
  proposedName: string,
  proposedCategory: string,
  existingCoins: PumpFunCoinData[]
): Promise<{
  competitionLevel: "low" | "medium" | "high" | "extreme"
  differentiators: string[]
  threats: string[]
  recommendation: string
}> {
  const { output } = await generateText({
    model: AI_CONFIG.ANALYSIS_MODEL,
    output: Output.object({
      schema: z.object({
        competitionLevel: z.enum(["low", "medium", "high", "extreme"]),
        differentiators: z.array(z.string()),
        threats: z.array(z.string()),
        recommendation: z.string(),
      }),
    }),
    prompt: `Analyze competition for proposed token "${proposedName}" in the "${proposedCategory}" category.

EXISTING COMPETITORS:
${existingCoins
  .slice(0, 15)
  .map(
    (c) =>
      `- ${c.name} (${c.symbol}): $${c.usd_market_cap.toLocaleString()} mcap, ${c.reply_count} replies, graduated: ${c.complete}`
  )
  .join("\n")}

Assess competition level, identify differentiators we could leverage, list threats, and provide a recommendation.`,
  })

  if (!output) {
    return {
      competitionLevel: "high",
      differentiators: [],
      threats: ["Analysis unavailable"],
      recommendation: "Proceed with caution",
    }
  }

  return output
}
