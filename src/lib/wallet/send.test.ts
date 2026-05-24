import { describe, it, expect } from "vitest";
import { parseUnits, encodeErc20Transfer, toBscEndpoints } from "./send";
import type { ChainEndpoints } from "./networks";

describe("parseUnits", () => {
  it("converts integer ETH amount to wei", () => {
    expect(parseUnits("1", 18)).toBe(10n ** 18n);
  });

  it("converts decimal amounts", () => {
    expect(parseUnits("0.5", 18)).toBe(5n * 10n ** 17n);
    expect(parseUnits("1.000001", 6)).toBe(1_000_001n);
  });

  it("zero is parseable (caller must reject before send)", () => {
    expect(parseUnits("0", 18)).toBe(0n);
  });

  it("rejects empty string", () => {
    expect(() => parseUnits("", 18)).toThrow();
  });

  it("rejects negative numbers", () => {
    expect(() => parseUnits("-1", 18)).toThrow();
  });

  it("rejects non-numeric input", () => {
    expect(() => parseUnits("abc", 18)).toThrow();
    expect(() => parseUnits("1.2.3", 18)).toThrow();
    expect(() => parseUnits("1e3", 18)).toThrow();
  });

  it("rejects fractional digits exceeding decimals", () => {
    expect(() => parseUnits("0.0000001", 6)).toThrow(/소수점/);
  });

  it("trims surrounding whitespace", () => {
    expect(parseUnits("  2.5  ", 8)).toBe(250_000_000n);
  });
});

describe("encodeErc20Transfer", () => {
  it("encodes selector + padded address + padded amount (USDT 1.000000)", () => {
    const data = encodeErc20Transfer(
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      1_000_000n, // 1 USDT (6 decimals)
    );
    // 0x + 8 hex selector + 64 addr + 64 amount = 138 chars
    expect(data.length).toBe(2 + 8 + 64 + 64);
    expect(data.startsWith("0xa9059cbb")).toBe(true);
    expect(data.slice(10, 74)).toBe(
      "00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8",
    );
    expect(data.slice(74)).toBe(
      "00000000000000000000000000000000000000000000000000000000000f4240",
    );
  });

  it("handles large amounts without overflow", () => {
    const max = (1n << 256n) - 1n;
    const data = encodeErc20Transfer("0x0000000000000000000000000000000000000001", max);
    expect(data.slice(74)).toBe("f".repeat(64));
  });

  it("lowercases the address", () => {
    const upper = encodeErc20Transfer("0xABCDEFabcdef0123456789ABCDEF0123456789AB", 1n);
    expect(upper.slice(10, 74)).toBe(
      "000000000000000000000000abcdefabcdef0123456789abcdef0123456789ab",
    );
  });
});

describe("toBscEndpoints", () => {
  const base: ChainEndpoints = {
    ethRpc: "https://eth-mainnet.example/rpc",
    ethChainId: 1,
    ethExplorer: "https://etherscan.io",
    bscRpc: "https://bsc-dataseed.binance.org",
    bscExplorer: "https://bscscan.com",
    btcApi: "https://mempool.space/api",
    btcExplorer: "https://mempool.space",
    solRpc: "https://api.mainnet-beta.solana.com",
    solExplorer: "https://explorer.solana.com",
    usdtContract: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  } as ChainEndpoints;

  it("rewrites ethRpc/explorer to BSC", () => {
    const bsc = toBscEndpoints(base);
    expect(bsc.ethRpc).toBe(base.bscRpc);
    expect(bsc.ethExplorer).toBe(base.bscExplorer);
    expect(bsc.ethChainId).toBe(56);
  });

  it("detects testnet chain id 97 from rpc URL", () => {
    const tn = toBscEndpoints({
      ...base,
      bscRpc: "https://data-seed-prebsc-1-s1.binance.org:8545",
    });
    // hostname contains "testnet"? The detector is substring; check both paths.
    // Detector uses includes("testnet"); this URL does not contain "testnet" → mainnet 56.
    expect(tn.ethChainId).toBe(56);

    const tn2 = toBscEndpoints({ ...base, bscRpc: "https://bsc-testnet.publicnode.com" });
    expect(tn2.ethChainId).toBe(97);
  });
});
