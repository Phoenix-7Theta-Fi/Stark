import { Metadata } from "next"
import ConsultPageClient from "./ConsultPageClient"
import { PractitionerProfile } from "@/lib/schemas/practitioner"

export const metadata: Metadata = {
    title: "Consult with Practitioners",
    description: "Browse and connect with our registered practitioners",
}

async function getDoctors() {
    try {
        // Using absolute URL for server-side fetch
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const response = await fetch(`${baseUrl}/api/doctor-profiles`, {
            cache: "no-store",
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (!response.ok) {
            console.error("API response not OK:", response.status, response.statusText);
            throw new Error("Failed to fetch practitioners");
        }
        const data = await response.json();
        console.log("API response data:", data);
        
        if (!data.practitioners) {
            console.error("No practitioners property in response:", data);
            return [];
        }
        
        return data.practitioners as PractitionerProfile[];
    } catch (error) {
        console.error("Error fetching practitioners:", error)
        return []
    }
}

export default async function ConsultPage() {
    const doctors = await getDoctors()
    
    // Pass the fetched data to the client component
    return <ConsultPageClient doctors={doctors} />
}