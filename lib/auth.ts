import { hash } from "bcryptjs"
import clientPromise from "./mongodb"
import { z } from "zod"

const UserSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(50, "Username must be less than 50 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "practitioner"], {
    required_error: "Role is required",
    invalid_type_error: "Role must be either 'user' or 'practitioner'"
  })
})

export type UserInput = z.infer<typeof UserSchema>

export async function registerUser(data: UserInput) {
  const validatedData = UserSchema.parse(data)
  
  const { username, email, password, role } = validatedData
  
  const client = await clientPromise
  const users = client.db("tweb").collection("users")
  
  const existingUser = await users.findOne({ email })
  
  if (existingUser) {
    throw new Error("Email already exists")
  }

  const hashedPassword = await hash(password, 12)
  
  const user = await users.insertOne({
    username,
    email,
    password: hashedPassword,
    role,
    createdAt: new Date()
  })

  return { success: true, userId: user.insertedId }
}