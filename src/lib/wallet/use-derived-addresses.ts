import { useEffect, useState } from "react";
import { toast } from "sonner";
import { deriveAddresses } from "./derive";
import { useWalletStore } from "./store";
import { useT } from "@/lib/i18n";

type DerivedAddressSet = {
  eth: string;
  btc: string;
  bnb: string;
  sol: string;
};

export function useDerivedAddresses() {
  const t = useT();
  const mnemonic = useWalletStore((s) => s.mnemonic);
  const network = useWalletStore((s) => s.network);
  const cachedAddresses = useWalletStore((s) => s.derivedAddresses[s.network]);
  const setDerivedAddresses = useWalletStore((s) => s.setDerivedAddresses);
  const [addresses, setAddresses] = useState<DerivedAddressSet | null>(cachedAddresses);

  useEffect(() => {
    if (!mnemonic) {
      setAddresses(null);
      return;
    }

    if (cachedAddresses) {
      setAddresses(cachedAddresses);
      return;
    }

    let cancelled = false;

    deriveAddresses(mnemonic, network)
      .then((result) => {
        if (cancelled) return;
        const next = {
          eth: result.eth,
          btc: result.btc,
          bnb: result.bnb,
          sol: result.sol,
        };
        setAddresses(next);
        setDerivedAddresses(network, next);
      })
      .catch(() => {
        if (cancelled) return;
        setAddresses(null);
        toast.error(t("wallet.derivFailed"));
      });

    return () => {
      cancelled = true;
    };
  }, [cachedAddresses, mnemonic, network, setDerivedAddresses, t]);

  return addresses;
}
