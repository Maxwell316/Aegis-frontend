"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { FreighterProvider } from "@/contexts/FreighterContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { VaultProvider } from "@/contexts/VaultContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

export function Providers({ children, nonce }: { children: ReactNode; nonce?: string }) {
  return (
    <NetworkProvider>
      <FreighterProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem nonce={nonce}>
          <CurrencyProvider>
            <VaultProvider>
              <SessionProvider>
                <NotificationProvider>{children}</NotificationProvider>
              </SessionProvider>
            </VaultProvider>
          </CurrencyProvider>
          <Toaster richColors closeButton position="bottom-right" />
        </ThemeProvider>
      </FreighterProvider>
    </NetworkProvider>
  );
}
