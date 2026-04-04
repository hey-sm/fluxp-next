import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import {
  GeistPixelCircle,
  GeistPixelGrid,
  GeistPixelLine,
  GeistPixelSquare,
  GeistPixelTriangle,
} from 'geist/font/pixel'
import { GeistSans } from 'geist/font/sans'
import { Toaster } from 'sonner'
import './globals.css'

const fontVariables = [
  GeistSans.variable,
  GeistMono.variable,
  GeistPixelSquare.variable,
  GeistPixelGrid.variable,
  GeistPixelCircle.variable,
  GeistPixelTriangle.variable,
  GeistPixelLine.variable,
].join(' ')

export const metadata: Metadata = {
  title: 'fluxp',
  description: 'AI Chat & Blog',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`h-full antialiased ${fontVariables}`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
