// Jest setup file - runs before each test file
import '@testing-library/jest-dom'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local (preferred) or .env
// These files should be in .gitignore, so secrets won't be committed
config({ path: resolve(process.cwd(), '.env.local'), quiet: true })
config({ path: resolve(process.cwd(), '.env'), quiet: true })

// Fallback mock values for CI environments or when .env files don't exist
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
process.env.API_URL = process.env.API_URL
process.env.DATABASE_URL = process.env.DATABASE_URL

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Clerk authentication
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: false,
    userId: null,
  })),
  useUser: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: false,
    user: null,
  })),
  SignIn: () => <div data-testid="clerk-signin">Mock SignIn</div>,
  SignUp: () => <div data-testid="clerk-signup">Mock SignUp</div>,
  UserButton: () => <div data-testid="clerk-user-button">Mock UserButton</div>,
  ClerkProvider: ({ children }) => <div>{children}</div>,
}))

// Mock window.matchMedia (for responsive components)
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// Mock IntersectionObserver (if you use it)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return []
  }
}

// Suppress console errors during tests (optional)
// Uncomment if you want cleaner test output
// const originalError = console.error
// beforeAll(() => {
//   console.error = (...args) => {
//     if (
//       typeof args[0] === 'string' &&
//       args[0].includes('Warning: ReactDOM.render')
//     ) {
//       return
//     }
//     originalError.call(console, ...args)
//   }
// })
// 
// afterAll(() => {
//   console.error = originalError
// })
