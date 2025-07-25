import Image from "next/image";
import { LogOut } from "lucide-react";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import ClientWrapper from "./client-wrapper";

function HeaderContent() {
  const userFriendlyAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const handleDisconnect = () => {
    tonConnectUI.disconnect();
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
          {userFriendlyAddress && (
            <button
              onClick={handleDisconnect}
              className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Disconnect Wallet"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600 hidden sm:block">
                Disconnect
              </span>
            </button>
          )}
        </ClientWrapper>
      </div>
    </header>
  );
}

export default function Header() {
  return <HeaderContent />;
}
