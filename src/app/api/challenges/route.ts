import { NextResponse } from "next/server";
import { challenges } from "@/lib/promptgolf";

export function GET() {
  return NextResponse.json({ challenges });
}
