// Jest setup file - runs before each test file
import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_bmF0aXZlLWFzcC00Ny5jbGVyay5hY2NvdW50cy5kZXYk'
process.env.CLERK_SECRET_KEY = 'sk_test_mock_key_for_testing'
process.env.API_URL = 'http://localhost:8000'
process.env.DATABASE_URL = 'postgresql://vitae:vitae@localhost:5432/vitae_test'

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
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
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
