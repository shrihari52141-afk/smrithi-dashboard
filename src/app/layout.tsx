export const metadata = {
  title: 'Smrithi Control Dashboard',
  description: 'WhatsApp AI Bot Monitor & Control Center',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ 
        margin: 0, 
        padding: 0, 
        backgroundColor: '#0b141a', 
        color: '#e9edef', 
        fontFamily: 'Segoe UI, system-ui, -apple-system, sans-serif',
        overflow: 'hidden' // Prevents body scrollbars, inner divs will handle scrolling
      }}>
        {children}
      </body>
    </html>
  )
}
