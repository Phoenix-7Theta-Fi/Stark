import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import clientPromise from "@/lib/mongodb";
import { AppointmentSchema } from "@/lib/schemas/appointment";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const appointment = AppointmentSchema.parse({
      ...body,
      patientId: session.user.id,
      patientName: session.user.name,
      status: "requested",
    });

    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection("appointments").insertOne(appointment);

    return NextResponse.json({ id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const client = await clientPromise;
    const db = client.db();

    const query: any = {};
    
    // Filter by role (patient or practitioner)
    if (role === "patient") {
      query.patientId = session.user.id;
    } else if (role === "practitioner") {
      query.practitionerId = session.user.id;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const appointments = await db
      .collection("appointments")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}