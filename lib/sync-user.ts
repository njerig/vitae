import { auth, currentUser } from "@clerk/nextjs/server"
import { Pool } from "pg"
const POOL = new Pool({ connectionString: process.env.DATABASE_URL })

export async function syncCurrentUser() {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Unauthorized")

    let email: string | null = null
    let full_name: string | null = null

    const u = await currentUser()
    if (u) {
      email = u.emailAddresses?.[0]?.emailAddress ?? null
      full_name = u.fullName ?? null
    }

    await POOL.query(
      `
      INSERT INTO users (id, email, full_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING
     `,
      [userId, email, full_name],
    )

    return userId
  } catch (error) {
    console.error(`Error while syncing user from Clerk: ${error}`)
  }
}
