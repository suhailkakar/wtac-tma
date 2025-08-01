"use client";

import { memo, useCallback } from "react";
import { AssetInputProps } from "@/types";
import { formatDisplayNumber } from "@/utils/validation";
import Image from "next/image";

const AssetInput = memo<AssetInputProps>(
  ({
    value,
    token,
    fiatValue,
    onValueChange,
    isReadOnly = true,
    error,
    maxLength = 20,
  }) => {
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (newValue.length <= maxLength) {
          onValueChange(newValue);
        }
      },
      [onValueChange, maxLength]
    );

    const formattedBalance = formatDisplayNumber(token.balance, 10);
    const formattedFiatValue = fiatValue; // Don't re-format, use the already formatted value from context

    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              value={value}
              onChange={handleInputChange}
              placeholder="0"
              readOnly={true}
              className={`text-3xl font-medium bg-transparent border-none outline-none w-full ${
                error ? "text-red-500" : "text-gray-900"
              }`}
              maxLength={maxLength}
              inputMode="none"
              autoComplete="off"
              spellCheck={false}
              aria-label={`${token.symbol} amount input`}
              aria-describedby={
                error ? "input-error" : `${token.symbol}-balance`
              }
              aria-invalid={error ? "true" : "false"}
              aria-required="true"
              role="spinbutton"
              aria-valuenow={parseFloat(value) || 0}
            />
            <div className="text-sm text-gray-500 mt-1">
              ${formattedFiatValue}
            </div>
            {error && (
              <div
                id="input-error"
                className="text-xs text-red-500 mt-1"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 bg-white border border-gray-100 rounded-full px-3 py-2">
            <Image
              width={24}
              height={24}
              src={"/tac-token-logo.png"}
              alt={`${token.name} logo`}
              className="w-6 h-6 rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.nextElementSibling?.classList.remove("hidden");
              }}
            />

            <span className="font-medium">{token.symbol}</span>
          </div>
        </div>

        <div
          id={`${token.symbol}-balance`}
          className="text-right text-sm text-gray-500 mt-2"
          aria-label={`Available balance: ${formattedBalance} ${token.symbol}`}
        >
          {formattedBalance} {token.symbol}
        </div>
      </div>
    );
  }
);

AssetInput.displayName = "AssetInput";

export default AssetInput;
