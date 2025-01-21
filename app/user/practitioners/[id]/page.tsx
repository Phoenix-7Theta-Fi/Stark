import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import { PractitionerPageClient } from "./PractitionerPageClient";
import clientPromise from "@/lib/mongodb";
import { notFound } from "next/navigation";

export default async function PractitionerPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  try {
    const client = await clientPromise;
    const db = client.db("tweb");
    
    const practitioner = await db
      .collection("practitionerProfiles")
      .findOne({ userId: params.id });

    if (!practitioner) {
      notFound();
    }

    return (
      <main className="container mx-auto py-8">
        <PractitionerPageClient 
          practitioner={{
            _id: practitioner.userId,
            name: practitioner.name || "",
            specialization: practitioner.consultationType || "",
            qualifications: practitioner.qualification || "",
            experience: practitioner.experience || "",
            bio: practitioner.bio || "",
          }} 
        />
      </main>
    );
  } catch (error) {
    console.error("Error fetching practitioner:", error);
    notFound();
  }
}