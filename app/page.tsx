/**
 * Root Page - HubSpot Enterprise Style
 */

import { SideNav } from "@/components/layout/side-nav";
import { TopAppBar } from "@/components/layout/top-app-bar";
import DashboardPage from "./(dashboard)/page";

export default function HomePage() {
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
            <DashboardPage />
          </div>
        </main>
      </div>
    </div>
  );
}
