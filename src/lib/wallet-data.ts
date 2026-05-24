export type Network = "Ethereum" | "BSC" | "Polygon" | "Arbitrum" | "Base" | "Solana" | "Bitcoin";

export type Asset = {
  id: string;
  symbol: string;
  name: string;
  network: Network;
  balance: number;
  priceKrw: number;
  change24h: number;
  color: string;
};

export const assets: Asset[] = [
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    network: "Bitcoin",
    balance: 0.4821,
    priceKrw: 142_350_000,
    change24h: 1.84,
    color: "#F7931A",
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    network: "Ethereum",
    balance: 4.215,
    priceKrw: 5_120_000,
    change24h: -0.62,
    color: "#627EEA",
  },
  {
    id: "usdt",
    symbol: "USDT",
    name: "Tether",
    network: "Ethereum",
    balance: 12_480.55,
    priceKrw: 1_378,
    change24h: 0.01,
    color: "#26A17B",
  },
  {
    id: "sol",
    symbol: "SOL",
    name: "Solana",
    network: "Solana",
    balance: 82.4,
    priceKrw: 218_400,
    change24h: 4.21,
    color: "#9945FF",
  },
  {
    id: "matic",
    symbol: "MATIC",
    name: "Polygon",
    network: "Polygon",
    balance: 3210.0,
    priceKrw: 980,
    change24h: -1.12,
    color: "#8247E5",
  },
  {
    id: "bnb",
    symbol: "BNB",
    name: "BNB",
    network: "BSC",
    balance: 2.45,
    priceKrw: 820_000,
    change24h: 2.04,
    color: "#F3BA2F",
  },
];

export type TxStatus = "success" | "pending" | "failed";
export type TxKind = "send" | "receive" | "swap" | "stake";

export type Tx = {
  id: string;
  kind: TxKind;
  status: TxStatus;
  asset: string;
  amount: number;
  counterparty: string;
  network: Network;
  timestamp: string; // ISO
  feeKrw: number;
};

export const transactions: Tx[] = [
  {
    id: "0xa1f9...c20d",
    kind: "receive",
    status: "success",
    asset: "ETH",
    amount: 1.25,
    counterparty: "0x9b2c...44Aa",
    network: "Ethereum",
    timestamp: "2026-05-21T09:42:00+09:00",
    feeKrw: 4200,
  },
  {
    id: "0xb284...88e1",
    kind: "send",
    status: "pending",
    asset: "USDT",
    amount: 2400,
    counterparty: "0x71c8...0e22",
    network: "Ethereum",
    timestamp: "2026-05-21T08:18:00+09:00",
    feeKrw: 6800,
  },
  {
    id: "0xc910...1124",
    kind: "swap",
    status: "success",
    asset: "SOL → USDT",
    amount: 12.0,
    counterparty: "Jupiter",
    network: "Solana",
    timestamp: "2026-05-20T22:05:00+09:00",
    feeKrw: 320,
  },
  {
    id: "0xd00f...77fa",
    kind: "stake",
    status: "success",
    asset: "ETH",
    amount: 0.5,
    counterparty: "Lido",
    network: "Ethereum",
    timestamp: "2026-05-20T15:30:00+09:00",
    feeKrw: 5200,
  },
  {
    id: "0xe456...aa01",
    kind: "send",
    status: "failed",
    asset: "MATIC",
    amount: 120,
    counterparty: "0x4a8e...bb91",
    network: "Polygon",
    timestamp: "2026-05-19T11:12:00+09:00",
    feeKrw: 180,
  },
  {
    id: "0xf991...cd31",
    kind: "receive",
    status: "success",
    asset: "BTC",
    amount: 0.02,
    counterparty: "bc1q...x7y2",
    network: "Bitcoin",
    timestamp: "2026-05-18T18:00:00+09:00",
    feeKrw: 12000,
  },
];

export const totalKrw = () => assets.reduce((sum, a) => sum + a.balance * a.priceKrw, 0);

export const fmtKrw = (n: number) =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtNum = (n: number, maxFrac = 6) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFrac }).format(n);

export const findAsset = (id: string) => assets.find((a) => a.id === id);
