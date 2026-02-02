import { auth, currentUser } from "@clerk/nextjs/server"
import LandingPage from "./_components/landing-page"
import HomePage from "./_components/home-page"

export default async function Page() {
  const { userId } = await auth()
  const user = await currentUser()
  const userName = user?.username ?? "fakeuser123"

  // Show landing page if not authenticated, otherwise show home
  if (userId) {
    return <HomePage userName={userName} userId={userId} />
  } else {
    return <LandingPage />
  }
}
