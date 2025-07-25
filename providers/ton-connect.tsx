"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";

export function TonConnectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const manifestUrl =
    "https://raw.githubusercontent.com/TacBuild/first-force/refs/heads/main/ton-manifest.json";

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
    </TonConnectUIProvider>
  );
}
