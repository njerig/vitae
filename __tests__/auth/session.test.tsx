import { render, screen } from "@testing-library/react"
import HomePage from "@/app/home/page"
import ResumePage from "@/app/resume/page"
import { auth } from "@clerk/nextjs/server"

// Mock the components that `app/home/page.tsx` and `app/resume/page.tsx` render when authenticated
jest.mock("@/app/home/home-client", () => {
  return function MockHomeClient() {
    return <div data-testid="mock-home-client">Home Client</div>
  }
})
jest.mock("@/app/resume/resume-client", () => {
  return function MockResumeClient() {
    return <div data-testid="mock-resume-client">Resume Client</div>
  }
})

// Testing a user's current state of authentication/session when navigating to different pages
describe("Session Protected Routes", () => {

  // reset/clear states after each test. Basically the teardown
  afterEach(() => {
    jest.clearAllMocks()
  })

  // navigate to different routes while unauthenticated
  describe("Unauthenticated Access", () => {
    beforeEach(() => {
      // Mock auth() to return no userId
      ;(auth as unknown as jest.Mock).mockResolvedValue({ userId: null })
    })

    it("displays sign-in prompt on the Home page when unauthenticated", async () => {

      const resolvedPage = await HomePage()
      render(resolvedPage)

      expect(screen.getByText("Please sign in to view your resume")).toBeInTheDocument()
      expect(screen.queryByTestId("mock-home-client")).not.toBeInTheDocument()
    })

    it("displays sign-in prompt on the Resume page when unauthenticated", async () => {
      // Mocks the async Next.js searchParams prop
      const resolvedPage = await ResumePage({
        searchParams: Promise.resolve({}),
      })
      render(resolvedPage)

      expect(screen.getByText("Please sign in to view your resume")).toBeInTheDocument()
      expect(screen.queryByTestId("mock-resume-client")).not.toBeInTheDocument()
    })
  })

  // navigate to different routes while authenticated
  describe("Authenticated Access", () => {
    beforeEach(() => {
      // Mock auth() to return a valid userId
      ;(auth as unknown as jest.Mock).mockResolvedValue({ userId: "test_user_123" })
    })

    it("renders the Home client component when authenticated", async () => {
      const resolvedPage = await HomePage()
      render(resolvedPage)

      expect(screen.getByTestId("mock-home-client")).toBeInTheDocument()

      // now we should NOT see the sign in text
      expect(screen.queryByText("Please sign in to view your resume")).not.toBeInTheDocument()
    })

    it("renders the Resume client component when authenticated", async () => {
      const resolvedPage = await ResumePage({
        searchParams: Promise.resolve({}),
      })
      render(resolvedPage)

      expect(screen.getByTestId("mock-resume-client")).toBeInTheDocument()

      // now we should NOT see the sign in text
      expect(screen.queryByText("Please sign in to view your resume")).not.toBeInTheDocument()
    })
  })
})
