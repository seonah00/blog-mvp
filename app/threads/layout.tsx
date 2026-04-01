/**
 * Threads Layout
 * - Dashboard shell wrapper for all threads routes
 */

import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function ThreadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
