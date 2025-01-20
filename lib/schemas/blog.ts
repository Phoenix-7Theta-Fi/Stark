import { z } from "zod"
import type { BlogDocument } from "@/types/blog"

export const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  author: z.object({
    name: z.string().min(1, "Author name is required"),
    avatar: z.string().min(1, "Author avatar is required")
  }),
  readTime: z.string().min(1, "Read time is required"),
  image: z.object({
    data: z.string(),
    type: z.string()
  }).optional(),
  createdAt: z.date().optional().default(() => new Date())
})

export type BlogInput = z.infer<typeof blogSchema>

// Type guard to check if a value matches the BlogDocument interface
export function isBlogDocument(value: unknown): value is BlogDocument {
  const check = blogSchema.safeParse(value)
  return check.success
}