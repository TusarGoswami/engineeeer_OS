import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Code2,
  BookOpen,
  Bot,
  ShieldCheck,
  Users,
  Video,
  User,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Check,
  Search,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { Badge } from '../components/Badge.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { CommandPalette } from '../components/CommandPalette.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { notificationService } from '../services/notification.service.js';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Primary authenticated application shell providing consistent sidebar, header, notifications, and mobile navigation.
 */
export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const notifContainerRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Global Ctrl+K / Cmd+K Command Palette listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close notifications popover on outside click or Escape key
  useEffect(() => {
    if (!isNotifOpen) return;
    const handlePointerDown = (e) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isNotifOpen]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const res = await notificationService.getNotifications();
        if (res && res.data) {
          setNotifications(res.data.notifications || []);
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch {
        setNotifications([
          {
            _id: 'n-os-exam',
            title: 'Midterm Assessment Open',
            message: 'Operating Systems & Concurrency Midterm is live.',
            link: '/assessments',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ]);
        setUnreadCount(1);
      }
    };
    fetchNotifs();
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif._id);
        setNotifications((prev) => prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Ignore transient network errors
      }
    }
    setIsNotifOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Academic Hub', path: '/academics', icon: GraduationCap },
    { name: 'Coding Platform', path: '/coding', icon: Code2 },
    { name: 'GATE Hub', path: '/gate', icon: BookOpen },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Bot },
    { name: 'Assessments', path: '/assessments', icon: ShieldCheck },
    { name: 'Community', path: '/community', icon: Users },
    { name: 'Mock Interviews', path: '/interviews', icon: Video },
    { name: 'Profile & Settings', path: '/profile', icon: User },
  ];

  if (user?.role === 'platformAdmin' || user?.role === 'contentAdmin') {
    navItems.push({
      name: 'Admin Console',
      path: '/admin',
      icon: ShieldAlert,
      badge: 'Admin',
    });
  }

  const renderNavLinks = () => {
    const mainNav = navItems.slice(0, 4);
    const toolsNav = navItems.slice(4, 8);
    const settingsNav = navItems.slice(8);

    const renderGroup = (items, label) => (
      <div className="space-y-1">
        {label && (
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-surface-400 px-3 pb-1 block">
            {label}
          </span>
        )}
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
                  isActive
                    ? 'bg-brand-500/10 text-brand-700 font-semibold border border-brand-500/20'
                    : 'text-surface-300 hover:text-surface-100 hover:bg-elevated border border-transparent'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-brand-500"
                    />
                  )}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? 'text-brand-500' : 'text-surface-400 group-hover:text-surface-200'
                      )}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge ? (
                    <Badge variant="purple" size="sm">
                      {item.badge}
                    </Badge>
                  ) : (
                    <ChevronRight
                      className={cn(
                        'w-3.5 h-3.5 shrink-0 transition-all text-surface-400',
                        isActive ? 'opacity-70 text-brand-500' : 'opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
                      )}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    );

    return (
      <div className="space-y-5">
        {renderGroup(mainNav, 'Main')}
        {renderGroup(toolsNav, 'Tools')}
        {settingsNav.length > 0 && renderGroup(settingsNav, 'Account')}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-canvas text-surface-100 font-sans bg-grid-cyber">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-3.5 focus:py-2 focus:rounded-lg focus:bg-brand-500 focus:text-white focus:text-xs focus:font-semibold focus:shadow-md"
      >
        Skip to main content
      </a>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 border-r border-surface-700 bg-sidebar z-30">
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-surface-700 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded-lg pr-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-display font-bold text-white text-xs shadow-xs group-hover:bg-brand-600 transition-colors">
              OS
            </div>
            <div className="leading-tight">
              <span className="font-display font-bold text-[15px] text-surface-100 tracking-tight block">
                Engineer<span className="text-brand-500">OS</span>
              </span>
              <span className="block text-[10px] text-surface-400 font-mono tracking-wide">
                ~/student-os
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Primary sidebar navigation" className="flex-1 overflow-y-auto px-3 py-4">
          {renderNavLinks()}
        </nav>

        {/* User Footer & Sign Out */}
        <div className="p-3 border-t border-surface-700 bg-card space-y-2 shrink-0">
          <Link
            to="/profile"
            className="flex items-center justify-between gap-2.5 p-2 rounded-lg hover:bg-elevated border border-transparent hover:border-surface-700 transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={user?.name || 'Student'} size="sm" fallbackClassName="!bg-brand-500/15 !text-brand-700 !ring-brand-500/25" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-surface-100 truncate">{user?.name || 'Engineer'}</p>
                <p className="text-[11px] text-surface-400 truncate capitalize font-mono">
                  {user?.role || 'student'}{user?.isAlumni ? ' · Alumni' : ''}
                </p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-surface-400 group-hover:text-surface-100 shrink-0" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-surface-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div
            className="fixed inset-0 bg-slate-950/50 dark:bg-black/65 backdrop-blur-[2px] animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-sidebar border-r border-surface-700 p-4 flex flex-col shadow-[var(--shadow-elevated)] animate-in slide-in-from-left">
            <div className="flex items-center justify-between pb-3.5 border-b border-surface-700 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 font-display font-bold text-white text-xs">
                  OS
                </div>
                <span className="font-display font-bold text-surface-100">
                  Engineer<span className="text-brand-500">OS</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ThemeToggle size="sm" />
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-elevated transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <nav aria-label="Mobile drawer navigation" className="flex-1 overflow-y-auto">
              {renderNavLinks()}
            </nav>
            <div className="pt-3 border-t border-surface-700 mt-3">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 px-4 sm:px-6 border-b border-surface-700 bg-navbar/95 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-surface-300 hover:text-surface-100 hover:bg-elevated transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-surface-400 min-w-0">
              <span className="w-2 h-2 rounded-full bg-compiler-500 shrink-0" aria-hidden="true" />
              <span className="font-mono truncate">
                {user?.university
                  ? `${user.university} · Sem ${user.semester || 1}`
                  : 'Unified Engineering Workspace'}
              </span>
            </div>
          </div>

          {/* Raycast-style Command Trigger */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2.5 h-8 px-2.5 sm:px-3 rounded-lg bg-elevated/75 hover:bg-elevated border border-surface-700 hover:border-surface-600 text-surface-400 hover:text-surface-100 text-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Search platform or jump...</span>
            <kbd className="font-mono text-[10px] bg-card text-surface-300 px-1.5 py-0.5 rounded border border-surface-700 shrink-0">
              Ctrl K
            </kbd>
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <ThemeToggle size="md" />

            {/* Notification Center */}
            <div className="relative" ref={notifContainerRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                aria-expanded={isNotifOpen}
                aria-label="Notifications"
                title="Notifications"
                className="relative p-2 rounded-lg text-surface-300 hover:text-surface-100 hover:bg-elevated transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-brand-500 text-[10px] font-mono font-bold text-white ring-2 ring-navbar">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] rounded-xl bg-card border border-surface-700 shadow-[var(--shadow-elevated)] z-50 overflow-hidden animate-in zoom-in-95">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700 bg-elevated/50">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xs font-bold text-surface-100">Notifications</span>
                      {unreadCount > 0 && (
                        <Badge variant="brand" size="sm">
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-[11px] font-medium text-surface-400 hover:text-brand-700 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-surface-700">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-surface-400">
                        All caught up. No notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n._id}
                          type="button"
                          onClick={() => handleNotificationClick(n)}
                          className={cn(
                            'w-full text-left p-3.5 hover:bg-elevated/60 cursor-pointer transition-colors block',
                            !n.isRead && 'bg-brand-500/5'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={cn(
                                'text-xs font-semibold',
                                !n.isRead ? 'text-surface-100' : 'text-surface-300'
                              )}
                            >
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-brand-500 mt-1 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-surface-400 mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="font-mono text-[10px] text-surface-500 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {user?.role && (
              <Link
                to="/profile"
                className="hidden sm:inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded-md"
                title="Open profile & card"
              >
                <Badge
                  variant={user.role === 'student' ? 'brand' : 'purple'}
                  size="sm"
                  className="capitalize hover:opacity-85 transition-opacity"
                >
                  {user.role}
                </Badge>
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 py-6 sm:px-8 sm:py-7 pb-20 lg:pb-8 max-w-7xl mx-auto w-full min-w-0 focus:outline-none"
        >
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav
          aria-label="Mobile quick navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-navbar/95 backdrop-blur-sm border-t border-surface-700 px-2 py-1.5 flex items-center justify-around"
        >
          {[
            { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { name: 'Coding', path: '/coding', icon: Code2 },
            { name: 'GATE', path: '/gate', icon: BookOpen },
            { name: 'Academics', path: '/academics', icon: GraduationCap },
            { name: 'Profile', path: '/profile', icon: User },
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center px-2 py-1 rounded-lg text-[10px] font-medium transition-colors',
                    isActive ? 'text-brand-700 font-semibold' : 'text-surface-400 hover:text-surface-100'
                  )
                }
              >
                <TabIcon className="w-4 h-4 mb-0.5" />
                <span>{tab.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Global Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          userRole={user?.role}
        />
      </div>
    </div>
  );
};

export default DashboardLayout;
