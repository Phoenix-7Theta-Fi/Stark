import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import { UserAppointmentsClient } from "./UserAppointmentsClient";

export default async function UserAppointmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Appointments</h1>
      <UserAppointmentsClient />
    </main>
  );
}