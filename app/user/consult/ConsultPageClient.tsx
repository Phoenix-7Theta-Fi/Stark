"use client"

import { PractitionerProfile } from '@/lib/schemas/practitioner'
import DoctorProfileCard from '@/components/ui/doctor-profile-card'

interface ConsultPageClientProps {
    doctors: PractitionerProfile[]
}

export default function ConsultPageClient({ doctors }: ConsultPageClientProps) {
    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8 text-center">
                Consult with Our Practitioners
            </h1>
            
            {doctors.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                    No practitioners available at the moment.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doctors.map((practitioner) => (
                        <DoctorProfileCard
                            key={practitioner.userId}
                            practitioner={practitioner}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}