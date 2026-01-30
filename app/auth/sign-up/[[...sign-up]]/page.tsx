import { SignUp } from "@clerk/nextjs"
import Link from "next/link"

export default function Page() {
  return (
    <div className="page-container">
      <div className="page-bg-gradient"></div>
      <div className="page-accent-light"></div>

      <div className="relative z-10">
        <div className="hero-section">
          <div className="w-full max-w-md">
            <Link href="/">
              <h1 className="text-5xl font-semibold text-center mb-2 text-gray-900 cursor-pointer hover:opacity-80 transition-opacity" style={{ textAlign: 'center', marginLeft: '-50px' }}>
                Vitae
              </h1>
            </Link>
            <p className="text-center text-gray-600 mb-8" style={{ textAlign: 'center', marginLeft: '-50px' }}>
              Resume Version Control
            </p>

            <SignUp
              routing="path"
              path="/auth/sign-up"
              signInUrl="/auth/sign-in"
              appearance={{
                layout: {
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "blockButton",
                },
                elements: {
                  rootBox: "w-full",
                  card: "bg-white shadow-lg rounded-3xl border border-gray-200 p-8",
                  headerTitle: "hidden",
                  headerSubtitle: "text-gray-600 text-center mb-6",
                  socialButtonsBlockButton: "btn-secondary mb-3 w-full text-base",
                  socialButtonsBlockButtonText: "font-medium",
                  dividerLine: "bg-gray-300",
                  dividerText: "text-gray-500",
                  formButtonPrimary: "btn-primary w-full",
                  formFieldInput: "rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-4 py-3 text-base",
                  formFieldLabel: "text-gray-700 font-medium mb-2",
                  footerActionLink: "text-blue-600 font-medium hover:text-blue-700",
                  identityPreviewText: "text-gray-700",
                  identityPreviewEditButton: "text-blue-600",
                  formHeaderTitle: "text-2xl font-semibold text-gray-900 text-center mb-2",
                  formHeaderSubtitle: "text-gray-600 text-center mb-6",
                },
                variables: {
                  colorPrimary: "#3b82f6",
                  colorBackground: "#ffffff",
                  colorText: "#111827",
                  colorTextSecondary: "#4b5563",
                  borderRadius: "1rem",
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}