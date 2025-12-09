import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import db from "@/config/db";
import { MedicalReportsTable } from "@/config/schema";

export async function POST(req: NextRequest) {
  const user = await currentUser();

  if (!user || !user.primaryEmailAddress?.emailAddress) {
    return NextResponse.json(
      { message: "Unauthenticated or missing email" },
      { status: 401 }
    );
  }

  try {
    const { sessionId, agent, messages } = await req.json();

    if (!sessionId || !agent || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { message: "sessionId, agent, and messages are required" },
        { status: 400 }
      );
    }

    // Build conversation transcript
    const transcript = messages
      .map((msg: { role: string; text: string }) => {
        const role = msg.role === "user" ? "Patient" : "AI Assistant";
        return `${role}: ${msg.text}`;
      })
      .join("\n\n");

    // Create prompt for Groq/OpenAI
    const prompt = `You are an AI Medical Voice Agent that just finished a voice conversation with a user. Based on the conversation transcript below, extract and return a structured medical report in JSON format.

Conversation Transcript:
${transcript}

Extract the following information:
1. sessionId: "${sessionId}"
2. agent: "${agent}"
3. user: Extract the patient's name if mentioned, otherwise use "Anonymous"
4. timestamp: Current date and time in ISO format
5. chiefComplaint: One-sentence summary of the main health concern
6. summary: 2-3 sentence summary of the conversation, symptoms, and recommendations
7. symptoms: List of symptoms mentioned by the user (array of strings)
8. duration: How long the user has experienced the symptoms (e.g., "2 days", "1 week", "unknown")
9. severity: mild, moderate, or severe (based on context)
10. medicationsMentioned: List of any medicines mentioned (array of strings, empty if none)
11. recommendations: List of AI suggestions (e.g., "rest", "see a doctor", "drink water") (array of strings)

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just pure JSON):
{
  "sessionId": "string",
  "agent": "string",
  "user": "string",
  "timestamp": "ISO Date string",
  "chiefComplaint": "string",
  "summary": "string",
  "symptoms": ["symptom1", "symptom2"],
  "duration": "string",
  "severity": "string",
  "medicationsMentioned": ["med1", "med2"],
  "recommendations": ["rec1", "rec2"]
}

Only include valid fields. If a field cannot be determined from the conversation, use appropriate defaults (empty arrays, "unknown", etc.). Respond with nothing else - just the JSON object.`;

    // Call Groq API using SDK
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { message: "GROQ_API_KEY not configured" },
        { status: 500 }
      );
    }

    const groq = new Groq({
      apiKey: groqApiKey,
    });

    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content: "You are a medical report generator. Extract structured information from medical conversations and return only valid JSON. Do not include any markdown formatting, code blocks, or explanations - only return the raw JSON object.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    });

    const reportContent = completion.choices[0]?.message?.content;

    if (!reportContent) {
      return NextResponse.json(
        { message: "No content in response" },
        { status: 500 }
      );
    }

    // Parse the JSON response - handle cases where response might have markdown code blocks
    let report;
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonString = reportContent.trim();
      
      // Remove markdown code blocks if present
      if (jsonString.startsWith("```json")) {
        jsonString = jsonString.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonString.startsWith("```")) {
        jsonString = jsonString.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      
      report = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse report JSON:", parseError);
      console.error("Response content:", reportContent);
      return NextResponse.json(
        { message: "Invalid JSON in response", details: String(parseError) },
        { status: 500 }
      );
    }

    // Ensure all required fields are present
    const finalReport = {
      sessionId: report.sessionId || sessionId,
      agent: report.agent || agent,
      user: report.user || "Anonymous",
      timestamp: report.timestamp || new Date().toISOString(),
      chiefComplaint: report.chiefComplaint || "No specific complaint mentioned",
      summary: report.summary || "No summary available",
      symptoms: Array.isArray(report.symptoms) ? report.symptoms : [],
      duration: report.duration || "unknown",
      severity: report.severity || "mild",
      medicationsMentioned: Array.isArray(report.medicationsMentioned)
        ? report.medicationsMentioned
        : [],
      recommendations: Array.isArray(report.recommendations)
        ? report.recommendations
        : [],
    };

    // Save report to database
    const email = user.primaryEmailAddress.emailAddress;
    try {
      await db.insert(MedicalReportsTable).values({
        sessionId: finalReport.sessionId,
        createdBy: email,
        agent: finalReport.agent,
        user: finalReport.user,
        timestamp: finalReport.timestamp,
        chiefComplaint: finalReport.chiefComplaint,
        summary: finalReport.summary,
        symptoms: JSON.stringify(finalReport.symptoms),
        duration: finalReport.duration,
        severity: finalReport.severity,
        medicationsMentioned: JSON.stringify(finalReport.medicationsMentioned),
        recommendations: JSON.stringify(finalReport.recommendations),
        createdOn: new Date().toISOString(),
      });
    } catch (dbError) {
      console.error("Error saving report to database:", dbError);
      // Still return the report even if database save fails
    }

    return NextResponse.json(finalReport);
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

