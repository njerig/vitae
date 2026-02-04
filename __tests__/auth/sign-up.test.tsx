// __tests__/auth/sign-up.test.tsx
import { render, screen } from '@testing-library/react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import SignUpPage from '@/app/auth/sign-up/[[...sign-up]]/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
  SignUp: ({ routing, path, signInUrl }: any) => (
    <div data-testid="clerk-signup-component">
      <p>Mock SignUp Component</p>
      <p data-testid="routing">{routing}</p>
      <p data-testid="path">{path}</p>
      <p data-testid="signin-url">{signInUrl}</p>
    </div>
  ),
}))

describe('Sign Up Page', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    })
    ;(useAuth as jest.Mock).mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      userId: null,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders the sign-up page with Vitae branding', () => {
    render(<SignUpPage />)

    // Check for Vitae title
    expect(screen.getByText('Vitae')).toBeInTheDocument()

    // Check for subtitle
    expect(screen.getByText('Resume Version Control')).toBeInTheDocument()
  })

  it('renders Clerk SignUp component', () => {
    render(<SignUpPage />)

    // Check that SignUp component is rendered
    expect(screen.getByTestId('clerk-signup-component')).toBeInTheDocument()
  })

  it('configures SignUp component with correct props', () => {
    render(<SignUpPage />)

    // Check routing configuration
    expect(screen.getByTestId('routing')).toHaveTextContent('path')
    expect(screen.getByTestId('path')).toHaveTextContent('/auth/sign-up')
    expect(screen.getByTestId('signin-url')).toHaveTextContent('/auth/sign-in')
  })

  it('has link to home page on Vitae title', () => {
    render(<SignUpPage />)

    const vitaeTitle = screen.getByText('Vitae')
    const linkElement = vitaeTitle.closest('a')

    expect(linkElement).toHaveAttribute('href', '/')
  })

  it('renders with same layout as sign-in page', () => {
    render(<SignUpPage />)

    // Check for consistent page structure
    const container = screen.getByText('Vitae').closest('.page-container')
    expect(container).toBeInTheDocument()

    // Check for background elements
    const bgGradient = container?.querySelector('.page-bg-gradient')
    const accentLight = container?.querySelector('.page-accent-light')

    expect(bgGradient).toBeInTheDocument()
    expect(accentLight).toBeInTheDocument()
  })
})
