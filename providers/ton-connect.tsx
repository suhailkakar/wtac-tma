"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";

export function TonConnectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const manifestUrl = "https://wtac-tma.vercel.app/tonconnect-manifest.json";

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
    </TonConnectUIProvider>
  );
}
