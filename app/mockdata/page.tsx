import { SignedIn, SignedOut } from "@clerk/nextjs"
import { auth, currentUser } from "@clerk/nextjs/server"

export default async function Home() {

    const { userId } = await auth() // uses current session information
    const user = await currentUser() // makes an API request to clerk to get the name
    const userName = user?.id

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <SignedIn>
        <p>Hello, you are signed in, you are in MOCKDATA</p>
        <p>{userName}</p>
      </SignedIn>
      <SignedOut>
        <p>SHOULD NOT be able to see this page. This text shouldnt even be able to appear</p>
      </SignedOut>
    </div>
  )
}
