/**
 * WalletConnect v2 (Reown WalletKit) 설정.
 *
 * Project ID 는 Reown Cloud (https://cloud.reown.com) 에서 발급한
 * publishable identifier 다. 클라이언트 번들에 노출되어도 안전한 값.
 *
 * VITE_WC_PROJECT_ID 환경변수가 있으면 그 값을 쓰고, 없으면 아래
 * fallback 상수를 사용한다. 사용자가 ID 를 주면 fallback 한 줄만 교체.
 */

const FALLBACK_PROJECT_ID = "2c92e08686c2b2f5e839a5eb27eeebb0";

export const WC_PROJECT_ID: string =
  (import.meta.env?.VITE_WC_PROJECT_ID as string | undefined) ?? FALLBACK_PROJECT_ID;

export const WC_METADATA = {
  name: "Supervizion Wallet",
  description: "Supervizion — Non-custodial multi-chain wallet (BTC · ETH · BSC · SOL)",
  url: "https://supervizion.ai",
  icons: ["https://supervizion.ai/icon-512.png"],
} as const;

/** 우리가 dApp 에게 노출하는 EVM 체인 목록 (CAIP-2) */
export const SUPPORTED_EIP155_CHAINS = [
  "eip155:1", // Ethereum mainnet
  "eip155:56", // BNB Smart Chain mainnet
  "eip155:97", // BNB Smart Chain testnet
] as const;

export type SupportedChain = (typeof SUPPORTED_EIP155_CHAINS)[number];

export const SUPPORTED_METHODS = [
  "personal_sign",
  "eth_sign",
  "eth_signTypedData",
  "eth_signTypedData_v4",
  "eth_sendTransaction",
  "eth_sendRawTransaction",
  "wallet_switchEthereumChain",
  "wallet_addEthereumChain",
] as const;

export const SUPPORTED_EVENTS = ["accountsChanged", "chainChanged"] as const;

/** chainId(number) → ChainEndpoints 분기에 쓸 정보 */
export function chainInfoFromEip155(caip2: string):
  | { kind: "eth"; chainId: 1; network: "mainnet" }
  | { kind: "bsc"; chainId: 56; network: "mainnet" }
  | { kind: "bsc"; chainId: 97; network: "testnet" }
  | null {
  switch (caip2) {
    case "eip155:1":
      return { kind: "eth", chainId: 1, network: "mainnet" };
    case "eip155:56":
      return { kind: "bsc", chainId: 56, network: "mainnet" };
    case "eip155:97":
      return { kind: "bsc", chainId: 97, network: "testnet" };
    default:
      return null;
  }
}

export function chainIdToCaip2(chainId: number): SupportedChain | null {
  if (chainId === 1) return "eip155:1";
  if (chainId === 56) return "eip155:56";
  if (chainId === 97) return "eip155:97";
  return null;
}

/** Placeholder value used before a real Reown Cloud project ID was issued. */
const PLACEHOLDER_PROJECT_ID = "YOUR_REOWN_PROJECT_ID";

export function isProjectIdConfigured(): boolean {
  return (
    WC_PROJECT_ID.length > 0 &&
    WC_PROJECT_ID !== PLACEHOLDER_PROJECT_ID &&
    // 32-char hex from Reown Cloud
    /^[0-9a-f]{32}$/i.test(WC_PROJECT_ID)
  );
}
