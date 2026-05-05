import { redirect } from 'next/navigation';
import { verifyAdminStatus } from '@/lib/admin-auth';
import { AdminSidebar } from '@/components/admin-sidebar';

// FIX: Force dynamic rendering to prevent Next.js from caching the admin layout
// and inadvertently serving it to non-admin users.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Strict Server-Side Authorization Check
  const isAdmin = await verifyAdminStatus();

  // 2. Eject unauthorized users
  if (!isAdmin) {
    redirect('/dashboard');
  }

  // 3. Render Admin Interface for authorized users
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      {/* pt-14 on mobile offsets the fixed top bar; md:pt-0 removes it on desktop */}
      <div className="flex flex-1 flex-col overflow-hidden pt-14 md:pt-0">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}