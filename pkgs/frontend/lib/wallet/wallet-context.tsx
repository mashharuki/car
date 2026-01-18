"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import {
  usePlateWalletCreation,
  type WalletCreationResult,
} from "./use-plate-wallet";

const WalletContext = createContext<WalletCreationResult | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = usePlateWalletCreation();
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletCreationResult {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("WalletProviderが必要です");
  }
  return context;
}
