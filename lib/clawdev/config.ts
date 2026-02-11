// ============================================================
// ClawDev - Agent Configuration
// ============================================================

import type { AgentConfig, AgentState } from "./types"

export const DEFAULT_CONFIG: AgentConfig = {
  mode: "scan",
  riskTolerance: "medium",
  maxDeployBudgetSOL: 0.5,
  autoMode: false,
  scanIntervalMs: 30000, // 30 seconds
  targetCategories: ["meme", "ai", "culture", "absurdist"],
  minViralScore: 70,
  minOverallScore: 65,
  maxConcurrentTokens: 3,
  solanaRpcUrl:
    process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  walletPublicKey: process.env.SOLANA_WALLET_PUBLIC_KEY || "",
}

export const DEFAULT_STATE: AgentState = {
  isRunning: false,
  currentMode: "scan",
  config: DEFAULT_CONFIG,
  ideas: [],
  deployedTokens: [],
  totalPnL: 0,
  sessionsRun: 0,
  lastScanAt: null,
  lastMarketSnapshot: null,
  logs: [],
}

// pump.fun API endpoints
export const PUMP_FUN_API = {
  BASE: "https://frontend-api.pump.fun",
  COINS: "/coins",
  COIN_DATA: "/coins/{mint}",
  TRADES: "/trades/latest",
  KING_OF_THE_HILL: "/coins/king-of-the-hill",
  CURRENTLY_LIVE: "/coins/currently-live",
  NEW_COINS: "/coins/latest",
  GRADUATED: "/coins/graduated",
  SEARCH: "/coins/search",
} as const

// Solana program addresses
export const SOLANA_ADDRESSES = {
  PUMP_FUN_PROGRAM: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
  PUMP_FUN_FEE_ACCOUNT: "CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbCJ8waxipFk86",
  SYSTEM_PROGRAM: "11111111111111111111111111111111",
  TOKEN_PROGRAM: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  ASSOCIATED_TOKEN_PROGRAM: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  RENT_PROGRAM: "SysvarRent111111111111111111111111111111111",
  SOL_MINT: "So11111111111111111111111111111111111111112",
} as const

// AI model configuration
export const AI_CONFIG = {
  MODEL: "anthropic/claude-sonnet-4-20250514",
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.7,
  ANALYSIS_MODEL: "anthropic/claude-sonnet-4-20250514",
} as const

// Narrative categories and keywords for scanning
export const NARRATIVE_KEYWORDS: Record<string, string[]> = {
  ai: [
    "ai",
    "artificial",
    "intelligence",
    "gpt",
    "claude",
    "neural",
    "machine",
    "learning",
    "bot",
    "agent",
  ],
  meme: [
    "pepe",
    "doge",
    "wojak",
    "chad",
    "based",
    "frog",
    "cat",
    "dog",
    "moon",
    "wen",
  ],
  political: [
    "trump",
    "biden",
    "elon",
    "politics",
    "freedom",
    "america",
    "government",
  ],
  gaming: [
    "game",
    "play",
    "nft",
    "metaverse",
    "pixel",
    "quest",
    "battle",
    "rpg",
  ],
  culture: [
    "internet",
    "viral",
    "tiktok",
    "twitter",
    "trending",
    "gen",
    "zoomer",
  ],
  absurdist: [
    "chaos",
    "random",
    "weird",
    "cursed",
    "blessed",
    "surreal",
    "abstract",
  ],
  animal: [
    "cat",
    "dog",
    "shiba",
    "monkey",
    "ape",
    "bear",
    "bull",
    "whale",
    "fish",
  ],
  defi: [
    "swap",
    "yield",
    "stake",
    "farm",
    "pool",
    "liquidity",
    "protocol",
    "vault",
  ],
}
