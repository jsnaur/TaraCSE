// app/admin/layout.tsx
import { redirect } from 'next/navigation';
import { verifyAdminStatus } from '@/lib/admin-auth';

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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* You will place your future AdminSidebar component here.
        For now, we render the children.
      */}
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}