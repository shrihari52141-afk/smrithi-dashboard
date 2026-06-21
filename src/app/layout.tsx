import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Smrithi • Dashboard',
  description: 'Smrithi AI Best Friend - Admin Dashboard',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
