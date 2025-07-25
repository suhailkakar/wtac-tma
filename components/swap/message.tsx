import { MessageProps } from "@/types";

interface MessageWithPriceProps extends MessageProps {
  readonly tokenPrice?: number;
}

export default function Message({
  text,
  type = "info",
  className = "",
  tokenPrice,
}: MessageWithPriceProps) {
  const typeStyles = {
    info: "text-gray-500",
    error: "text-red-500",
    warning: "text-orange-500",
    success: "text-green-500",
  };

  const formatPrice = (price: number): string => {
    if (price < 0.001) {
      const formatted = price.toFixed(6);
      return parseFloat(formatted).toString();
    }

    const formatted = price.toFixed(3);
    return parseFloat(formatted).toString();
  };

  const displayPrice =
    tokenPrice && tokenPrice > 0 ? formatPrice(tokenPrice) : null;

  return (
    <div className="flex items-center justify-between mt-4 px-2">
      <div className={`text-xs  ${typeStyles[type]} ${className}`}>{text}</div>

      <div className="flex-1 flex justify-end">
        {displayPrice && (
          <span className="text-xs text-gray-500">1 TAC = ${displayPrice}</span>
        )}
      </div>
    </div>
  );
}
