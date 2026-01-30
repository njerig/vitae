import { syncCurrentUser } from "@/lib/sync-user";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Create a canon resume history item
export async function POST(request: NextRequest) {
  try {
    const db_user = await auth();
    const db_user_id = db_user.userId;

    if (!db_user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { item_type, title, position, content } = body;

    const post = ""; //!! TO-DO, route it to postgres POST query, somehow

    return NextResponse.json(post);
  } catch (error) {
      console.error(`Error creating career history item: ${error}`);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Get all canon history items
export async function GET(request: NextRequest) {
  try {
    const db_user = await auth();
    const db_user_id = db_user.userId;


    if (!db_user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();


    const post = ""; //!! TO-DO, route it to postgres POST query, somehow

    return NextResponse.json(post);
  } catch (error) {
      console.error(`Error creating career history item: ${error}`);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}