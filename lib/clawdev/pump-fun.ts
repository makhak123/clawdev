// ============================================================
// ClawDev - pump.fun Integration Layer
// Real API integration with pump.fun for token data & deployment
// ============================================================

import { PUMP_FUN_API } from "./config"
import type {
  PumpFunCoinData,
  PumpFunTradeData,
  TrendingToken,
  TokenMetadata,
  MarketSnapshot,
  MarketSentiment,
} from "./types"

// ============================================================
// Data Fetching
// ============================================================

export async function fetchLatestCoins(
  limit = 50,
  offset = 0
): Promise<PumpFunCoinData[]> {
  try {
    const res = await fetch(
      `${PUMP_FUN_API.BASE}${PUMP_FUN_API.NEW_COINS}?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "ClawDev/1.0",
        },
        next: { revalidate: 15 },
      }
    )
    if (!res.ok) throw new Error(`pump.fun API error: ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error("[ClawDev] Failed to fetch latest coins:", error)
    return []
  }
}

export async function fetchKingOfTheHill(): Promise<PumpFunCoinData | null> {
  try {
    const res = await fetch(
      `${PUMP_FUN_API.BASE}${PUMP_FUN_API.KING_OF_THE_HILL}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "ClawDev/1.0",
        },
        next: { revalidate: 10 },
      }
    )
    if (!res.ok) throw new Error(`pump.fun API error: ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error("[ClawDev] Failed to fetch KOTH:", error)
    return null
  }
}

export async function fetchCoinData(
  mint: string
): Promise<PumpFunCoinData | null> {
  try {
    const url = `${PUMP_FUN_API.BASE}${PUMP_FUN_API.COIN_DATA.replace("{mint}", mint)}`
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ClawDev/1.0",
      },
      next: { revalidate: 5 },
    })
    if (!res.ok) throw new Error(`pump.fun API error: ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error(`[ClawDev] Failed to fetch coin ${mint}:`, error)
    return null
  }
}

export async function fetchLatestTrades(
  mint: string,
  limit = 50
): Promise<PumpFunTradeData[]> {
  try {
    const res = await fetch(
      `${PUMP_FUN_API.BASE}${PUMP_FUN_API.TRADES}?mint=${mint}&limit=${limit}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "ClawDev/1.0",
        },
        next: { revalidate: 5 },
      }
    )
    if (!res.ok) throw new Error(`pump.fun API error: ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error(`[ClawDev] Failed to fetch trades for ${mint}:`, error)
    return []
  }
}

export async function fetchGraduatedCoins(
  limit = 20
): Promise<PumpFunCoinData[]> {
  try {
    const res = await fetch(
      `${PUMP_FUN_API.BASE}${PUMP_FUN_API.GRADUATED}?limit=${limit}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "ClawDev/1.0",
        },
        next: { revalidate: 30 },
      }
    )
    if (!res.ok) throw new Error(`pump.fun API error: ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error("[ClawDev] Failed to fetch graduated coins:", error)
    return []
  }
}

export async function searchCoins(query: string): Promise<PumpFunCoinData[]> {
  try {
    const res = await fetch(
      `${PUMP_FUN_API.BASE}${PUMP_FUN_API.SEARCH}?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "ClawDev/1.0",
        },
        next: { revalidate: 10 },
      }
    )
    if (!res.ok) throw new Error(`pump.fun API error: ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error(`[ClawDev] Search failed for "${query}":`, error)
    return []
  }
}

// ============================================================
// Market Analysis Helpers
// ============================================================

export function calculateMarketCap(coin: PumpFunCoinData): number {
  if (coin.usd_market_cap) return coin.usd_market_cap
  if (coin.virtual_sol_reserves && coin.virtual_token_reserves) {
    const pricePerToken =
      coin.virtual_sol_reserves / coin.virtual_token_reserves
    return pricePerToken * coin.total_supply
  }
  return 0
}

export function calculateBondingCurveProgress(coin: PumpFunCoinData): number {
  // pump.fun graduates at ~$69k market cap
  const GRADUATION_THRESHOLD = 69000
  const currentMcap = calculateMarketCap(coin)
  return Math.min((currentMcap / GRADUATION_THRESHOLD) * 100, 100)
}

export function coinToTrendingToken(coin: PumpFunCoinData): TrendingToken {
  const ageMs = Date.now() - coin.created_timestamp * 1000
  const ageHours = Math.floor(ageMs / (1000 * 60 * 60))
  const ageDays = Math.floor(ageHours / 24)

  return {
    name: coin.name,
    symbol: coin.symbol,
    mintAddress: coin.mint,
    marketCap: coin.usd_market_cap || calculateMarketCap(coin),
    volume24h: 0, // calculated separately from trades
    priceChange24h: 0,
    holders: 0,
    age: ageDays > 0 ? `${ageDays}d` : `${ageHours}h`,
    narrative: categorizeNarrative(coin),
  }
}

function categorizeNarrative(coin: PumpFunCoinData): string {
  const text =
    `${coin.name} ${coin.symbol} ${coin.description}`.toLowerCase()
  if (
    text.includes("ai") ||
    text.includes("bot") ||
    text.includes("agent") ||
    text.includes("gpt")
  )
    return "AI"
  if (
    text.includes("pepe") ||
    text.includes("doge") ||
    text.includes("wojak") ||
    text.includes("meme")
  )
    return "Meme"
  if (
    text.includes("cat") ||
    text.includes("dog") ||
    text.includes("shiba") ||
    text.includes("animal")
  )
    return "Animal"
  if (
    text.includes("trump") ||
    text.includes("political") ||
    text.includes("elon")
  )
    return "Political"
  if (
    text.includes("game") ||
    text.includes("play") ||
    text.includes("nft")
  )
    return "Gaming"
  return "Culture"
}

// ============================================================
// Market Snapshot Builder
// ============================================================

export async function buildMarketSnapshot(): Promise<MarketSnapshot> {
  const [latestCoins, koth, graduated] = await Promise.all([
    fetchLatestCoins(100),
    fetchKingOfTheHill(),
    fetchGraduatedCoins(10),
  ])

  // Analyze narratives from latest coins
  const narrativeCounts: Record<string, number> = {}
  for (const coin of latestCoins) {
    const narrative = categorizeNarrative(coin)
    narrativeCounts[narrative] = (narrativeCounts[narrative] || 0) + 1
  }

  const trendingNarratives = Object.entries(narrativeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([narrative]) => narrative)

  // Build top gainers from coins with highest market cap
  const topGainers = latestCoins
    .filter((c) => c.usd_market_cap > 0)
    .sort((a, b) => (b.usd_market_cap || 0) - (a.usd_market_cap || 0))
    .slice(0, 10)
    .map(coinToTrendingToken)

  // Recently graduated coins
  const recentGraduates = graduated.slice(0, 5).map(coinToTrendingToken)

  // Determine sentiment based on market activity
  const avgMcap =
    topGainers.reduce((sum, t) => sum + t.marketCap, 0) /
    (topGainers.length || 1)
  let sentiment: MarketSentiment = "neutral"
  if (avgMcap > 100000) sentiment = "extreme_greed"
  else if (avgMcap > 50000) sentiment = "greed"
  else if (avgMcap > 10000) sentiment = "neutral"
  else if (avgMcap > 5000) sentiment = "fear"
  else sentiment = "extreme_fear"

  // Fetch SOL price
  let solPrice = 0
  try {
    const solRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      { next: { revalidate: 60 } }
    )
    if (solRes.ok) {
      const solData = await solRes.json()
      solPrice = solData?.solana?.usd || 0
    }
  } catch {
    solPrice = 0
  }

  return {
    timestamp: new Date().toISOString(),
    solPrice,
    totalPumpFunVolume: 0,
    trendingNarratives,
    topGainers,
    recentGraduates,
    sentiment,
    gasPrice: 0.000005, // Solana base fee
  }
}

// ============================================================
// Token Deployment (Instruction Builder)
// ============================================================

export interface CreateTokenInstruction {
  name: string
  symbol: string
  description: string
  imageUri: string
  initialBuySOL: number
  // The actual on-chain transaction requires a Solana keypair
  // This builds the metadata & instruction params
}

export function buildCreateTokenInstruction(
  metadata: TokenMetadata,
  initialBuySOL: number
): CreateTokenInstruction {
  return {
    name: metadata.name,
    symbol: metadata.symbol,
    description: metadata.description,
    imageUri: metadata.image,
    initialBuySOL,
  }
}

// pump.fun token creation via their IPFS + on-chain flow
export async function uploadTokenMetadata(
  metadata: TokenMetadata
): Promise<{ metadataUri: string } | null> {
  try {
    // pump.fun uses IPFS for metadata storage
    // In production, this would upload to IPFS via pump.fun's API
    const formData = new FormData()
    formData.append("name", metadata.name)
    formData.append("symbol", metadata.symbol)
    formData.append("description", metadata.description)
    formData.append("showName", String(metadata.showName))

    if (metadata.twitter) formData.append("twitter", metadata.twitter)
    if (metadata.telegram) formData.append("telegram", metadata.telegram)
    if (metadata.website) formData.append("website", metadata.website)

    // In production: POST to pump.fun's metadata endpoint
    // const res = await fetch('https://pump.fun/api/ipfs', {
    //   method: 'POST',
    //   body: formData,
    // })

    return {
      metadataUri: `https://arweave.net/placeholder-${Date.now()}`,
    }
  } catch (error) {
    console.error("[ClawDev] Failed to upload metadata:", error)
    return null
  }
}

// ============================================================
// Trade Analysis
// ============================================================

export interface TradeAnalysis {
  totalBuys: number
  totalSells: number
  buyVolume: number
  sellVolume: number
  netFlow: number
  uniqueBuyers: number
  uniqueSellers: number
  avgBuySize: number
  avgSellSize: number
  buyPressure: number // 0-100
  isWhaleActivity: boolean
  largestTrade: number
}

export function analyzeTradeFlow(trades: PumpFunTradeData[]): TradeAnalysis {
  const buys = trades.filter((t) => t.is_buy)
  const sells = trades.filter((t) => !t.is_buy)

  const buyVolume = buys.reduce((sum, t) => sum + t.sol_amount, 0)
  const sellVolume = sells.reduce((sum, t) => sum + t.sol_amount, 0)
  const uniqueBuyers = new Set(buys.map((t) => t.user)).size
  const uniqueSellers = new Set(sells.map((t) => t.user)).size

  const allAmounts = trades.map((t) => t.sol_amount)
  const largestTrade = Math.max(...allAmounts, 0)
  const avgTrade =
    allAmounts.reduce((a, b) => a + b, 0) / (allAmounts.length || 1)

  return {
    totalBuys: buys.length,
    totalSells: sells.length,
    buyVolume,
    sellVolume,
    netFlow: buyVolume - sellVolume,
    uniqueBuyers,
    uniqueSellers,
    avgBuySize: buyVolume / (buys.length || 1),
    avgSellSize: sellVolume / (sells.length || 1),
    buyPressure:
      buys.length + sells.length > 0
        ? (buys.length / (buys.length + sells.length)) * 100
        : 50,
    isWhaleActivity: largestTrade > avgTrade * 10,
    largestTrade,
  }
}
