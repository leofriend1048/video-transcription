import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Audio/Video Transcription App',
  description: 'Upload MP3 or MP4 files and get transcripts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
        <html lang="en">
      <body className={inter.className}>{children}<Toaster /></body>
      </html>

    </>
  )
}