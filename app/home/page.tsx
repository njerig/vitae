// app/page.tsx (SERVER COMPONENT) — NO "use client"
import { auth, currentUser } from "@clerk/nextjs/server"
import Home from "./home-page"
const { userId } = await auth() // uses current session information
const user = await currentUser() // makes an API request to clerk to get the name
const userName = user!.username

export default async function Page() {
  const { userId } = await auth() // uses current session information
  const user = await currentUser() // makes an API request to clerk to get the name
  const userName = user?.username ? user?.username : "fakeuser123"

  if (!userId) {
    return (
      <div className='flex flex-col align-center items-center justify-center'>
        <p className='text-white text-8xl'>NOT LOGGED IN</p>
      </div>
    )
  }

  return <Home userName={userName} userId={userId} />
}
