"use client";

import { PresetButtonsProps } from "@/types";

const presets = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "Max", value: 1 },
];

export default function PresetButtons({ 
  onPresetSelect, 
  disabled = false, 
  availableBalance 
}: PresetButtonsProps) {
  return (
    <div className="flex items-center justify-between space-x-2 my-4">
      {presets.map((preset) => (
        <button
          key={preset.label}
          onClick={() => onPresetSelect(preset.value)}
          disabled={disabled}
          className={`flex-1 bg-gray-50 text-gray-700 py-1 border border-gray-100 rounded-full text-sm font-medium transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
