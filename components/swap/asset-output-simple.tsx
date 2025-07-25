"use client";

import { memo } from "react";
import { AssetOutputProps } from "@/types";
import { formatDisplayNumber } from "@/utils/validation";

const AssetOutputSimple = memo<AssetOutputProps>(
  ({ token, value, fiatValue, isLoading = false }) => {
    const formattedValue = formatDisplayNumber(value);
    const formattedFiatValue = formatDisplayNumber(fiatValue, 2);
    const formattedBalance = formatDisplayNumber(token.balance);

    return (
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div
              className={`text-3xl font-medium ${
                isLoading ? "animate-pulse" : ""
              }`}
            >
              {isLoading ? (
                <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <span className="text-gray-400">{formattedValue}</span>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              ${formattedFiatValue}
            </div>
          </div>

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
        </div>

        <div className="text-right text-sm text-gray-500 mt-2">
          {formattedBalance} {token.symbol}
        </div>
      </div>
    );
  }
);

AssetOutputSimple.displayName = "AssetOutputSimple";

export default AssetOutputSimple;
