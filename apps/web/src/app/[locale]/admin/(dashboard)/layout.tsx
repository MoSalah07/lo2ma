import type { ReactNode } from 'react';
import { AdminGuard } from '@/features/admin/admin-guard';
import { AdminSidebar } from '@/features/admin/admin-sidebar';

/** The desktop dashboard: the menu beside the content (on top of it on narrow screens). */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="mx-auto flex w-full max-w-admin flex-col items-start gap-gutter p-gutter md:p-gutter-md lg:flex-row">
        <AdminSidebar />
        <main className="flex w-full min-w-0 flex-1 flex-col gap-gutter">{children}</main>
      </div>
    </AdminGuard>
  );
}
