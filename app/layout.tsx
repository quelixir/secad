import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { EntityProvider } from '@/lib/entity-context'
import { ThemeProvider } from '@/lib/theme-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SECAD - Corporate Administration',
  description: 'Corporate administration and securities management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
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
          <EntityProvider>
            {children}
          </EntityProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
