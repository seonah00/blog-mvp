/**
 * Karrot Layout
 * - Dashboard shell wrapper for all karrot routes
 */

import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function KarrotLayout({
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
