import { render, screen } from "@testing-library/react"
import SignInPage from "@/app/auth/sign-in/[[...sign-in]]/page"

describe("Sign In Page", () => {
  it("renders page with Vitae branding", () => {
    render(<SignInPage />)
    expect(screen.getByText("Vitae")).toBeInTheDocument()
    expect(screen.getByText("Resume Version Control")).toBeInTheDocument()
  })

  it("renders the Clerk SignIn component", () => {
    render(<SignInPage />)
    expect(screen.getByTestId("clerk-signin")).toBeInTheDocument()
  })
})
