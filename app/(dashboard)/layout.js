'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { getNavItems, getBottomNavItems, hasPermission } from '@/lib/rbac';
import {
  LayoutDashboard, Users, HandCoins, Landmark, BarChart3,
  Settings, Menu, X, LogOut, ChevronDown, ChevronRight, MoreHorizontal,
} from 'lucide-react';

const iconMap = {
  LayoutDashboard, Users, HandCoins, Landmark, BarChart3, Settings,
};

export default function DashboardLayout({ children }) {
  const { user, restoreSession, logout } = useAuth();
  const { toast } = useData();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState({});
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      const saved = localStorage.getItem('bm_user');
      if (!saved) {
        router.replace('/login');
      }
    }
  }, [user, router]);

  useEffect(() => {
    setSidebarOpen(false);
    setMoreMenuOpen(false);
  }, [pathname]);

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: 'var(--bg-root)' }}>
        <div className="spinner" style={{ width: 32, height: 32 }}></div>
      </div>
    );
  }

  const navItems = getNavItems(user);
  const bottomNav = getBottomNavItems(user);

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const toggleNavExpand = (key) => {
    setExpandedNav(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleNavigate = (href) => {
    router.push(href);
  };

  return (
    <div className="app-layout">
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div className="sidebar-overlay visible" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <Landmark size={22} color="var(--primary)" />
          </div>
          <div className="sidebar-brand-text">
            <h2>Baitul Maal</h2>
            <span>Ponpes Ar-Rosyad</span>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            style={{ marginLeft: 'auto', display: 'none' }}
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.section} className="sidebar-section">
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map((item) => {
                const Icon = iconMap[item.icon];
                const active = isActive(item.href);
                const hasChildren = item.children && item.children.length > 0;
                const expanded = expandedNav[item.key];

                return (
                  <div key={item.key}>
                    <button
                      className={`sidebar-link ${active ? 'active' : ''}`}
                      onClick={() => {
                        if (hasChildren) {
                          toggleNavExpand(item.key);
                        } else {
                          handleNavigate(item.href);
                        }
                      }}
                      style={{ width: '100%', border: 'none', background: active ? 'var(--primary-bg)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}
                    >
                      {Icon && <Icon size={20} />}
                      <span>{item.label}</span>
                      {hasChildren && (
                        <span style={{ marginLeft: 'auto' }}>
                          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                      )}
                    </button>
                    {hasChildren && expanded && (
                      <div style={{ paddingLeft: 36 }}>
                        {item.children
                          .filter(child => hasPermission(user, child.permission))
                          .map((child) => (
                            <button
                              key={child.href}
                              className={`sidebar-link ${pathname === child.href ? 'active' : ''}`}
                              onClick={() => handleNavigate(child.href)}
                              style={{ width: '100%', border: 'none', background: pathname === child.href ? 'var(--primary-bg)' : 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.8125rem' }}
                            >
                              <span>{child.label}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user.avatar}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.roleLabel}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Keluar">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="top-header">
        <div className="top-header-brand">
          <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="top-header-brand-logo">
            <Landmark size={18} color="var(--primary)" />
          </div>
          <h1>Baitul Maal</h1>
        </div>
        <div className="top-header-actions">
          <div className="sidebar-user-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
            {user.avatar}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>


      {/* Toast */}
      {toast && (
        <div className={`toast show toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
