import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Image from "next/image";

export default async function Home() {
  const { userId } = await auth(); // uses current session information
  const user = await currentUser(); // makes an API request to clerk to get the name
  const userName = user?.username;

  const welcomeSuffix = userName ? `Hello 👋, ${userName}\n Your userId: ${userId}` : `Signed out`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <SignedIn>
        <p>Hello, you are signed in</p>
      </SignedIn>
      <SignedOut>
        <p>SHOULD NOT be able to see this page. This text shouldnt even be able to appear</p>
      </SignedOut>
    </div>
  );
}
