import type { Metadata } from 'next'
import './admin/admin.css'

export const metadata: Metadata = {
  title: 'VapeLounge — Admin',
  description: 'Internal admin panel for VapeLounge catalogue management.',
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="admin-root">{children}</div>
      </body>
    </html>
  )
}
