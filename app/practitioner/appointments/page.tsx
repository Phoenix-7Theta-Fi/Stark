import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import { PractitionerAppointmentsClient } from "./PractitionerAppointmentsClient";

export default async function PractitionerAppointmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Manage Appointments</h1>
      <PractitionerAppointmentsClient />
    </main>
  );
}