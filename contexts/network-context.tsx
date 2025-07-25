"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { Network, NetworkContextValue, NETWORKS } from "@/types";

const NetworkContext = createContext<NetworkContextValue | null>(null);

interface NetworkProviderProps {
  readonly children: ReactNode;
  readonly defaultNetwork?: Network;
}

export function NetworkProvider({
  children,
  defaultNetwork = "testnet",
}: NetworkProviderProps) {
  const [network, setNetworkState] = useState<Network>(defaultNetwork);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const saved = localStorage.getItem("tac-network");
    if (saved && (saved === "mainnet" || saved === "testnet")) {
      setNetworkState(saved as Network);
    }
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("tac-network", network);
    }
  }, [network, isHydrated]);

  const toggleNetwork = useCallback(() => {
    setNetworkState((current) =>
      current === "testnet" ? "mainnet" : "testnet"
    );
  }, []);

  const setNetwork = useCallback(
    (newNetwork: Network) => {
      if (newNetwork !== network) {
        setNetworkState(newNetwork);
      }
    },
    [network]
  );

  const contextValue = useMemo<NetworkContextValue>(
    () => ({
      ...NETWORKS[network],
      toggleNetwork,
      setNetwork,
    }),
    [network, toggleNetwork, setNetwork]
  );

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error(
      "useNetwork must be used within a NetworkProvider. " +
        "Make sure your component is wrapped with <NetworkProvider>."
    );
  }

  return context;
}

export function useIsTestnet(): boolean {
  const { isTestnet } = useNetwork();
  return isTestnet;
}
