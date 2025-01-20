import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !["confirmed", "declined"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify the practitioner owns this appointment
    const appointment = await db
      .collection("appointments")
      .findOne({
        _id: new ObjectId(params.id),
        practitionerId: session.user.id,
      });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update appointment status
    const result = await db
      .collection("appointments")
      .updateOne(
        { _id: new ObjectId(params.id) },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        }
      );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update appointment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}