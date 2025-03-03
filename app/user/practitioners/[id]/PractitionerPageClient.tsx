"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { BlogFormDialog } from "@/components/practitioner/BlogFormDialog";
import { PractitionerBlogs } from "@/components/practitioner/PractitionerBlogs";
import { useSession } from "next-auth/react";
import { BadgeCheck } from "lucide-react";

interface PractitionerPageClientProps {
  practitioner: {
    _id: string;
    name: string;
    specialization: string;
    qualifications: string;
    experience: string;
    bio: string;
  };
}

export function PractitionerPageClient({ practitioner }: PractitionerPageClientProps) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  if (!practitioner) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            Practitioner information not available
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPractitionerProfile = session?.user?.name === practitioner.name;
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">
                {practitioner.name}
                {session?.user?.role !== "admin" && (
                  <BadgeCheck className="inline-block ml-2 h-5 w-5 text-blue-500" />
                )}
              </h2>
              <p className="text-gray-500">{practitioner.specialization}</p>
            </div>

            <div>
              <h3 className="font-semibold">Qualifications</h3>
              <p>{practitioner.qualifications}</p>
            </div>

            <div>
              <h3 className="font-semibold">Experience</h3>
              <p>{practitioner.experience}</p>
            </div>

            <div>
              <h3 className="font-semibold">About</h3>
              <p className="text-gray-600">{practitioner.bio}</p>
            </div>

            {!isAdmin && (
              <div className="flex gap-4">
                <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Book Appointment"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Book an Appointment with {practitioner.name}</DialogTitle>
                    </DialogHeader>
                    <AppointmentForm
                      practitionerId={practitioner._id}
                      practitionerName={practitioner.name}
                      onSuccess={() => {
                        setIsBookingOpen(false);
                        setIsSubmitting(false);
                      }}
                    />
                  </DialogContent>
                </Dialog>
                {isPractitionerProfile && (
                  <div className="flex-1">
                    <BlogFormDialog />
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardContent className="pt-6">
            <PractitionerBlogs practitionerId={practitioner._id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}