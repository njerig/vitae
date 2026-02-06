// __tests__/auth/sign-in.test.tsx
import { render, screen } from '@testing-library/react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import SignInPage from '@/app/auth/sign-in/[[...sign-in]]/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
  SignIn: ({ routing, path, signUpUrl }: any) => (
    <div data-testid="clerk-signin-component">
      <p>Mock SignIn Component</p>
      <p data-testid="routing">{routing}</p>
      <p data-testid="path">{path}</p>
      <p data-testid="signup-url">{signUpUrl}</p>
    </div>
  ),
}))

describe('Sign In Page', () => {
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

  it('renders the sign-in page with Vitae branding', () => {
    render(<SignInPage />)
    
    // Check for Vitae title
    expect(screen.getByText('Vitae')).toBeInTheDocument()
    
    // Check for subtitle
    expect(screen.getByText('Resume Version Control')).toBeInTheDocument()
  })

  it('renders Clerk SignIn component', () => {
    render(<SignInPage />)
    
    // Check that SignIn component is rendered
    expect(screen.getByTestId('clerk-signin-component')).toBeInTheDocument()
  })

  it('configures SignIn component with correct props', () => {
    render(<SignInPage />)
    
    // Check routing configuration
    expect(screen.getByTestId('routing')).toHaveTextContent('path')
    expect(screen.getByTestId('path')).toHaveTextContent('/auth/sign-in')
    expect(screen.getByTestId('signup-url')).toHaveTextContent('/auth/sign-up')
  })

  it('has link to home page on Vitae title', () => {
    render(<SignInPage />)
    
    const vitaeTitle = screen.getByText('Vitae')
    const linkElement = vitaeTitle.closest('a')
    
    expect(linkElement).toHaveAttribute('href', '/')
  })

  it('applies correct styling classes', () => {
    render(<SignInPage />)
    
    // Check for page container
    const container = screen.getByText('Vitae').closest('.page-container')
    expect(container).toBeInTheDocument()
  })
})
