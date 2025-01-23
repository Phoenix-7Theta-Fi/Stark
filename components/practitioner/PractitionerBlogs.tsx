import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Blog } from "@/types/blog";
import { Trash2 } from "lucide-react";

interface PractitionerBlogsProps {
  practitionerId: string;
}

export function PractitionerBlogs({ practitionerId }: PractitionerBlogsProps) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingBlogId, setDeletingBlogId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBlogs();
  }, [practitionerId]);

  const fetchBlogs = async () => {
    try {
      const response = await fetch(`/api/blogs?practitionerId=${practitionerId}`);
      if (!response.ok) throw new Error("Failed to fetch blogs");
      const data = await response.json();
      setBlogs(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load blogs",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blogId: string) => {
    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete blog");

      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });

      // Refresh blogs list
      fetchBlogs();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete blog post",
      });
    } finally {
      setDeletingBlogId(null);
    }
  };

  if (loading) {
    return <div>Loading blogs...</div>;
  }

  if (blogs.length === 0) {
    return <div className="text-gray-500">No blog posts found</div>;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold mb-4">Blog Posts</h3>
      <div className="space-y-2">
        {blogs.map((blog) => (
          <div 
            key={blog._id} 
            className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
          >
            <span className="text-sm">{blog.title}</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => setDeletingBlogId(blog._id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <AlertDialog
        open={!!deletingBlogId}
        onOpenChange={(isOpen) => !isOpen && setDeletingBlogId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blog post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deletingBlogId && handleDelete(deletingBlogId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}