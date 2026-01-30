import { currentUser } from "@clerk/nextjs/server";

export async function syncCurrentUser() {
  try {
    const clerk_user = await currentUser();

    if (!clerk_user) {
      return null
    }

    // sync with postgres database


    return clerk_user;
  } catch (error) {
    console.error(`Error while syncing user from Clerk: ${error}`)
  }
}
