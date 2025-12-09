import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest,NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import db from "@/config/db";
export async function POST(req: NextRequest) {
    const user = await currentUser();

    try{
         //@ts-ignore
        const users = await db.select().from(usersTable).where(eq(usersTable.email, user?.emailAddresses[0].emailAddress));
        if(users.length > 0){
            return NextResponse.json({ message: "User already exists" }, { status: 400 });
        }
        const newUser = await db.insert(usersTable).values({
            email: user?.emailAddresses[0].emailAddress,
            name: user?.fullName,
            credits:10,
        }).returning()
        return NextResponse.json(newUser[0]);
    }
    catch{
    
    }
}