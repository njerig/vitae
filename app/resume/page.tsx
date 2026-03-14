// Server-side page component for the resume builder route, handles authentication and user/version context to the client component.
import { auth, currentUser } from "@clerk/nextjs/server"
import ResumeBuilderClient from "./resume-client"

export default async function ResumePage({
  searchParams,
}: {
  // searchParams searches for version info when loading a previously saved resume version
  searchParams: Promise<{ version?: string; savedAt?: string; parentVersionId?: string }>
}) {
  // Get the current user's ID from Clerk (null if not signed in)
  const { userId } = await auth()

  // Fetch full user object to extract a display name
  const user = await currentUser()

  // Prefer full name, fall back to username, or then a generic placeholder
  const userName = user?.fullName ?? user?.username ?? "User"

  // Await the search params
  const params = await searchParams

  // Extract optional version metadata from the URL query string.
  const versionName = params.version || null
  const versionSavedAt = params.savedAt || null
  const parentVersionId = params.parentVersionId || null

  // Guard: if the user isn't authenticated, show a sign-in prompt instead of the builder
  if (!userId) {
    return (
      <div className="flex flex-col align-center items-center justify-center min-h-screen">
        <p className="text-gray-900 text-4xl">Please sign in to view your resume</p>
      </div>
    )
  }

  // Render the client component, passing down user identity and any version context
  return (
    <ResumeBuilderClient
      userName={userName}
      userId={userId}
      versionName={versionName}
      versionSavedAt={versionSavedAt}
      parentVersionId={parentVersionId}
    />
  )
}
