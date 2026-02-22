"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the admin login page
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <Loader2 className="h-10 w-10 animate-spin text-journal-maroon" />
      <p className="mt-4 text-lg text-gray-700">Redirecting to Login...</p>
    </div>
  );
}
