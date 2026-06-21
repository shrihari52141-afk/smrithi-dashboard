import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Smrithi Dashboard',
  description: 'Smrithi AI Best Friend - Admin Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-200 antialiased">
        {children}
      </body>
    </html>
  )
}
