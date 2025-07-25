"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { TacSdk, Network } from "@tonappchain/sdk";

interface TacSdkContextValue {
  readonly tacSdk: TacSdk | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isInitialized: boolean;
  readonly reinitialize: () => Promise<void>;
}

const TacSdkContext = createContext<TacSdkContextValue | null>(null);

interface TacSdkProviderProps {
  readonly children: ReactNode;
}

export function TacSdkProvider({ children }: TacSdkProviderProps) {
  const [tacSdk, setTacSdk] = useState<TacSdk | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeSdk = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (tacSdk) {
        try {
          tacSdk.closeConnections();
        } catch (cleanupError) {
          console.warn(
            "Error cleaning up previous SDK instance:",
            cleanupError
          );
        }
      }

      console.log("Initializing TAC SDK for MAINNET...");

      const initTimeout = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("TAC SDK initialization timeout (30s)")),
          30000
        );
      });

      console.log("Starting SDK creation...");
      console.log("Network: MAINNET");

      try {
        const sdkPromise = TacSdk.create({
          network: Network.MAINNET,
        });

        console.log("SDK Promise created, waiting for resolution...");

        const sdk = (await Promise.race([sdkPromise, initTimeout])) as TacSdk;

        console.log("SDK Promise resolved");

        console.log("✓ SDK created successfully:", sdk);
        setTacSdk(sdk);
        console.log("✅ TAC SDK initialized successfully");
      } catch (createError) {
        console.error("Error during TacSdk.create:", createError);
        throw createError;
      }
    } catch (initError) {
      console.error("❌ TAC SDK initialization failed:", initError);
      setError(
        initError instanceof Error
          ? initError.message
          : "Failed to initialize TAC SDK"
      );
      setTacSdk(null);
    } finally {
      setIsLoading(false);
    }
  }, [tacSdk]);

  useEffect(() => {
    initializeSdk();

    return () => {
      if (tacSdk) {
        try {
          tacSdk.closeConnections();
        } catch (cleanupError) {
          console.warn("Error during SDK cleanup:", cleanupError);
        }
      }
    };
  }, []);

  const reinitialize = useCallback(async () => {
    await initializeSdk();
  }, [initializeSdk]);

  const contextValue = useMemo<TacSdkContextValue>(
    () => ({
      tacSdk,
      isLoading,
      error,
      isInitialized: !!tacSdk && !isLoading && !error,
      reinitialize,
    }),
    [tacSdk, isLoading, error, reinitialize]
  );

  return (
    <TacSdkContext.Provider value={contextValue}>
      {children}
    </TacSdkContext.Provider>
  );
}

export function useTacSdk(): TacSdkContextValue {
  const context = useContext(TacSdkContext);

  if (!context) {
    throw new Error(
      "useTacSdk must be used within a TacSdkProvider. " +
        "Make sure your component is wrapped with <TacSdkProvider>."
    );
  }

  return context;
}

export function useTacSdkStatus(): Pick<
  TacSdkContextValue,
  "isLoading" | "error" | "isInitialized"
> {
  const { isLoading, error, isInitialized } = useTacSdk();
  return { isLoading, error, isInitialized };
}
