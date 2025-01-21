import React from 'react';
import RegisterForm from '@/components/auth/RegisterForm';
import LoginForm from '@/components/auth/LoginForm';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Welcome to Tangerine</h1>
      <div className="flex space-x-10">
        <RegisterForm />
        <LoginForm />
      </div>
    </div>
  );
}
