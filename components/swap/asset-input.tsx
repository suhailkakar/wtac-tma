"use client";

import { memo, useCallback } from "react";
import { AssetInputProps } from "@/types";
import { formatDisplayNumber } from "@/utils/validation";

const AssetInput = memo<AssetInputProps>(
  ({
    value,
    token,
    fiatValue,
    onValueChange,
    onTokenSelect,
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

    const formattedBalance = formatDisplayNumber(token.balance);
    const formattedFiatValue = formatDisplayNumber(fiatValue, 2);

    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              value={value}
              onChange={handleInputChange}
              placeholder="0"
              readOnly={isReadOnly}
              className={`text-3xl font-medium bg-transparent border-none outline-none w-full ${
                error ? "text-red-500" : "text-gray-900"
              }`}
              maxLength={maxLength}
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              aria-label={`${token.symbol} amount input`}
              aria-describedby={error ? "input-error" : `${token.symbol}-balance`}
              aria-invalid={error ? "true" : "false"}
              aria-required="true"
              role="spinbutton"
              aria-valuemin="0"
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

          {onTokenSelect ? (
            <button
              onClick={onTokenSelect}
              className="flex items-center space-x-2 bg-white border border-gray-100 rounded-full px-3 py-2 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`Select ${token.symbol} token`}
            >
              <img
                src={token.icon}
                alt={`${token.name} logo`}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center text-white text-xs font-bold hidden">
                {token.symbol.slice(0, 2)}
              </div>
              <span className="font-medium">{token.symbol}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 bg-white border border-gray-100 rounded-full px-3 py-2">
              <img
                src={token.icon}
                alt={`${token.name} logo`}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center text-white text-xs font-bold hidden">
                {token.symbol.slice(0, 2)}
              </div>
              <span className="font-medium">{token.symbol}</span>
            </div>
          )}
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
