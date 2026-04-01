/**
 * Dashboard Layout - Shared Component
 * 
 * HubSpot Enterprise Style Dashboard Shell
 * - Dark Sidebar (256px fixed)
 * - Dark Topbar
 * - Light Content Canvas
 * 
 * Usage:
 * ```tsx
 * import { DashboardLayout } from "@/components/layout/dashboard-layout";
 * 
 * export default function Page() {
 *   return (
 *     <DashboardLayout>
 *       <YourContent />
 *     </DashboardLayout>
 *   );
 * }
 * ```
 */

import { SideNav } from "@/components/layout/side-nav";
import { TopAppBar } from "@/components/layout/top-app-bar";

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="flex min-h-screen"
      style={{ backgroundColor: 'var(--workspace-secondary)' }}
    >
      {/* Side Navigation - Dark Shell */}
      <SideNav />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top App Bar - Dark Header */}
        <TopAppBar />
        
        {/* Page Content - Light Canvas */}
        <main 
          className="flex-1 p-6 overflow-auto"
          style={{ backgroundColor: 'var(--workspace-secondary)' }}
        >
          <div 
            className="min-h-[calc(100vh-5.5rem)] rounded-lg"
            style={{ 
              backgroundColor: 'var(--workspace)',
              border: '1px solid var(--border-primary)'
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
