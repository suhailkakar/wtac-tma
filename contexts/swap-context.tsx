"use client";

import {
  createContext,
  useContext,
  useReducer,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { SwapState, SwapAction, Token, TOKENS } from "@/types";
import {
  validateNumericInput,
  sanitizeNumericInput,
  validateSufficientBalance,
  isValidPositiveNumber,
} from "@/utils/validation";
import { priceService } from "@/services/price-service";
import { getAllBalances } from "@/services/wtac-service";

const initialState: SwapState = {
  inputValue: "0",
  inputToken: { ...TOKENS.WTAC, balance: "0" },
  outputToken: { ...TOKENS.TAC, balance: "0" },
  isLoading: false,
  error: null,
  estimatedOutput: "0",
  exchangeRate: 1,
};

function swapReducer(state: SwapState, action: SwapAction): SwapState {
  switch (action.type) {
    case "SET_INPUT_VALUE":
      const sanitizedValue = sanitizeNumericInput(action.payload as string);
      const validation = validateNumericInput(sanitizedValue);

      return {
        ...state,
        inputValue: sanitizedValue,
        error: validation.isValid
          ? null
          : validation.errors[0]?.message || "Invalid input",
        estimatedOutput: validation.isValid
          ? (parseFloat(sanitizedValue || "0") * state.exchangeRate).toString()
          : "0",
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload as boolean,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload as string,
        isLoading: false,
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    case "SET_ESTIMATED_OUTPUT":
      return {
        ...state,
        estimatedOutput: action.payload as string,
      };

    case "UPDATE_BALANCES":
      const { inputBalance, outputBalance } = action.payload as {
        inputBalance: string;
        outputBalance: string;
      };
      return {
        ...state,
        inputToken: { ...state.inputToken, balance: inputBalance },
        outputToken: { ...state.outputToken, balance: outputBalance },
      };

    default:
      return state;
  }
}

interface SwapContextValue extends SwapState {
  readonly setInputValue: (value: string) => void;
  readonly setLoading: (loading: boolean) => void;
  readonly setError: (error: string) => void;
  readonly clearError: () => void;
  readonly validateBalance: () => boolean;
  readonly canSwap: boolean;
  readonly fiatValue: string;
  readonly outputFiatValue: string;
  readonly tokenPrice: number;
  readonly refreshPrice: () => Promise<void>;
  readonly refreshBalances: (userAddress: string, tacSdk: any) => Promise<void>;
  readonly isTransacting: boolean;
  readonly setTransacting: (loading: boolean) => void;
  readonly transactionProgress: string;
  readonly setTransactionProgress: (progress: string) => void;
}

const SwapContext = createContext<SwapContextValue | null>(null);

interface SwapProviderProps {
  readonly children: ReactNode;
  readonly mockExchangeRate?: number;
}

export function SwapProvider({
  children,
  mockExchangeRate = 1,
}: SwapProviderProps) {
  const [state, dispatch] = useReducer(swapReducer, {
    ...initialState,
    exchangeRate: mockExchangeRate,
  });

  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [isTransacting, setIsTransacting] = useState<boolean>(false);
  const [transactionProgress, setTransactionProgress] = useState<string>("");

  const setInputValue = useCallback((value: string) => {
    dispatch({ type: "SET_INPUT_VALUE", payload: value });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  const setError = useCallback((error: string) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const setTransacting = useCallback((loading: boolean) => {
    setIsTransacting(loading);
  }, []);

  const refreshPrice = useCallback(async () => {
    try {
      setLoading(true);

      const price = await priceService.getPrice("TAC");
      setTokenPrice(price);
    } catch (error) {
      console.error("Failed to fetch token price:", error);
      setError("Failed to fetch current token price");
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false);

  const refreshBalances = useCallback(
    async (userAddress: string, tacSdk: any) => {
      // Prevent concurrent balance fetches
      if (isRefreshingBalances) {
        console.log("Balance refresh already in progress, skipping...");
        return;
      }

      try {
        setIsRefreshingBalances(true);

        if (!userAddress || !tacSdk) {
          dispatch({
            type: "UPDATE_BALANCES",
            payload: {
              inputBalance: "0.0000",
              outputBalance: "0.0000",
            },
          });
          return;
        }

        const balances = await getAllBalances(tacSdk, userAddress);

        // Only update if we're still refreshing (prevent stale updates)
        if (isRefreshingBalances) {
          dispatch({
            type: "UPDATE_BALANCES",
            payload: {
              inputBalance: balances.wtac.formatted,
              outputBalance: balances.tac.formatted,
            },
          });
        }
      } catch (error) {
        console.error("Failed to fetch balances:", error);
        // Don't update state on error to prevent showing stale data
      } finally {
        setIsRefreshingBalances(false);
      }
    },
    [isRefreshingBalances]
  );

  const validateBalance = useCallback(() => {
    const balanceValidation = validateSufficientBalance(
      state.inputValue,
      state.inputToken.balance
    );

    if (!balanceValidation.isValid) {
      setError(balanceValidation.errors[0]?.message || "Insufficient balance");
      return false;
    }

    clearError();
    return true;
  }, [state.inputValue, state.inputToken.balance, setError, clearError]);

  const canSwap = useMemo(() => {
    return (
      !state.isLoading &&
      !isTransacting &&
      !state.error &&
      isValidPositiveNumber(state.inputValue) &&
      parseFloat(state.inputValue) <= parseFloat(state.inputToken.balance)
    );
  }, [
    state.isLoading,
    isTransacting,
    state.error,
    state.inputValue,
    state.inputToken.balance,
  ]);

  const fiatValue = useMemo(() => {
    const numValue = parseFloat(state.inputValue || "0");
    return (numValue * tokenPrice).toFixed(2);
  }, [state.inputValue, tokenPrice]);

  const outputFiatValue = useMemo(() => {
    const numValue = parseFloat(state.estimatedOutput || "0");

    return (numValue * tokenPrice).toFixed(2);
  }, [state.estimatedOutput, tokenPrice]);

  useEffect(() => {
    refreshPrice();
  }, [refreshPrice]);

  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [state.error, clearError]);

  const contextValue = useMemo<SwapContextValue>(
    () => ({
      ...state,
      setInputValue,
      setLoading,
      setError,
      clearError,
      validateBalance,
      canSwap,
      fiatValue,
      outputFiatValue,
      tokenPrice,
      refreshPrice,
      refreshBalances,
      isTransacting,
      setTransacting,
      transactionProgress,
      setTransactionProgress,
    }),
    [
      state,
      setInputValue,
      setLoading,
      setError,
      clearError,
      validateBalance,
      canSwap,
      fiatValue,
      outputFiatValue,
      tokenPrice,
      refreshPrice,
      refreshBalances,
      isTransacting,
      setTransacting,
      transactionProgress,
      setTransactionProgress,
    ]
  );

  return (
    <SwapContext.Provider value={contextValue}>{children}</SwapContext.Provider>
  );
}

export function useSwap(): SwapContextValue {
  const context = useContext(SwapContext);

  if (!context) {
    throw new Error(
      "useSwap must be used within a SwapProvider. " +
        "Make sure your component is wrapped with <SwapProvider>."
    );
  }

  return context;
}
