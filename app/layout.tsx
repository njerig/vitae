import { type Metadata } from "next"
import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Inter, Geist_Mono, Crimson_Pro } from "next/font/google"
import Link from "next/link"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const crimsonPro = Crimson_Pro({
  variable: "--font-crimson-pro",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
        <body className={`${inter.variable} ${geistMono.variable} ${crimsonPro.variable} antialiased`}>
          {/* Header component - Editorial design */}
          <header className='absolute top-0 left-0 right-0 z-50 px-8 py-6 border-b'>
            <div className='max-w-7xl mx-auto flex justify-between items-center'>
              {/* Logo - always visible */}
              <Link href='/home' className='logo'>
                Vitae
              </Link>

              {/* Right side buttons */}
              <div className='flex items-center gap-4'>
                <SignedOut>
                  <a href='/auth/sign-in'>
                    <button className='btn-secondary'>Sign In</button>
                  </a>
                  <a href='/auth/sign-up'>
                    <button className='btn-primary'>Sign Up</button>
                  </a>
                </SignedOut>
                <SignedIn>
                  <Link href='/resume'>
                    <button className='btn-secondary'>Resume Builder</button>
                  </Link>
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
