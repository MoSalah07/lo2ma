import type { ReactNode } from 'react';
import { AdminGuard } from '@/features/admin/admin-guard';
import { AdminSidebar } from '@/features/admin/admin-sidebar';

/** The desktop dashboard: the menu beside the content (on top of it on narrow screens). */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="mx-auto flex w-full max-w-360 flex-col items-start gap-6 p-4 sm:p-6 lg:flex-row">
        <AdminSidebar />
        <main className="flex w-full min-w-0 flex-1 flex-col gap-5">{children}</main>
      </div>
    </AdminGuard>
  );
}
