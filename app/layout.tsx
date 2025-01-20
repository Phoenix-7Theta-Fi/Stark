import { Metadata } from "next"
import { AuthProvider } from "@/components/providers/AuthProvider"
import { Toaster } from "@/components/ui/toaster"
import { Navbar } from "@/components/Navbar"
import "react-quill/dist/quill.snow.css"
import "@/app/styles/quill.css"
import "./globals.css"

export const metadata: Metadata = {
  title: "Tangerine",
  description: "Your health & wellness platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
