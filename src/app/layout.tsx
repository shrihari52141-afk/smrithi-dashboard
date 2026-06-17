export const metadata = {
  title: 'Smrithi Dashboard',
  description: 'WhatsApp AI Bot Monitor',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#111827', color: 'white', fontFamily: 'sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
