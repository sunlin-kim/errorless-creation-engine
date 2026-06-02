import { useEffect, useState } from "react";
import { hasWalletStoreHydrated, rehydrateWalletStore, useWalletStore } from "./store";

export function useWalletStoreHydrated() {
  const [hydrated, setHydrated] = useState(() => hasWalletStoreHydrated());

  useEffect(() => {
    const unsubscribeHydrate = useWalletStore.persist.onHydrate(() => setHydrated(false));
    const unsubscribeFinish = useWalletStore.persist.onFinishHydration(() => setHydrated(true));

    if (!useWalletStore.persist.hasHydrated()) {
      void rehydrateWalletStore()
        .catch((error) => {
          console.error("[wallet-debug] rehydrate failed", error);
          setHydrated(useWalletStore.persist.hasHydrated());
        });
    } else {
      setHydrated(true);
    }

    return () => {
      unsubscribeHydrate();
      unsubscribeFinish();
    };
  }, []);

  return hydrated;
}