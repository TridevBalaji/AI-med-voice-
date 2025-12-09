import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import db from "@/config/db";
export async function POST(req: NextRequest) {
    const user = await currentUser();

    try{
        if (!user || !user.emailAddresses?.length) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const email = user.emailAddresses[0].emailAddress;
        const name = user.fullName || user.firstName || "User";

        const users = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email));
        if(users.length > 0){
            return NextResponse.json({ message: "User already exists" }, { status: 400 });
        }
        const newUser = await db.insert(usersTable).values({
            email,
            name,
            credits: 10,
        }).returning()
        return NextResponse.json(newUser[0]);
    }
    catch(error){
        console.error("Failed to create user", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}