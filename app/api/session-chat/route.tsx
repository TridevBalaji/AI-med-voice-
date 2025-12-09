import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { eq, and, desc } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

import db from "@/config/db";
import { SessionChatTable } from "@/config/schema";

export async function POST(req: NextRequest) {
  const user = await currentUser();

  if (!user || !user.primaryEmailAddress?.emailAddress) {
    return NextResponse.json(
      { message: "Unauthenticated or missing email" },
      { status: 401 }
    );
  }

  const { notes, selectedDoctor } = await req.json();

  if (!notes || !selectedDoctor) {
    return NextResponse.json(
      { message: "notes and selectedDoctor are required" },
      { status: 400 }
    );
  }

  try {
    const sessionId = uuidv4();
    const email = user.primaryEmailAddress.emailAddress;

    const [result] = await db
      .insert(SessionChatTable)
      .values({
        sessionId,
        createdBy: email,
        notes,
        selectedDoctor,
        createdOn: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating session chat", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const user = await currentUser();

  if (!user || !user.primaryEmailAddress?.emailAddress) {
    return NextResponse.json(
      { message: "Unauthenticated or missing email" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  try {
    const email = user.primaryEmailAddress.emailAddress;

    // If sessionId is provided, return single session
    if (sessionId) {
      const result = await db
        .select()
        .from(SessionChatTable)
        .where(
          and(
            eq(SessionChatTable.sessionId, sessionId),
            eq(SessionChatTable.createdBy, email)
          )
        );

      if (result.length === 0) {
        return NextResponse.json({ message: "Session not found" }, { status: 404 });
      }

      return NextResponse.json(result[0]);
    }

    // If no sessionId, return all sessions for the user, ordered by createdOn descending
    const result = await db
      .select()
      .from(SessionChatTable)
      .where(eq(SessionChatTable.createdBy, email))
      .orderBy(desc(SessionChatTable.createdOn));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching session chat", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


