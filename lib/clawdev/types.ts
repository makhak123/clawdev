// ============================================================
// ClawDev - AI Crypto Agent Types
// The first AI-powered crypto developer for pump.fun
// ============================================================

export type AgentMode = "scan" | "analyze" | "generate" | "deploy" | "monitor"

export type RiskLevel = "low" | "medium" | "high" | "degen"

export type TokenStatus =
  | "idea"
  | "analyzing"
  | "approved"
  | "rejected"
  | "deploying"
  | "live"
  | "monitoring"
  | "exited"

export type MarketSentiment =
  | "extreme_fear"
  | "fear"
  | "neutral"
  | "greed"
  | "extreme_greed"

// ============================================================
// Token & Coin Types
// ============================================================

export interface TokenIdea {
  id: string
  name: string
  ticker: string
  description: string
  narrative: string
  imagePrompt: string
  category: TokenCategory
  viralScore: number // 0-100
  riskScore: number // 0-100
  timingScore: number // 0-100
  overallScore: number // 0-100
  reasoning: string
  suggestedSupply: number
  createdAt: string
  status: TokenStatus
}

export type TokenCategory =
  | "meme"
  | "ai"
  | "animal"
  | "celebrity"
  | "political"
  | "gaming"
  | "defi"
  | "culture"
  | "absurdist"

export interface TokenMetadata {
  name: string
  symbol: string
  description: string
  image: string
  showName: boolean
  createdOn: string
  twitter?: string
  telegram?: string
  website?: string
}

export interface DeployedToken {
  id: string
  idea: TokenIdea
  metadata: TokenMetadata
  mintAddress: string
  bondingCurveAddress: string
  deployedAt: string
  initialBuySOL: number
  currentMarketCap: number
  currentPrice: number
  holders: number
  volume24h: number
  status: TokenStatus
}

// ============================================================
// Market Analysis Types
// ============================================================

export interface MarketSnapshot {
  timestamp: string
  solPrice: number
  totalPumpFunVolume: number
  trendingNarratives: string[]
  topGainers: TrendingToken[]
  recentGraduates: TrendingToken[]
  sentiment: MarketSentiment
  gasPrice: number
}

export interface TrendingToken {
  name: string
  symbol: string
  mintAddress: string
  marketCap: number
  volume24h: number
  priceChange24h: number
  holders: number
  age: string
  narrative: string
}

export interface NarrativeAnalysis {
  narrative: string
  strength: number // 0-100
  momentum: "rising" | "peaking" | "declining" | "dead"
  relatedTokens: string[]
  saturation: number // 0-100 how many tokens already exist
  recommendation: "launch" | "wait" | "avoid"
  reasoning: string
}

// ============================================================
// Agent State & Config
// ============================================================

export interface AgentConfig {
  mode: AgentMode
  riskTolerance: RiskLevel
  maxDeployBudgetSOL: number
  autoMode: boolean
  scanIntervalMs: number
  targetCategories: TokenCategory[]
  minViralScore: number
  minOverallScore: number
  maxConcurrentTokens: number
  solanaRpcUrl: string
  walletPublicKey: string
}

export interface AgentState {
  isRunning: boolean
  currentMode: AgentMode
  config: AgentConfig
  ideas: TokenIdea[]
  deployedTokens: DeployedToken[]
  totalPnL: number
  sessionsRun: number
  lastScanAt: string | null
  lastMarketSnapshot: MarketSnapshot | null
  logs: AgentLog[]
}

export interface AgentLog {
  id: string
  timestamp: string
  level: "info" | "warn" | "error" | "success" | "ai"
  module: string
  message: string
  data?: Record<string, unknown>
}

// ============================================================
// AI Decision Types
// ============================================================

export interface AIDecision {
  action: "generate" | "deploy" | "hold" | "exit" | "wait"
  confidence: number // 0-100
  reasoning: string
  data?: Record<string, unknown>
}

export interface TokenEvaluation {
  tokenId: string
  viralPotential: number
  marketTiming: number
  narrativeStrength: number
  uniqueness: number
  riskAssessment: number
  overallScore: number
  recommendation: "strong_buy" | "buy" | "hold" | "avoid"
  reasoning: string
}

// ============================================================
// Pump.fun API Types
// ============================================================

export interface PumpFunCoinData {
  mint: string
  name: string
  symbol: string
  description: string
  image_uri: string
  metadata_uri: string
  twitter: string | null
  telegram: string | null
  bonding_curve: string
  associated_bonding_curve: string
  creator: string
  created_timestamp: number
  raydium_pool: string | null
  complete: boolean
  virtual_sol_reserves: number
  virtual_token_reserves: number
  total_supply: number
  website: string | null
  show_name: boolean
  king_of_the_hill_timestamp: number | null
  market_cap: number
  reply_count: number
  last_reply: number | null
  nsfw: boolean
  market_id: string | null
  inverted: boolean | null
  usd_market_cap: number
}

export interface PumpFunTradeData {
  signature: string
  mint: string
  sol_amount: number
  token_amount: number
  is_buy: boolean
  user: string
  timestamp: number
  virtual_sol_reserves: number
  virtual_token_reserves: number
}
