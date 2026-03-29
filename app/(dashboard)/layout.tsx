/**
 * Main Dashboard Layout - HubSpot Enterprise Style
 * 
 * Layout Structure:
 * - Dark Sidebar (64px compact or 256px expanded)
 * - Dark Topbar (page title + search + utilities)
 * - Light Content Canvas (workspace area)
 */

import { SideNav } from "@/components/layout/side-nav";
import { TopAppBar } from "@/components/layout/top-app-bar";

export default function DashboardLayout({
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
