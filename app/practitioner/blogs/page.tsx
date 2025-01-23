"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AuthorCard } from "@/components/ui/content-card"
import { Blog } from "@/types/blog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function PractitionerBlogsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchBlogs()
  }, [])

  async function fetchBlogs() {
    try {
      const response = await fetch("/api/blogs")
      if (!response.ok) {
        throw new Error("Failed to fetch blogs")
      }
      const data = await response.json()
      setBlogs(data)
    } catch (error) {
      console.error("Error fetching blogs:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch blogs"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Filter blogs to show only the practitioner's posts
  const practitionerBlogs = blogs.filter(
    blog => blog.author.practitionerId === session?.user.id
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Blog Posts</h1>
        <Button onClick={() => router.push("/practitioner")}>
          Back to Dashboard
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {practitionerBlogs.map((blog) => (
          <AuthorCard
            key={blog._id.toString()}
            backgroundImage={blog.backgroundImage}
            author={{
              name: blog.author.name,
              avatar: blog.author.avatar,
              readTime: blog.readTime
            }}
            content={{
              title: blog.title,
              description: blog.description
            }}
            className="bg-gradient-to-br from-purple-500/80 to-pink-500/80"
            onClick={() => router.push(`/blog/${blog._id}`)}
          />
        ))}
      </div>

      {practitionerBlogs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">You haven&apos;t created any blog posts yet.</p>
        </div>
      )}
    </div>
  )
}