import { auth } from "@clerk/nextjs/server"
import Home from "./home-client"

export default async function Page() {
  const { userId } = await auth()

  if (!userId) {
    return (
      <div className="flex flex-col align-center items-center justify-center min-h-screen">
        <p className="text-gray-900 text-4xl">Please sign in to view your resume</p>
      </div>
    )
  }

  return <Home />
}
