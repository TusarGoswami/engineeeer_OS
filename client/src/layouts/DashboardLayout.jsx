import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
import { CommandPalette } from '../components/CommandPalette.jsx';
import { notificationService } from '../services/notification.service.js';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
        // Fallback default notifications if offline
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
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = async notif => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif._id);
        setNotifications(prev => prev.map(n => (n._id === notif._id ? { ...n, isRead: true } : n)));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {
        // Ignore
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

  const renderNavLinks = () => (
    <div className="space-y-1">
      {navItems.map(item => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                'group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand-600/15 text-brand-300 font-semibold border border-brand-500/20 shadow-sm shadow-brand-500/5'
                  : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800/60'
              )
            }
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>{item.name}</span>
            </div>
            {item.badge ? (
              <Badge variant="purple" size="sm">
                {item.badge}
              </Badge>
            ) : (
              <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-surface-500" />
            )}
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-surface-950 text-surface-100 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 border-r border-surface-800/80 bg-surface-900/40 backdrop-blur-2xl z-30">
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-surface-800/80">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 font-bold text-white shadow-md shadow-brand-600/30 text-sm">
            OS
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-tight">EngineerOS</span>
            <span className="block text-[10px] text-surface-400 -mt-1 font-mono uppercase tracking-wider">
              Student Edition
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">{renderNavLinks()}</div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-surface-800/80 bg-surface-950/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-800 border border-surface-700 text-brand-400 font-bold text-xs uppercase">
                {user?.name?.slice(0, 2) || 'ST'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-surface-400 truncate capitalize">
                  {user?.role} {user?.isAlumni ? '• Alumni' : ''}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-surface-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-surface-950/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-surface-900 border-r border-surface-800 p-5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-surface-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 font-bold text-white text-xs">
                  OS
                </div>
                <span className="font-bold text-white">EngineerOS</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-800"
              >
                <X className="w-5 h-5 text-surface-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderNavLinks()}</div>
            <div className="pt-4 border-t border-surface-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 bg-rose-500/10 rounded-xl"
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
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between px-6 border-b border-surface-800/80 bg-surface-950/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-medium text-surface-400 hidden sm:inline">
              {user?.university
                ? `${user.university} • Sem ${user.semester || 1}`
                : 'Unified Engineering Workspace'}
            </span>
          </div>

          {/* Center Search / Command Palette Trigger */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-900 border border-surface-800 text-surface-400 hover:text-surface-200 text-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Search platform or press</span>
            <kbd className="font-mono text-[10px] bg-surface-800 text-surface-300 px-1.5 py-0.5 rounded border border-surface-700">
              Ctrl K
            </kbd>
          </button>

          <div className="flex items-center gap-3">
            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white ring-2 ring-surface-950">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface-900 border border-surface-800 shadow-2xl z-50 overflow-hidden animate-fadeIn">
                  <div className="flex items-center justify-between p-4 border-b border-surface-800 bg-surface-950/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded-full font-semibold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-[11px] text-surface-400 hover:text-brand-400"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-surface-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-surface-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 hover:bg-surface-800/50 cursor-pointer transition-colors ${
                            !n.isRead ? 'bg-brand-500/5' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`text-xs font-semibold ${
                                !n.isRead ? 'text-white' : 'text-surface-300'
                              }`}
                            >
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-brand-400 mt-1 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-surface-400 mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-surface-500 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {user?.role && (
              <Badge
                variant={user.role === 'student' ? 'brand' : 'purple'}
                size="sm"
                className="capitalize"
              >
                {user.role}
              </Badge>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 sm:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-950/95 backdrop-blur-xl border-t border-surface-800/80 px-2 py-1.5 flex items-center justify-around">
          {[
            { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { name: 'Coding', path: '/coding', icon: Code2 },
            { name: 'GATE', path: '/gate', icon: BookOpen },
            { name: 'Academics', path: '/academics', icon: GraduationCap },
            { name: 'Profile', path: '/profile', icon: User },
          ].map(tab => {
            const TabIcon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-medium transition-colors',
                    isActive
                      ? 'text-brand-400 font-semibold'
                      : 'text-surface-400 hover:text-surface-200'
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
        />
      </div>
    </div>
  );
};

export default DashboardLayout;
