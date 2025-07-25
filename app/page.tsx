"use client";

import { useCallback, useEffect } from "react";
import Header from "@/components/header";
import AssetInput from "@/components/swap/asset-input";
import ArrowDivider from "@/components/swap/arrow-divider";
import AssetOutputSimple from "@/components/swap/asset-output-simple";
import Message from "@/components/swap/message";
import PresetButtons from "@/components/swap/preset-buttons";
import NumericKeypad from "@/components/swap/numeric-keypad";
import ActionButton from "@/components/swap/action-button";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { useSwap } from "@/contexts/swap-context";
import { useTacSdk } from "@/contexts/tac-sdk-context";
import { TOKENS } from "@/types";
import { sanitizeNumericInput } from "@/utils/validation";
import { withdrawWtacToTac, parseWtacAmount } from "@/services/wtac-service";

export default function Home() {
  const userFriendlyAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const {
    inputValue,
    inputToken,
    outputToken,
    setInputValue,
    fiatValue,
    outputFiatValue,
    error,
    isLoading,
    canSwap,
    validateBalance,
    tokenPrice,
    refreshBalances,
    isTransacting,
    setTransacting,
    transactionProgress,
    setTransactionProgress,
  } = useSwap();

  const {
    tacSdk,
    isLoading: tacSdkLoading,
    error: tacSdkError,
    isInitialized: tacSdkInitialized,
  } = useTacSdk();

  useEffect(() => {
    console.log("TON Connect UI initialized:", !!tonConnectUI);
    console.log("User address:", userFriendlyAddress);
    console.log("TAC SDK initialized:", tacSdkInitialized);
    console.log("TAC SDK instance:", !!tacSdk);
  }, [tonConnectUI, userFriendlyAddress, tacSdkInitialized, tacSdk]);

  useEffect(() => {
    if (userFriendlyAddress && tacSdk && tacSdkInitialized) {
      console.log("Refreshing balances for:", userFriendlyAddress);
      refreshBalances(userFriendlyAddress, tacSdk);
    } else if (!userFriendlyAddress) {
      console.log("Wallet disconnected, clearing balances");
      refreshBalances("", null);
    }
  }, [userFriendlyAddress, tacSdk, tacSdkInitialized, refreshBalances]);

  const handleConnectWallet = useCallback(() => {
    console.log("Attempting to connect wallet...");
    
    if (!tonConnectUI) {
      console.error("TON Connect UI not initialized");
      setTransactionProgress("Wallet connection unavailable");
      return;
    }

    try {
      tonConnectUI.openModal();
      console.log("openModal called successfully");
    } catch (error) {
      console.error("Error opening wallet modal:", error);
      setTransactionProgress("Failed to open wallet connection");
      setTimeout(() => setTransactionProgress(""), 3000);
    }
  }, [tonConnectUI, setTransactionProgress]);

  const handleKeyPress = useCallback(
    (key: string) => {
      const currentValue = inputValue;
      let newValue: string;

      if (currentValue === "0" && key !== "." && key !== "0") {
        newValue = key;
      } else {
        newValue = currentValue + key;
      }

      const sanitized = sanitizeNumericInput(newValue);
      setInputValue(sanitized);
    },
    [inputValue, setInputValue]
  );

  const handleBackspace = useCallback(() => {
    const currentValue = inputValue;
    if (currentValue.length <= 1) {
      setInputValue("0");
    } else {
      setInputValue(currentValue.slice(0, -1));
    }
  }, [inputValue, setInputValue]);

  const handlePresetSelect = useCallback(
    (percentage: number) => {
      const balance = parseFloat(inputToken.balance);
      const amount = (balance * percentage).toString();
      const sanitized = sanitizeNumericInput(amount || "0");
      setInputValue(sanitized);
    },
    [inputToken.balance, setInputValue]
  );

  const handleSwap = useCallback(async () => {
    if (!userFriendlyAddress) {
      handleConnectWallet();
      return;
    }

    if (!validateBalance()) {
      return;
    }

    if (!tacSdk || !tacSdkInitialized) {
      console.error("TAC SDK not ready");
      return;
    }

    try {
      setTransacting(true);
      setTransactionProgress("Processing...");

      console.log("Starting WTAC to TAC withdrawal:", {
        amount: inputValue,
        from: inputToken.symbol,
        to: outputToken.symbol,
      });

      let amountBigInt: bigint;
      try {
        amountBigInt = parseWtacAmount(inputValue, inputToken.decimals);
      } catch (parseError) {
        console.error("Amount parsing failed:", parseError);
        setTransactionProgress("");
        // TODO: Show user-friendly error message
        return;
      }

      const result = await withdrawWtacToTac(
        tacSdk,
        tonConnectUI,
        amountBigInt,
        3,
        setTransactionProgress
      );

      console.log("Withdrawal successful:", result);

      setTransactionProgress("Updating balances...");

      await refreshBalances(userFriendlyAddress, tacSdk);

      console.log("✅ Transaction complete and balances updated");
    } catch (error) {
      console.error("Withdrawal failed:", error);
      setTransactionProgress("");
    } finally {
      setTransacting(false);
      setTransactionProgress("");
    }
  }, [
    userFriendlyAddress,
    handleConnectWallet,
    validateBalance,
    inputValue,
    inputToken.symbol,
    inputToken.decimals,
    outputToken.symbol,
    tacSdk,
    tacSdkInitialized,
    tonConnectUI,
    refreshBalances,
    setTransacting,
    setTransactionProgress,
  ]);

  const wtacToken = inputToken;
  const tacToken = outputToken;

  const getMessage = () => {
    if (!userFriendlyAddress) {
      return "Connect wallet to continue";
    }
    if (tacSdkError) {
      return `TAC SDK Error: ${tacSdkError}`;
    }
    if (tacSdkLoading) {
      return "Initializing TAC SDK...";
    }
    if (!tacSdkInitialized) {
      return "TAC SDK not ready";
    }
    if (error) {
      return error;
    }
    if (isLoading) {
      return "Loading...";
    }
    if (tacSdkInitialized) {
      return "";
    }
    return "";
  };

  return (
    <div className="max-w-2xl w-full mx-auto relative min-h-screen flex flex-col bg-white border border-gray-100">
      <Header />

      <div className="px-4">
        <AssetInput
          value={inputValue}
          onValueChange={setInputValue}
          token={wtacToken}
          fiatValue={fiatValue}
          error={error || undefined}
          isReadOnly={false}
        />

        <ArrowDivider />

        <AssetOutputSimple
          token={tacToken}
          value={inputValue}
          fiatValue={outputFiatValue}
          isLoading={isLoading}
        />

        <Message text={getMessage()} tokenPrice={tokenPrice} />
      </div>

      <div className="flex-1"></div>

      <div className="px-4 pb-4">
        <PresetButtons
          onPresetSelect={handlePresetSelect}
          availableBalance={wtacToken.balance}
          disabled={isLoading}
        />

        <div className="mb-4">
          <NumericKeypad
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            disabled={isLoading}
          />
        </div>

        <ActionButton
          text={
            !userFriendlyAddress
              ? "Connect Wallet"
              : isTransacting
              ? transactionProgress || "Unwrapping..."
              : inputValue && parseFloat(inputValue) > 0
              ? `Unwrap ${inputValue} TAC`
              : "Unwrap Token"
          }
          onClick={handleSwap}
          disabled={(!canSwap && !!userFriendlyAddress) || isTransacting}
          isLoading={isTransacting}
        />
      </div>
    </div>
  );
}
