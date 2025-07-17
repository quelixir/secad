import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { EntityProvider } from '@/lib/entity-context'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SECAD - Corporate Administration',
  description: 'Australian corporate administration and securities management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <EntityProvider>
          {children}
        </EntityProvider>
      </body>
    </html>
  )
}
