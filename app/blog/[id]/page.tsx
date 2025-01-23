"use client"

import { useEffect, useState } from "react"
import { Blog } from "@/types/blog"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { BlogFormDialog } from "@/components/practitioner/BlogFormDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function BlogPost({ params }: { params: { id: string } }) {
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const isAuthor = session?.user?.role === "practitioner" && 
    session?.user?.id === blog?.author.practitionerId

  const fetchBlog = async () => {
    try {
      const response = await fetch(`/api/blogs/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setNotFound(true)
          return
        }
        throw new Error(await response.text())
      }
      const data = await response.json()
      setBlog(data)
    } catch (error) {
      console.error("Error fetching blog:", error)
      setError(error instanceof Error ? error.message : "Failed to load blog")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlog()
  }, [params.id])

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/blogs/${params.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete blog')
      }

      toast({
        title: "Success",
        description: "Blog post deleted successfully"
      })

      router.push('/blog')
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete blog",
        variant: "destructive"
      })
    } finally {
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Blog Post Not Found</h2>
        <p className="text-gray-600 mb-6">The blog post you are looking for does not exist.</p>
        <Link 
          href="/blog"
          className="text-purple-600 hover:text-purple-800 underline"
        >
          Return to Blog List
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Error Loading Blog Post</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link 
          href="/blog"
          className="text-purple-600 hover:text-purple-800 underline"
        >
          Return to Blog List
        </Link>
      </div>
    )
  }

  if (!blog) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Author Actions */}
        {isAuthor && (
          <div className="flex justify-end space-x-4">
            <BlogFormDialog 
              blog={blog}
              onSuccess={fetchBlog}
              trigger={
                <Button variant="outline">
                  Edit Blog Post
                </Button>
              }
            />
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Blog Post
            </Button>
          </div>
        )}

        {/* Header */}
        {blog.image && (
          <div className="relative h-[400px] w-full rounded-lg overflow-hidden">
            <Image
              src={`data:${blog.image.type};base64,${blog.image.data}`}
              alt={blog.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        
        {/* Title and Meta */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">{blog.title}</h1>
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12">
              <Image
                src={blog.author.avatar}
                alt={blog.author.name}
                fill
                className="rounded-full object-cover"
              />
            </div>
            <div>
              {blog.author.practitionerId ? (
                <Link 
                  href={`/user/practitioners/${blog.author.practitionerId}`}
                  className="font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                >
                  Dr. {blog.author.name}
                </Link>
              ) : (
                <p className="font-semibold">{blog.author.name}</p>
              )}
              <p className="text-sm text-gray-600">{blog.readTime} min read</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: blog.description }} />
          <div className="text-sm text-gray-500 space-y-1">
            {blog.createdAt && (
              <p>Published on: {new Date(blog.createdAt).toLocaleDateString()}</p>
            )}
            {blog.updatedAt && blog.updatedAt !== blog.createdAt && (
              <p>Last updated: {new Date(blog.updatedAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {/* Back to Blog List */}
        <div className="mt-8 border-t pt-8">
          <Link 
            href="/blog"
            className="text-purple-600 hover:text-purple-800 flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back to Blog List</span>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this blog post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The blog post will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}