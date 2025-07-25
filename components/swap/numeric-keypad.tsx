"use client";

import { memo, useCallback, useState } from "react";
import { Delete } from "lucide-react";
import { NumericKeypadProps } from "@/types";

const keypadLayout = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "backspace"],
] as const;

const NumericKeypad = memo<NumericKeypadProps>(
  ({ onKeyPress, onBackspace, disabled = false, maxLength = 20 }) => {
    const [rippleKey, setRippleKey] = useState<string | null>(null);

    const handleKeyPress = useCallback(
      (key: string) => {
        if (disabled) return;

        setRippleKey(key);
        setTimeout(() => setRippleKey(null), 300);

        if (key === "backspace") {
          onBackspace();
        } else {
          onKeyPress(key);
        }
      },
      [onKeyPress, onBackspace, disabled]
    );

    return (
      <div
        className="grid grid-cols-3 gap-4"
        role="grid"
        aria-label="Numeric keypad"
      >
        {keypadLayout.flat().map((key, index) => {
          const isBackspace = key === "backspace";
          const ariaLabel = isBackspace ? "Backspace" : `Enter ${key}`;
          const isRippling = rippleKey === key;

          return (
            <button
              key={index}
              onClick={() => handleKeyPress(key)}
              disabled={disabled}
              className={`
                relative overflow-hidden h-14 rounded-2xl font-medium text-3xl 
                transition-all duration-150 ease-out
                ${
                  disabled
                    ? "bg-transparent text-gray-400 cursor-not-allowed"
                    : "bg-transparent text-gray-900 hover:bg-gray-100 active:bg-gray-200"
                }
                ${isRippling ? "transform scale-95" : "transform scale-100"}
              `}
              aria-label={ariaLabel}
              type="button"
            >
              {isRippling && (
                <span className="absolute inset-0 animate-ping bg-gray-200 rounded-2xl opacity-75"></span>
              )}

              <span className="relative z-10">
                {isBackspace ? (
                  <Delete className="w-6 h-6 mx-auto" aria-hidden="true" />
                ) : (
                  key
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
);

NumericKeypad.displayName = "NumericKeypad";

export default NumericKeypad;
