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
          {/* Header component*/}
          <header className='flex justify-end items-center p-4 gap-4 h-16'>
            <SignedOut>
              <SignInButton />
              <SignUpButton>
                <button className='bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer'>
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <div className='flex justify-start self-start'>
                <div className='flex items-center gap-4'>
                  <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent'>Vitae</h1>
                  <span className='text-zinc-300 hidden md:inline'>| Career History</span>
                </div>
              </div>
              <UserButton showName />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
