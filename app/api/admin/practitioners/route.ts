import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { NextResponse } from "next/server"
import { Collection } from "mongodb"
import { PractitionerProfile } from "@/lib/schemas/practitioner"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const db = await getDatabase()
        const practitionerCollection: Collection<PractitionerProfile> = db.collection("practitionerProfiles")

        // Log the collection name and find query
        console.log("[ADMIN_PRACTITIONERS_GET] Querying collection:", practitionerCollection.collectionName)

        const practitioners = await practitionerCollection
            .find({})
            .toArray()

        // Log the results
        console.log("[ADMIN_PRACTITIONERS_GET] Found practitioners:", practitioners.length)

        return NextResponse.json(practitioners)
    } catch (error) {
        console.error("[ADMIN_PRACTITIONERS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}