import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { PractitionerProfile } from "@/components/practitioner/PractitionerProfile";

export default async function PractitionerDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Practitioner Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link href="/practitioner/appointments">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-2">Appointments</h2>
              <p className="text-gray-500">
                Manage appointment requests and view your schedule.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/blog">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-2">Blog Posts</h2>
              <p className="text-gray-500">
                Write and manage your health articles.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="hover:bg-gray-50 transition-colors">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-2">Analytics</h2>
            <p className="text-gray-500">
              View insights about your practice and appointments.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
        <PractitionerProfile />
      </div>
    </main>
  );
}