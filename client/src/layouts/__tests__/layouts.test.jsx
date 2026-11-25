import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext.jsx';
import { DashboardLayout } from '../DashboardLayout.jsx';
import { PublicLayout } from '../PublicLayout.jsx';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { notificationService } from '../../services/notification.service.js';

vi.mock('../../features/auth/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/notification.service.js', () => ({
  notificationService: {
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

describe('Application Shell Layouts (Phase 1 Foundation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    notificationService.getNotifications.mockResolvedValue({
      data: {
        notifications: [
          {
            _id: 'n-1',
            title: 'Mock Assessment Ready',
            message: 'Data Structures evaluation window is open.',
            link: '/assessments',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
      },
    });
    notificationService.markAllAsRead.mockResolvedValue({});
  });

  it('renders DashboardLayout navigation, role visibility, command palette, notifications, and theme toggle', async () => {
    const logoutMock = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({
      user: { name: 'Alex Johnson', role: 'student', university: 'MIT', semester: 5 },
      logout: logoutMock,
    });

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<div>Dashboard Child Route</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    // Core navigation destinations present; Admin Console hidden for students
    expect(screen.getAllByText('Academic Hub').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Coding Platform').length).toBeGreaterThan(0);
    expect(screen.getAllByText('GATE Hub').length).toBeGreaterThan(0);
    expect(screen.queryByText('Admin Console')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard Child Route')).toBeInTheDocument();
    expect(screen.getByText(/MIT · Sem 5/i)).toBeInTheDocument();

    // Wait for initial notifications fetch to settle inside act
    await waitFor(() => {
      expect(notificationService.getNotifications).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('1')).toBeInTheDocument();

    // Ctrl+K opens Command Palette and hides admin route for student role
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByPlaceholderText(/Type a command or jump to a module/i)).toBeInTheDocument();
    expect(screen.queryByText('Admin & Faculty Studio')).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });

    // Notifications popover renders and marks read
    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
    expect(screen.getByText('Mock Assessment Ready')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Mark all read/i }));
    await waitFor(() => {
      expect(notificationService.markAllAsRead).toHaveBeenCalledTimes(1);
    });

    // Theme switching works inside shell header
    fireEvent.click(screen.getByRole('button', { name: /switch to dark theme/i }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('shows Admin Console in DashboardLayout when user is platformAdmin', async () => {
    useAuth.mockReturnValue({
      user: { name: 'Admin User', role: 'platformAdmin' },
      logout: vi.fn(),
    });

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<div>Home</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByText('Admin Console')).toBeInTheDocument();
    expect(await screen.findByText('1')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByText('Admin & Faculty Studio')).toBeInTheDocument();
  });

  it('renders PublicLayout AuthLayout split view on /login', () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<div>Login Form Slot</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getAllByText(/Developer Productivity Platform/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Login Form Slot')).toBeInTheDocument();
  });
});

