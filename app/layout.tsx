import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { EntityProvider } from "@/lib/entity-context";
import { ThemeProvider } from "@/lib/theme-provider";
import { TRPCProvider } from "@/lib/trpc/provider";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "secad",
  description: "A web application for managing backend corporate compliance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCProvider>
            <AuthProvider>
              <EntityProvider>{children}</EntityProvider>
            </AuthProvider>
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
