import { type Metadata } from "next"
import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Inter, Geist_Mono, Crimson_Pro } from "next/font/google"
import Link from "next/link"
import { Toaster } from "react-hot-toast"
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
              {/* Left side - Logo and Home */}
              <div className='flex items-center gap-6'>
                <Link href='/' className='logo'>
                  Vitae
                </Link>
                <SignedIn>
                  <Link href='/home'>
                    <button className='btn-nav'>Home</button>
                  </Link>
                </SignedIn>
              </div>

              {/* Right side buttons */}
              <div className='flex items-center gap-4'>
                <SignedOut>
                  <Link href='/auth/sign-in'>
                    <button className='btn-secondary rounded-lg'>Sign In</button>
                  </Link>
                  <Link href='/auth/sign-up'>
                    <button className='btn-primary rounded-lg'>Sign Up</button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href='/resume'>
                    <button className='btn-nav'>Resume Builder</button>
                  </Link>
                  <UserButton showName />
                </SignedIn>
              </div>
            </div>
          </header>

          {children}
          
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--paper)',
                color: 'var(--ink)',
                border: '1px solid var(--grid)',
                borderRadius: 'var(--radius-soft)',
                fontFamily: 'var(--font-sans)',
              },
              success: {
                iconTheme: {
                  primary: '#008000',
                  secondary: 'var(--paper)',
                },
              },
              error: {
                style: {
                  border: '1px solid #dc2626',
                },
                iconTheme: {
                  primary: '#dc2626',
                  secondary: 'var(--paper)',
                },
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}