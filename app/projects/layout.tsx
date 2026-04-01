/**
 * Projects Layout
 * - Dashboard shell wrapper for all projects routes
 */

import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function ProjectsLayout({
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
