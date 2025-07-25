import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TonConnectProvider } from "@/providers/ton-connect";
import { SwapProvider } from "@/contexts/swap-context";
import { TacSdkProvider } from "@/contexts/tac-sdk-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable}   bg-white `}>
        <TonConnectProvider>
          <TacSdkProvider>
            <SwapProvider>{children}</SwapProvider>
          </TacSdkProvider>
        </TonConnectProvider>
      </body>
    </html>
  );
}
