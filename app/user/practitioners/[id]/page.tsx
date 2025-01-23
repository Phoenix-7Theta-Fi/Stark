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

  if (!session?.user) {
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

    const isAdmin = session.user.role === "admin";

    return (
      <main className="container mx-auto py-8">
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Practitioner Profile</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Status: {practitioner.isVerified ? 'Verified' : 'Not Verified'}
                </span>
                <a href="/admin" className="text-blue-500 hover:text-blue-600">
                  Back to Admin
                </a>
              </div>
            </div>
          )}
          <PractitionerPageClient 
            practitioner={{
              _id: practitioner.userId,
              name: practitioner.name || "",
              specialization: practitioner.consultationType || "",
              qualifications: practitioner.qualification || "",
              experience: `${practitioner.experience} years` || "",
              bio: practitioner.bio || "No bio available",
            }} 
          />
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error fetching practitioner:", error);
    notFound();
  }
}