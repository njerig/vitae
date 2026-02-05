// app/home/page.tsx (SERVER COMPONENT)
import { auth, currentUser } from "@clerk/nextjs/server"
import Home from "./home-page"

export default async function Page() {
  const { userId } = await auth()
  const user = await currentUser()
  const userName = user?.username ?? "fakeuser123"

  if (!userId) {
    return (
      <div className="flex flex-col align-center items-center justify-center">
        <p className="text-white text-8xl">NOT LOGGED IN</p>
      </div>
    )
  }

  return <Home userName={userName} userId={userId} />
}
