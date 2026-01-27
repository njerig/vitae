import { type Metadata } from "next"
import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Geist, Geist_Mono } from "next/font/google"
// @ts-ignore
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Vitae",
  description: "Resume Version Control app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang='en'>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {/* Header component - Apple-inspired design */}
          <header className='absolute top-0 left-0 right-0 z-50 px-8 py-6 bg-white/80 backdrop-blur-md border-b border-gray-200'>
            <div className='max-w-7xl mx-auto flex justify-between items-center'>
              {/* Logo - always visible */}
              <div className='text-2xl font-semibold tracking-tight text-gray-900'>
                Vitae
              </div>
              
              {/* Right side buttons */}
              <div className='flex items-center gap-4'>
                <SignedOut>
                  <SignInButton>
                    <button className='btn-secondary'>
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className='btn-primary'>
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <UserButton showName />
                </SignedIn>
              </div>
            </div>
          </header>
          
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}