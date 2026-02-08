// app/resume/page.tsx (SERVER COMPONENT)
import { auth, currentUser } from "@clerk/nextjs/server"
import ResumeClient from "./resume-client"

export default async function ResumePage() {
  const { userId } = await auth()
  const user = await currentUser()
  const userName = user?.fullName ?? user?.username ?? "User"

  if (!userId) {
    return (
      <div className='flex flex-col align-center items-center justify-center min-h-screen'>
        <p className='text-gray-900 text-4xl'>Please sign in to view your resume</p>
      </div>
    )
  }

  return <ResumeClient userName={userName} userId={userId} />
}