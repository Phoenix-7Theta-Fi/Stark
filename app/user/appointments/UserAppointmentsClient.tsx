"use client";

import { useEffect, useState } from "react";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { toast } from "@/hooks/use-toast";
import { Appointment } from "@/lib/schemas/appointment";
import { ObjectId } from "mongodb";

export function UserAppointmentsClient() {
  const [appointments, setAppointments] = useState<{
    requested: Appointment[];
    confirmed: Appointment[];
    declined: Appointment[];
  }>({
    requested: [],
    confirmed: [],
    declined: [],
  });

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments?role=patient");
      if (!res.ok) throw new Error("Failed to fetch appointments");
      
      const data: Appointment[] = await res.json();
      
      // Group appointments by status
      const grouped = data.reduce(
        (acc, appointment) => {
          acc[appointment.status].push(appointment);
          return acc;
        },
        {
          requested: [] as Appointment[],
          confirmed: [] as Appointment[],
          declined: [] as Appointment[],
        }
      );

      setAppointments(grouped);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const renderSection = (title: string, items: Appointment[]) => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-gray-500">No appointments found</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((appointment) => (
            <AppointmentCard
              key={appointment._id?.toString()}
              id={appointment._id?.toString() || ''}
              patientName={appointment.patientName}
              practitionerName={appointment.practitionerName}
              date={appointment.date}
              timeSlot={appointment.timeSlot}
              consultationType={appointment.consultationType}
              notes={appointment.notes}
              status={appointment.status}
              onStatusUpdate={fetchAppointments}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {renderSection("Requested Appointments", appointments.requested)}
      {renderSection("Confirmed Appointments", appointments.confirmed)}
      {renderSection("Declined Appointments", appointments.declined)}
    </div>
  );
}