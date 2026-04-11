import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Shield, LayoutDashboard, FileText, Store, Settings, LogOut, Activity, ChevronLeft, Network
} from 'lucide-react';

const userLinks = [
  { to: '/dashboard', label: 'Privacy Dashboard', icon: LayoutDashboard },
  { to: '/audit', label: 'Audit Log', icon: FileText },
];

const merchantLinks = [
  { to: '/merchant', label: 'Merchant Dashboard', icon: Store },
];

const adminLinks = [
  { to: '/admin', label: 'Admin Monitor', icon: Activity },
  { to: '/admin/security', label: 'Security Center', icon: Shield },
  { to: '/admin/federated', label: 'Collaborative Intel', icon: Network },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const links = [
    ...userLinks,
    ...(user?.role === 'merchant' || user?.role === 'admin' ? merchantLinks : []),
    ...(user?.role === 'admin' ? adminLinks : []),
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#060214]/90 border-r border-white/[0.06] backdrop-blur-xl z-40 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.06]">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">SecureAI Pay</h1>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Identity Layer</p>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.03]'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="px-4 py-2 mb-2">
          <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{user?.brand || 'SecureAI Pay'}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
            <p className="text-[10px] text-violet-400 capitalize font-medium tracking-wider">{user?.role || 'user'}</p>
          </div>
          <p className="text-[9px] text-white/20 font-mono truncate mt-1.5 opacity-50">{user?.user_token_id}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
