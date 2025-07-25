import Image from "next/image";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import ClientWrapper from "./client-wrapper";

interface HeaderContentProps {
  onConnectWallet?: () => void;
  onSwap?: () => void;
  isTransacting?: boolean;
  transactionProgress?: string;
  canSwap?: boolean;
  inputValue?: string;
}

function HeaderContent({
  onConnectWallet,
  onSwap,
  isTransacting,
  transactionProgress,
  canSwap,
  inputValue,
}: HeaderContentProps) {
  const userFriendlyAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const handleButtonClick = () => {
    if (!userFriendlyAddress && onConnectWallet) {
      onConnectWallet();
    } else if (userFriendlyAddress && onSwap) {
      onSwap();
    }
  };

  const getButtonText = () => {
    if (isTransacting && transactionProgress) {
      return transactionProgress;
    }
    if (!userFriendlyAddress) {
      return "Connect Wallet";
    }
    if (inputValue && parseFloat(inputValue) > 0) {
      return `Unwrap ${inputValue} TAC`;
    }
    return "Unwrap Token";
  };

  return (
    <header className="w-full px-6 py-6">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Image
            src="/tac-logo-large.webp"
            alt="TAC Logo"
            width={100}
            height={100}
            className="rounded-lg"
            priority
          />
        </div>

        <ClientWrapper fallback={null}>
          <button
            onClick={handleButtonClick}
            disabled={isTransacting || (!!userFriendlyAddress && !canSwap)}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
              isTransacting || (!!userFriendlyAddress && !canSwap)
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : !userFriendlyAddress
                ? "bg-primary hover:bg-primary/80 text-white"
                : "bg-primary hover:bg-primary/80 text-white"
            }`}
          >
            {isTransacting && (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
            )}
            {getButtonText()}
          </button>
        </ClientWrapper>
      </div>
    </header>
  );
}

export default function Header(props: HeaderContentProps) {
  return <HeaderContent {...props} />;
}
