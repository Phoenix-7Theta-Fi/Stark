import Link from "next/link"

export default function NotFound() {
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