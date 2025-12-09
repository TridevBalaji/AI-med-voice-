import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import db from "@/config/db";
import { MedicalReportsTable, SessionChatTable } from "@/config/schema";

// Safely parse JSON array fields that may be empty or invalid
function parseJsonArray(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// GET - Fetch reports for a session or all reports for the user
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
  const email = user.primaryEmailAddress.emailAddress;

  try {
    if (sessionId) {
      // Fetch report for specific session, ensuring it belongs to the logged-in user,
      // and pull session metadata for visualization.
      const result = await db
        .select({
          report: MedicalReportsTable,
          session: {
            notes: SessionChatTable.notes,
            selectedDoctor: SessionChatTable.selectedDoctor,
            sessionCreatedOn: SessionChatTable.createdOn,
          },
        })
        .from(MedicalReportsTable)
        .leftJoin(
          SessionChatTable,
          and(
            eq(SessionChatTable.sessionId, MedicalReportsTable.sessionId),
            eq(SessionChatTable.createdBy, MedicalReportsTable.createdBy)
          )
        )
        .where(
          and(
            eq(MedicalReportsTable.sessionId, sessionId),
            eq(MedicalReportsTable.createdBy, email)
          )
        )
        .orderBy(desc(MedicalReportsTable.createdOn))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json({ message: "Report not found" }, { status: 404 });
      }

      // Parse JSON fields
      const { report, session } = result[0];
      return NextResponse.json({
        ...report,
        symptoms: parseJsonArray(report.symptoms),
        medicationsMentioned: parseJsonArray(report.medicationsMentioned),
        recommendations: parseJsonArray(report.recommendations),
        sessionMeta: session,
      });
    } else {
      // Fetch all reports for the user with associated session metadata
      const result = await db
        .select({
          report: MedicalReportsTable,
          session: {
            notes: SessionChatTable.notes,
            selectedDoctor: SessionChatTable.selectedDoctor,
            sessionCreatedOn: SessionChatTable.createdOn,
          },
        })
        .from(MedicalReportsTable)
        .leftJoin(
          SessionChatTable,
          and(
            eq(SessionChatTable.sessionId, MedicalReportsTable.sessionId),
            eq(SessionChatTable.createdBy, MedicalReportsTable.createdBy)
          )
        )
        .where(eq(MedicalReportsTable.createdBy, email))
        .orderBy(desc(MedicalReportsTable.createdOn));

      // Parse JSON fields for all reports
      const reports = result.map(({ report, session }) => ({
        ...report,
        symptoms: parseJsonArray(report.symptoms),
        medicationsMentioned: parseJsonArray(report.medicationsMentioned),
        recommendations: parseJsonArray(report.recommendations),
        sessionMeta: session,
      }));

      return NextResponse.json(reports);
    }
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


