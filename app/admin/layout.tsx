import { redirect } from 'next/navigation';
import { verifyAdminStatus } from '@/lib/admin-auth';
import { AdminSidebar } from '@/components/admin-sidebar';

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
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}