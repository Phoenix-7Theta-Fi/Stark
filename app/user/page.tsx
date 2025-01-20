import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default async function UserDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">User Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/user/appointments">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-2">My Appointments</h2>
              <p className="text-gray-500">
                View and manage your appointments with practitioners.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/user/practitioners">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-2">Find Practitioners</h2>
              <p className="text-gray-500">
                Browse and book appointments with practitioners.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/blog">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-2">Health Blog</h2>
              <p className="text-gray-500">
                Read articles and updates from practitioners.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </main>
  );
}