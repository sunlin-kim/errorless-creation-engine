import { Link } from "@tanstack/react-router";
import { type Asset, fmtKrw, fmtNum } from "@/lib/wallet-data";

export function AssetRow({ asset }: { asset: Asset }) {
  const value = asset.balance * asset.priceKrw;
  const positive = asset.change24h >= 0;
  return (
    <Link
      to="/asset/$id"
      params={{ id: asset.id }}
      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-container transition-colors"
    >
      <span
        className="h-11 w-11 shrink-0 rounded-full grid place-items-center text-white text-sm font-semibold"
        style={{ backgroundColor: asset.color }}
      >
        {asset.symbol[0]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-on-surface truncate">{asset.name}</p>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
            {asset.network}
          </span>
        </div>
        <p className="text-xs text-on-surface-variant tnum">
          {fmtNum(asset.balance, 4)} {asset.symbol}
        </p>
      </div>
      <div className="text-right">
        <p className="font-medium tnum text-on-surface">{fmtKrw(value)}</p>
        <p className={`text-xs tnum ${positive ? "text-success" : "text-destructive"}`}>
          {positive ? "+" : ""}
          {asset.change24h.toFixed(2)}%
        </p>
      </div>
    </Link>
  );
}
