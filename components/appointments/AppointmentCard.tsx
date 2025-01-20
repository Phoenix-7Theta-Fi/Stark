"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface AppointmentCardProps {
  id: string;
  patientName: string;
  practitionerName: string;
  date: string;
  timeSlot: string;
  consultationType: "online" | "in-person";
  notes?: string;
  status: "requested" | "confirmed" | "declined";
  isPractitioner?: boolean;
  onStatusUpdate?: () => void;
}

export function AppointmentCard({
  id,
  patientName,
  practitionerName,
  date,
  timeSlot,
  consultationType,
  notes,
  status,
  isPractitioner = false,
  onStatusUpdate,
}: AppointmentCardProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (newStatus: "confirmed" | "declined") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update appointment");
      }

      toast({
        title: "Success",
        description: `Appointment ${newStatus} successfully`,
      });

      onStatusUpdate?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "requested":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {isPractitioner ? "Patient" : "Practitioner"}
              </p>
              <p className="font-medium">
                {isPractitioner ? patientName : practitionerName}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor()}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium">
                {formatDate(new Date(date))} at {timeSlot}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Consultation Type</p>
              <p className="font-medium capitalize">{consultationType}</p>
            </div>

            {notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm">{notes}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {isPractitioner && status === "requested" && (
        <CardFooter className="gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleStatusUpdate("declined")}
            disabled={loading}
          >
            Decline
          </Button>
          <Button
            className="flex-1"
            onClick={() => handleStatusUpdate("confirmed")}
            disabled={loading}
          >
            Confirm
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}