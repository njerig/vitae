import { render, screen } from "@testing-library/react"
import SignUpPage from "@/app/auth/sign-up/[[...sign-up]]/page"

describe("Sign Up Page", () => {
  it("renders page with Vitae branding", () => {
    render(<SignUpPage />)
    expect(screen.getByText("Vitae")).toBeInTheDocument()
    expect(screen.getByText("Resume Version Control")).toBeInTheDocument()
  })

  it("renders the Clerk SignUp component", () => {
    render(<SignUpPage />)
    expect(screen.getByTestId("clerk-signup")).toBeInTheDocument()
  })
})
