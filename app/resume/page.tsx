// app/resume/page.tsx (SERVER COMPONENT)
import { auth, currentUser } from "@clerk/nextjs/server"
import ResumeClient from "./resume-client"

export default async function ResumePage({
  searchParams,
}: {
  searchParams: Promise<{ version?: string; savedAt?: string }>
}) {
  const { userId } = await auth()
  const user = await currentUser()
  const userName = user?.fullName ?? user?.username ?? "User"
  const params = await searchParams
  const versionName = params.version || null
  const versionSavedAt = params.savedAt || null

  if (!userId) {
    return (
      <div className='flex flex-col align-center items-center justify-center min-h-screen'>
        <p className='text-gray-900 text-4xl'>Please sign in to view your resume</p>
      </div>
    )
  }

  return <ResumeClient userName={userName} userId={userId} versionName={versionName} versionSavedAt={versionSavedAt} />
}