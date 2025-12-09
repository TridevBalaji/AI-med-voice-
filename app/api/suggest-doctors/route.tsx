import { NextRequest, NextResponse } from "next/server";
import { specialists } from "@/shared/list";

export async function POST(req: NextRequest) {
  const { notes } = await req.json();

  const text: string = (notes || "").toLowerCase();

  // Simple heuristic matching based on keywords in the note.
  const heartKeywords = ["chest pain", "heart", "bp", "blood pressure"];
  const childKeywords = ["child", "baby", "infant", "kid", "pediatric"];
  const mentalKeywords = ["anxiety", "depression", "stress", "sleep", "panic"];
  const dietKeywords = ["diet", "weight", "nutrition", "obesity", "food"];

  const matchesKeyword = (keywords: string[]) =>
    keywords.some((word) => text.includes(word));

  let suggested = specialists;

  if (matchesKeyword(heartKeywords)) {
    suggested = specialists.filter(
      (s) => s.specialist === "Cardiologist" || s.specialist === "General Physician"
    );
  } else if (matchesKeyword(childKeywords)) {
    suggested = specialists.filter(
      (s) => s.specialist === "Pediatrician" || s.specialist === "General Physician"
    );
  } else if (matchesKeyword(mentalKeywords)) {
    suggested = specialists.filter(
      (s) => s.specialist === "Psychologist" || s.specialist === "General Physician"
    );
  } else if (matchesKeyword(dietKeywords)) {
    suggested = specialists.filter(
      (s) => s.specialist === "Nutritionist" || s.specialist === "General Physician"
    );
  }

  return NextResponse.json(suggested);
}


