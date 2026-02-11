// ============================================================
// ClawDev - Solana Blockchain Utilities
// Wallet management, transaction building, and on-chain ops
// ============================================================

import { SOLANA_ADDRESSES } from "./config"

// ============================================================
// Types
// ============================================================

export interface WalletInfo {
  publicKey: string
  balanceSOL: number
  balanceLamports: number
}

export interface TransactionResult {
  success: boolean
  signature: string | null
  error: string | null
}

export interface TokenAccount {
  mint: string
  amount: number
  decimals: number
}

// ============================================================
// RPC Client
// ============================================================

export class SolanaRPC {
  private rpcUrl: string

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl
  }

  private async rpcCall(method: string, params: unknown[] = []): Promise<unknown> {
    const res = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      }),
    })

    if (!res.ok) throw new Error(`RPC error: ${res.status}`)
    const data = await res.json()
    if (data.error) throw new Error(`RPC error: ${data.error.message}`)
    return data.result
  }

  async getBalance(publicKey: string): Promise<number> {
    const result = await this.rpcCall("getBalance", [publicKey]) as { value: number }
    return (result?.value || 0) / 1e9 // Convert lamports to SOL
  }

  async getRecentBlockhash(): Promise<string> {
    const result = await this.rpcCall("getLatestBlockhash") as { value: { blockhash: string } }
    return result?.value?.blockhash || ""
  }

  async getTokenAccountsByOwner(
    ownerPublicKey: string
  ): Promise<TokenAccount[]> {
    const result = await this.rpcCall("getTokenAccountsByOwner", [
      ownerPublicKey,
      { programId: SOLANA_ADDRESSES.TOKEN_PROGRAM },
      { encoding: "jsonParsed" },
    ]) as {
      value: Array<{
        account: {
          data: {
            parsed: {
              info: {
                mint: string
                tokenAmount: { uiAmount: number; decimals: number }
              }
            }
          }
        }
      }>
    }

    if (!result?.value) return []

    type TokenAccountResult = {
      account: {
        data: {
          parsed: {
            info: {
              mint: string
              tokenAmount: { uiAmount: number; decimals: number }
            }
          }
        }
      }
    }

    return result.value.map((account: TokenAccountResult) => ({
      mint: account.account.data.parsed.info.mint,
      amount: account.account.data.parsed.info.tokenAmount.uiAmount,
      decimals: account.account.data.parsed.info.tokenAmount.decimals,
    }))
  }

  async getSignaturesForAddress(
    address: string,
    limit = 10
  ): Promise<Array<{ signature: string; blockTime: number | null }>> {
    const result = await this.rpcCall("getSignaturesForAddress", [
      address,
      { limit },
    ]) as Array<{ signature: string; blockTime: number | null }>
    return (result || []) as Array<{ signature: string; blockTime: number | null }>
  }

  async getTransaction(signature: string): Promise<unknown> {
    return await this.rpcCall("getTransaction", [
      signature,
      { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
    ])
  }

  async getAccountInfo(publicKey: string): Promise<unknown> {
    return await this.rpcCall("getAccountInfo", [
      publicKey,
      { encoding: "jsonParsed" },
    ])
  }

  async getSlot(): Promise<number> {
    return (await this.rpcCall("getSlot")) as number
  }

  async getHealth(): Promise<string> {
    return (await this.rpcCall("getHealth")) as string
  }
}

// ============================================================
// Wallet Utilities
// ============================================================

export async function getWalletInfo(
  rpcUrl: string,
  publicKey: string
): Promise<WalletInfo> {
  const rpc = new SolanaRPC(rpcUrl)
  const balanceSOL = await rpc.getBalance(publicKey)

  return {
    publicKey,
    balanceSOL,
    balanceLamports: Math.floor(balanceSOL * 1e9),
  }
}

export async function getWalletTokens(
  rpcUrl: string,
  publicKey: string
): Promise<TokenAccount[]> {
  const rpc = new SolanaRPC(rpcUrl)
  return await rpc.getTokenAccountsByOwner(publicKey)
}

// ============================================================
// Transaction Utilities
// ============================================================

// Base58 encoding for Solana addresses/signatures
const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

export function isValidSolanaAddress(address: string): boolean {
  if (address.length < 32 || address.length > 44) return false
  for (const char of address) {
    if (!BASE58_ALPHABET.includes(char)) return false
  }
  return true
}

export function lamportsToSOL(lamports: number): number {
  return lamports / 1e9
}

export function solToLamports(sol: number): number {
  return Math.floor(sol * 1e9)
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

// ============================================================
// pump.fun Specific Transaction Helpers
// ============================================================

export interface PumpFunCreateParams {
  name: string
  symbol: string
  metadataUri: string
  creator: string
  initialBuyLamports: number
}

// Build the instruction data for pump.fun token creation
// In production, this would use the actual pump.fun program IDL
export function buildPumpFunCreateInstruction(
  params: PumpFunCreateParams
): {
  programId: string
  keys: Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }>
  data: string
} {
  return {
    programId: SOLANA_ADDRESSES.PUMP_FUN_PROGRAM,
    keys: [
      { pubkey: params.creator, isSigner: true, isWritable: true },
      {
        pubkey: SOLANA_ADDRESSES.PUMP_FUN_FEE_ACCOUNT,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: SOLANA_ADDRESSES.SYSTEM_PROGRAM,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SOLANA_ADDRESSES.TOKEN_PROGRAM,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SOLANA_ADDRESSES.ASSOCIATED_TOKEN_PROGRAM,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SOLANA_ADDRESSES.RENT_PROGRAM,
        isSigner: false,
        isWritable: false,
      },
    ],
    data: JSON.stringify({
      instruction: "create",
      name: params.name,
      symbol: params.symbol,
      uri: params.metadataUri,
      initialBuyLamports: params.initialBuyLamports,
    }),
  }
}

// Build buy instruction for an existing pump.fun token
export function buildPumpFunBuyInstruction(
  mint: string,
  bondingCurve: string,
  buyer: string,
  solAmount: number
): {
  programId: string
  keys: Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }>
  data: string
} {
  return {
    programId: SOLANA_ADDRESSES.PUMP_FUN_PROGRAM,
    keys: [
      { pubkey: buyer, isSigner: true, isWritable: true },
      { pubkey: bondingCurve, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      {
        pubkey: SOLANA_ADDRESSES.PUMP_FUN_FEE_ACCOUNT,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: SOLANA_ADDRESSES.SYSTEM_PROGRAM,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SOLANA_ADDRESSES.TOKEN_PROGRAM,
        isSigner: false,
        isWritable: false,
      },
    ],
    data: JSON.stringify({
      instruction: "buy",
      mint,
      solAmount: solToLamports(solAmount),
      slippageBps: 500, // 5% slippage
    }),
  }
}

// Build sell instruction for a pump.fun token
export function buildPumpFunSellInstruction(
  mint: string,
  bondingCurve: string,
  seller: string,
  tokenAmount: number
): {
  programId: string
  keys: Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }>
  data: string
} {
  return {
    programId: SOLANA_ADDRESSES.PUMP_FUN_PROGRAM,
    keys: [
      { pubkey: seller, isSigner: true, isWritable: true },
      { pubkey: bondingCurve, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      {
        pubkey: SOLANA_ADDRESSES.PUMP_FUN_FEE_ACCOUNT,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: SOLANA_ADDRESSES.SYSTEM_PROGRAM,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SOLANA_ADDRESSES.TOKEN_PROGRAM,
        isSigner: false,
        isWritable: false,
      },
    ],
    data: JSON.stringify({
      instruction: "sell",
      mint,
      tokenAmount,
      slippageBps: 500,
    }),
  }
}

// ============================================================
// Monitoring Utilities
// ============================================================

export async function monitorBondingCurve(
  rpcUrl: string,
  bondingCurveAddress: string
): Promise<{
  solReserves: number
  tokenReserves: number
  progress: number
} | null> {
  try {
    const rpc = new SolanaRPC(rpcUrl)
    const accountInfo = await rpc.getAccountInfo(bondingCurveAddress) as {
      value?: {
        lamports: number
        data: { parsed?: { info?: { solReserves?: number; tokenReserves?: number } } }
      }
    }
    if (!accountInfo?.value) return null

    const solReserves = lamportsToSOL(accountInfo.value.lamports)
    // Graduation happens at ~85 SOL in reserves
    const GRADUATION_SOL = 85
    const progress = Math.min((solReserves / GRADUATION_SOL) * 100, 100)

    return {
      solReserves,
      tokenReserves: 0,
      progress,
    }
  } catch (error) {
    console.error("[ClawDev] Failed to monitor bonding curve:", error)
    return null
  }
}
