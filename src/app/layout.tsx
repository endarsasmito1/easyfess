import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { TRPCProvider } from "@/lib/trpc";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Easyfess — Platform Menfess Otomatis untuk X/Twitter",
  description:
    "Kirim menfess anonim ke base X/Twitter favorit kamu dengan mudah, aman, dan otomatis. Daftar sekarang!",
  keywords: ["menfess", "twitter", "x", "anonim", "base", "autobase"],
  openGraph: {
    title: "Easyfess — Platform Menfess Otomatis",
    description: "Kirim menfess anonim ke base X/Twitter favorit kamu.",
    type: "website",
  },
};

import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body>
        <Providers>
          <TRPCProvider>
            {children}
            <Toaster
              theme="dark"
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                style: {
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                },
              }}
            />
          </TRPCProvider>
        </Providers>
      </body>
    </html>
  );
}
