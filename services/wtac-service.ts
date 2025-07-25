"use client";

import { ethers } from "ethers";
import {
  AssetBridgingData,
  AssetType,
  SenderFactory,
  TacSdk,
  OperationTracker,
} from "@tonappchain/sdk";
import { Address } from "@ton/core";
import { TonConnectUI } from "@tonconnect/ui-react";

export const TVM_WTAC_ADDRESS =
  "0:976525D85B589495D4A3A3B3889E8AF7F960F5717CCB41D84AA1CABF7C8E5F87";
export const TVM_TAC_ADDRESS =
  "0:44FE006B53798F23D8478E526847F918CAB8508320850FA11459F6B8D96F13EC";
export const WTAC_CONVERT_PROXY_ADDRESS =
  "0x6F8B46897E9ad550339784131853a8a9482767d2";

/**
 * Validate TON address format
 */
function validateTonAddress(address: string): boolean {
  // TON address format: workchain:address (0: or -1: followed by 64 hex chars)
  const tonAddressRegex = /^(-1|0):[0-9A-Fa-f]{64}$/;
  return tonAddressRegex.test(address);
}

/**
 * Validate Ethereum address format
 */
function validateEthereumAddress(address: string): boolean {
  // Ethereum address format: 0x followed by 40 hex chars
  const ethAddressRegex = /^0x[0-9A-Fa-f]{40}$/;
  return ethAddressRegex.test(address);
}

/**
 * Validate all contract addresses at startup
 */
function validateContractAddresses(): void {
  if (!validateTonAddress(TVM_WTAC_ADDRESS)) {
    throw new Error(`Invalid WTAC contract address: ${TVM_WTAC_ADDRESS}`);
  }
  if (!validateTonAddress(TVM_TAC_ADDRESS)) {
    throw new Error(`Invalid TAC contract address: ${TVM_TAC_ADDRESS}`);
  }
  if (!validateEthereumAddress(WTAC_CONVERT_PROXY_ADDRESS)) {
    throw new Error(`Invalid proxy contract address: ${WTAC_CONVERT_PROXY_ADDRESS}`);
  }
}

// Validate addresses immediately
validateContractAddresses();

interface TokenBalance {
  balance: string;
  formatted: string;
  raw: bigint;
}

interface AllBalances {
  wtac: TokenBalance;
  tac: TokenBalance;
}

interface WithdrawalResult {
  transactionHash: string;
  confirmed: boolean;
  result: any;
}

/**
 * Get WTAC token balance for a given address
 */
export async function getWtacBalance(
  tacSdk: TacSdk,
  address: string
): Promise<TokenBalance> {
  try {
    const balanceResult = await tacSdk.getUserJettonBalance(
      address,
      TVM_WTAC_ADDRESS
    );

    const rawBalance = BigInt(balanceResult);
    const decimals = 18;
    const formatted = ethers.formatUnits(rawBalance, decimals);

    return {
      balance: formatted,
      formatted: parseFloat(formatted).toFixed(4),
      raw: rawBalance,
    };
  } catch (error) {
    console.error("Error fetching WTAC balance:", error);
    return {
      balance: "0",
      formatted: "0.0000",
      raw: BigInt(0),
    };
  }
}

/**
 * Get TAC token balance for a given address
 */
export async function getTacBalance(
  tacSdk: TacSdk,
  address: string
): Promise<TokenBalance> {
  try {
    const balanceResult = await tacSdk.getUserJettonBalance(
      address,
      TVM_TAC_ADDRESS
    );

    const rawBalance = BigInt(balanceResult);
    const decimals = 18;
    const formatted = ethers.formatUnits(rawBalance, decimals);

    return {
      balance: formatted,
      formatted: parseFloat(formatted).toFixed(4),
      raw: rawBalance,
    };
  } catch (error) {
    console.error("Error fetching TAC balance:", error);
    return {
      balance: "0",
      formatted: "0.0000",
      raw: BigInt(0),
    };
  }
}

/**
 * Get both WTAC and TAC balances for a given address
 */
export async function getAllBalances(
  tacSdk: TacSdk,
  address: string
): Promise<AllBalances> {
  try {
    const [wtacBalance, tacBalance] = await Promise.all([
      getWtacBalance(tacSdk, address),
      getTacBalance(tacSdk, address),
    ]);

    return {
      wtac: wtacBalance,
      tac: tacBalance,
    };
  } catch (error) {
    console.error("Error fetching balances:", error);
    return {
      wtac: {
        balance: "0",
        formatted: "0.0000",
        raw: BigInt(0),
      },
      tac: {
        balance: "0",
        formatted: "0.0000",
        raw: BigInt(0),
      },
    };
  }
}

/**
 * Wait for transaction confirmations
 */
async function waitForConfirmations(
  tacSdk: TacSdk,
  transactionLinker: any,
  requiredConfirmations: number = 3,
  progressCallback?: (progress: string) => void
): Promise<boolean> {
  const tracker = new OperationTracker(tacSdk.network);
  let confirmations = 0;
  let attempts = 0;
  let consecutiveFailures = 0;
  const maxAttempts = 60; // 10 minutes
  const maxConsecutiveFailures = 5;
  const baseDelay = 10000; // 10 seconds

  console.log(`Starting confirmation tracking for transaction...`);
  progressCallback?.("Processing...");

  while (confirmations < requiredConfirmations && attempts < maxAttempts) {
    try {
      const status = await tracker.getSimplifiedOperationStatus(
        transactionLinker
      );

      console.log(`Attempt ${attempts + 1}: Status = ${status}`);

      if (status === "SUCCESSFUL") {
        confirmations++;
        consecutiveFailures = 0; // Reset failure counter
        console.log(`✓ Confirmation ${confirmations}/${requiredConfirmations}`);
      } else if (status === "FAILED") {
        console.log("❌ Transaction failed");
        progressCallback?.("Transaction failed");
        return false;
      } else if (status === "PENDING") {
        console.log("⏳ Transaction still pending...");
        consecutiveFailures = 0; // Reset failure counter for pending status
      }

      if (confirmations >= requiredConfirmations) {
        console.log("🎉 Transaction fully confirmed!");
        return true;
      }

      // Exponential backoff for failed attempts
      const delay = consecutiveFailures > 0 
        ? baseDelay * Math.min(Math.pow(2, consecutiveFailures), 8) 
        : baseDelay;

      await new Promise((resolve) => setTimeout(resolve, delay));
      attempts++;
    } catch (error) {
      consecutiveFailures++;
      console.warn(
        `Confirmation check failed (attempt ${attempts + 1}, consecutive failures: ${consecutiveFailures}):`,
        error
      );

      // If too many consecutive failures, give up early
      if (consecutiveFailures >= maxConsecutiveFailures) {
        console.error("Too many consecutive failures, aborting confirmation tracking");
        progressCallback?.("Network connection issues");
        return false;
      }

      // Exponential backoff for errors
      const delay = baseDelay * Math.min(Math.pow(2, consecutiveFailures), 8);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempts++;
    }
  }

  console.log(`⚠️ Timeout after ${maxAttempts} attempts`);
  progressCallback?.("Processing timeout - transaction may still complete");
  
  // Return true if we have some confirmations, even if not all required
  return confirmations > 0;
}

/**
 * Withdraw WTAC tokens to TAC
 */
export async function withdrawWtacToTac(
  tacSdk: TacSdk,
  tonConnectUI: TonConnectUI,
  amount: bigint,
  requiredConfirmations: number = 3,
  progressCallback?: (progress: string) => void
): Promise<WithdrawalResult> {
  try {
    console.log("🚀 Starting WTAC to TAC withdrawal...");

    const evmProxyMsg = {
      evmTargetAddress: WTAC_CONVERT_PROXY_ADDRESS,
      methodName: "convertWrappedToNativeTac(bytes,bytes)",
      encodedParameters: ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [amount]
      ),
    };

    const sender = await SenderFactory.getSender({ tonConnect: tonConnectUI });

    const assets: AssetBridgingData[] = [
      {
        type: AssetType.FT,
        address: Address.parse(TVM_WTAC_ADDRESS).toString({ bounceable: true }),
        rawAmount: amount,
      },
    ];

    console.log("📡 Sending cross-chain transaction...");
    const result = await tacSdk.sendCrossChainTransaction(
      evmProxyMsg,
      sender,
      assets
    );

    const tsResult = result.sendTransactionResult as {
      success: boolean;
      error: Record<string, unknown>;
    };

    if (!tsResult?.success) {
      throw (
        tsResult?.error?.info ||
        "Unknown error. Transaction might not have been sent."
      );
    }

    console.log(
      "✅ Transaction sent successfully, waiting for confirmations..."
    );

    const confirmed = await waitForConfirmations(
      tacSdk,
      result,
      requiredConfirmations,
      progressCallback
    );

    if (!confirmed) {
      throw new Error(
        "Transaction did not receive sufficient confirmations within timeout period"
      );
    }

    return {
      transactionHash: result.transactionHash || "unknown",
      confirmed: true,
      result: result,
    };
  } catch (error) {
    console.error("❌ Error withdrawing WTAC to TAC:", error);
    throw error;
  }
}

/**
 * Parse input amount to BigInt with decimals
 */
export function parseWtacAmount(amount: string, decimals: number = 18): bigint {
  if (!amount || amount.trim() === "" || amount === "0") {
    throw new Error("Amount cannot be empty or zero");
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) {
    throw new Error("Amount must be a valid positive number");
  }

  if (numAmount > 1e12) {
    throw new Error("Amount is too large");
  }

  try {
    const parsed = ethers.parseUnits(amount, decimals);
    if (parsed === BigInt(0)) {
      throw new Error("Parsed amount is zero");
    }
    return parsed;
  } catch (error) {
    console.error("Error parsing WTAC amount:", error);
    throw new Error(`Invalid amount format: ${amount}`);
  }
}
