/**
 * 네트워크 엔드포인트 — Step 2: 공개 RPC + 가격 API (API 키 불필요).
 * Step 5에서 Alchemy/Etherscan 으로 업그레이드 예정.
 */
import type { NetworkEnv } from "./store";

export interface ChainEndpoints {
  ethRpc: string;
  ethChainId: number;
  ethExplorer: string;
  btcApi: string; // mempool.space base
  btcExplorer: string;
  // USDT (ERC-20) — mainnet only
  usdtContract?: string;
  // BSC (BNB Smart Chain)
  bscRpc: string;
  bscExplorer: string;
  // Solana JSON-RPC
  solRpc: string;
  solExplorer: string;
  // DUCKY (SPL token) — mainnet only
  duckyMint?: string;
  label: string;
}

export function getEndpoints(env: NetworkEnv): ChainEndpoints {
  if (env === "mainnet") {
    return {
      ethRpc: "https://ethereum-rpc.publicnode.com",
      ethChainId: 1,
      ethExplorer: "https://etherscan.io",
      btcApi: "https://mempool.space/api",
      btcExplorer: "https://mempool.space",
      usdtContract: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      bscRpc: "https://bsc-rpc.publicnode.com",
      bscExplorer: "https://bscscan.com",
      solRpc: "https://api.mainnet-beta.solana.com",
      solExplorer: "https://explorer.solana.com",
      duckyMint: "DE8NNksD5m3Kd4ohJAzTwJHLss9zbXdNUegEoL4QxD4C",
      label: "Mainnet",
    };
  }
  return {
    ethRpc: "https://ethereum-sepolia-rpc.publicnode.com",
    ethChainId: 11155111,
    ethExplorer: "https://sepolia.etherscan.io",
    btcApi: "https://mempool.space/testnet/api",
    btcExplorer: "https://mempool.space/testnet",
    bscRpc: "https://bsc-testnet-rpc.publicnode.com",
    bscExplorer: "https://testnet.bscscan.com",
    solRpc: "https://api.devnet.solana.com",
    solExplorer: "https://explorer.solana.com/?cluster=devnet",
    label: "Testnet (Sepolia + BTC testnet)",
  };
}
