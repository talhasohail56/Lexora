import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { CommandPaletteProvider } from "@/components/layout/command-palette";
import { RouteProgress } from "@/components/layout/route-progress";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Lexora — AI Paralegal Assistant",
  description:
    "An intelligent legal document platform: analysis, RAG search, compliance, drafting, comparison, and more.",
  metadataBase: new URL("http://localhost:3000"),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <CommandPaletteProvider>
            <Suspense fallback={null}>
              <RouteProgress />
            </Suspense>
            {children}
            <Toaster
              theme="system"
              position="bottom-right"
              richColors
              closeButton
            />
          </CommandPaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
