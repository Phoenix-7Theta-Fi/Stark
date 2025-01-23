import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { NextResponse } from "next/server"
import { Collection } from "mongodb"
import { PractitionerProfile } from "@/lib/schemas/practitioner"
import { getDatabase } from "@/lib/mongodb"

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const db = await getDatabase()
        const practitionerCollection: Collection<PractitionerProfile> = db.collection("practitionerProfiles")

        const result = await practitionerCollection.findOneAndUpdate(
            { userId: params.id },
            { $set: { isVerified: true } },
            { returnDocument: 'after' }
        )

        if (!result) {
            return new NextResponse("Practitioner not found", { status: 404 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("[VERIFY_PRACTITIONER_PATCH]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}