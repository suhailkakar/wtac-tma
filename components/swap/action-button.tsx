"use client";

import { ActionButtonProps } from "@/types";

export default function ActionButton({
  text,
  disabled = false,
  isLoading = false,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full h-12 rounded-full font-medium text-md transition-colors ${
        disabled || isLoading
          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
          : "bg-primary hover:bg-primary/80 text-white"
      }`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      ) : (
        text
      )}
    </button>
  );
}
