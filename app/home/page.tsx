import { auth, currentUser } from "@clerk/nextjs/server"
import Home from "./home-page"

export default async function Page() {
  const { userId } = await auth()
  const user = await currentUser()
  const userName = user?.username ?? "fakeuser123"

   if (!userId) {
    return (
      <div className='flex flex-col align-center items-center justify-center min-h-screen'>
        <p className='text-gray-900 text-4xl'>Please sign in to view your resume</p>
      </div>
    )
  }

  return <Home userName={userName} userId={userId} />
}
