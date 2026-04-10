import React from 'react';
import Sidebar from './Sidebar';
import TrustBadge from './TrustBadge';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#04020f]">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-30 h-16 border-b border-white/[0.06] bg-[#04020f]/80 backdrop-blur-xl flex items-center justify-between px-8">
          <div />
          <TrustBadge />
        </div>

        {/* Page content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
