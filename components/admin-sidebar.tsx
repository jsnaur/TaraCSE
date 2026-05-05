"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, ReceiptText, Users, FileQuestion, ArrowLeft, ScrollText, BrainCircuit, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const adminNavItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/verifications', label: 'Verifications', icon: ReceiptText },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/questions', label: 'Question Bank', icon: FileQuestion },
  { href: '/admin/knowledge', label: 'Knowledge Base', icon: BrainCircuit },
  { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to App
        </Link>
      </div>
    </>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="w-64 flex-shrink-0 border-r bg-white dark:bg-gray-950 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <h2 className="text-lg font-bold tracking-tight">TaraCSE Admin</h2>
        </div>
        <NavLinks pathname={pathname} />
      </aside>

      {/* Mobile top bar — fixed, hidden on md+ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-white dark:bg-gray-950 border-b shadow-sm">
        <h2 className="text-base font-bold tracking-tight">TaraCSE Admin</h2>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile slide-in drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col bg-white dark:bg-gray-950">
          <div className="h-14 flex items-center justify-between px-6 border-b flex-shrink-0">
            <h2 className="text-base font-bold tracking-tight">TaraCSE Admin</h2>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
