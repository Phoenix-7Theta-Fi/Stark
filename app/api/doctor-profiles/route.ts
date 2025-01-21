import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db("tweb");

        // Get all practitioners with profiles from the database
        const practitioners = await db.collection("practitionerProfiles").find({}).toArray();
        
        console.log('Fetched practitioners:', JSON.stringify(practitioners, null, 2));
        
        if (!practitioners || practitioners.length === 0) {
            console.log('No practitioners found in database');
            return NextResponse.json({ practitioners: [] });
        }

        return NextResponse.json({ practitioners });
    } catch (error) {
        console.error("Failed to fetch practitioners:", error);
        return NextResponse.json(
            { error: "Failed to fetch practitioners" },
            { status: 500 }
        );
    }
}