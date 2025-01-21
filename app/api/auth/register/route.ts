import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { hashPassword } from '@/lib/passwordUtils';
import { UserRole } from '@/lib/models/user';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = {
      email,
      password: hashedPassword,
      name: name || '',
      role: role || UserRole.USER, // Ensure role is set
      createdAt: new Date()
    };

    // Insert user into database
    const result = await db.collection('users').insertOne(newUser);

    return NextResponse.json(
      {
        message: 'User registered successfully',
        userId: result.insertedId,
        role: newUser.role // Return role for potential client-side use
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}