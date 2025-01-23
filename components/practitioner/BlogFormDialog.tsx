"use client"

import { useState, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { Blog } from "@/types/blog"
import Image from 'next/image'

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill")
    return RQ
  },
  { 
    ssr: false,
    loading: () => <p className="p-4">Loading editor...</p>
  }
)

const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
}

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "link",
  "image",
]

interface BlogFormDialogProps {
  blog?: Blog  // Optional blog for editing mode
  trigger?: React.ReactNode  // Custom trigger button/element
  onSuccess?: () => void  // Callback after successful submission
}

export function BlogFormDialog({ blog, trigger, onSuccess }: BlogFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState(blog?.title || "")
  const [content, setContent] = useState(blog?.description || "")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(blog?.backgroundImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { data: session } = useSession()

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setTitle(blog?.title || "")
      setContent(blog?.description || "")
      setSelectedImage(null)
      setPreviewUrl(blog?.backgroundImage || null)
    }
  }, [open, blog])

  const calculateReadTime = (text: string) => {
    const wordsPerMinute = 200
    const textContent = text.replace(/<[^>]*>/g, "") // Remove HTML tags
    const words = textContent.trim().split(/\s+/).length
    const readTime = Math.ceil(words / wordsPerMinute)
    return `${readTime} min read`
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const imageUrl = URL.createObjectURL(file)
      setPreviewUrl(imageUrl)
    }
  }

  const handleSubmit = async () => {
    if (!title || !content) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', content)
      formData.append('readTime', calculateReadTime(content))
      
      if (selectedImage) {
        formData.append('image', selectedImage)
      }

      if (!blog) {
        // Creating new blog
        formData.append('author', JSON.stringify({
          name: session?.user?.name || "Anonymous",
          avatar: session?.user?.image || "/default-avatar.png",
          practitionerId: session?.user?.id
        }))
      }

      const response = await fetch(
        blog ? `/api/blogs/${blog._id}` : "/api/blogs/create",
        {
          method: blog ? "PUT" : "POST",
          body: formData,
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          error.error === "Server configuration error: Missing AI API key"
            ? "System is not configured properly. Please contact admin."
            : error.error || `Failed to ${blog ? 'update' : 'create'} blog post`
        )
      }

      toast({
        title: "Success",
        description: `Blog post ${blog ? 'updated' : 'created'} successfully`,
      })

      // Reset form and close dialog
      setTitle("")
      setContent("")
      setSelectedImage(null)
      setPreviewUrl(null)
      setOpen(false)

      // Call success callback if provided
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${blog ? 'update' : 'create'} blog post`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline">
      {blog ? "Edit Blog Post" : "Create Blog Post"}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl" aria-describedby="blog-form">
        <div id="blog-form" className="sr-only">
          Form to {blog ? 'edit' : 'create'} a blog post with title, image and content editor
        </div>
        <DialogHeader>
          <DialogTitle>
            {blog ? 'Edit Blog Post' : 'Create a New Blog Post'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Blog Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="cursor-pointer"
              />
            </div>
            {previewUrl && (
              <div className="relative w-full h-48 mt-2">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            )}
          </div>
          <div className="min-h-[400px] border rounded-md bg-white">
            <div className="h-[400px]">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="Write your blog post here..."
                style={{ height: "350px" }}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (blog ? "Updating..." : "Publishing...") : (blog ? "Update" : "Publish")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}