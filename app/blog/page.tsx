"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthorCard } from "@/components/ui/content-card"
import { Blog } from "@/types/blog"

export default function BlogPage() {
  const router = useRouter()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
      } finally {
        setLoading(false)
      }
    }

    fetchBlogs()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Health & Wellness Blog</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogs.map((blog) => (
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
    </div>
  )
}