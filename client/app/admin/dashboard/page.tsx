"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the email campaign page as it's the primary admin function now.
    router.replace('/admin/email-campaign');
  }, [router]);

  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6">
        <Loader2 className="h-10 w-10 animate-spin text-journal-maroon" />
        <p className="mt-4 text-lg text-gray-700">Redirecting to Email Campaign...</p>
      </div>
    </AdminLayout>
  );
}
