import { NextResponse } from "next/server"
import { registerUser } from "@/lib/auth"
import type { UserInput } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const data = await request.json() as UserInput
    const result = await registerUser(data)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[REGISTRATION_ERROR]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 400 }
    )
  }
}