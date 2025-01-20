"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { SignOutButton } from "./auth/SignOutButton"

export function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold text-gray-800">
              Tangerine
            </Link>
            <div className="ml-10 flex items-center space-x-4">
              <Link 
                href="/blog" 
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Blog
              </Link>
              {session?.user.role === 'practitioner' ? (
                <Link 
                  href="/practitioner"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Dashboard
                </Link>
              ) : session?.user ? (
                <>
                  <Link 
                    href="/user"
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/user/consult"
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Consult
                  </Link>
                </>
              ) : null}
            </div>
          </div>
          <div className="flex items-center">
            {session ? (
              <SignOutButton />
            ) : (
              <Link
                href="/api/auth/signin"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}