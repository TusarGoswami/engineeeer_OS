import { Outlet, Link, useLocation } from 'react-router-dom';
import { BongoCatCoder } from '../components/BongoCatCoder.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';

// ─── EngineerOS Wordmark ────────────────────────────────────────────────────
const EngineerOSLogo = ({ size = 'md' }) => {
  const isLg = size === 'lg';
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group select-none">
      <div
        className={`flex items-center justify-center rounded-[10px] bg-orange-500 font-bold text-white shadow-md shadow-orange-500/20 transition-all duration-200 group-hover:bg-orange-600 ${
          isLg ? 'h-9 w-9 text-sm' : 'h-7 w-7 text-xs'
        }`}
      >
        OS
      </div>
      <span
        className={`font-bold tracking-tight text-surface-100 ${
          isLg ? 'text-xl' : 'text-base'
        }`}
      >
        Engineer<span className="text-orange-500">OS</span>
      </span>
    </Link>
  );
};

// ─── Two-column Auth Layout (Login / Register pages) ────────────────────────
const AuthLayout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-surface-950 text-surface-100 selection:bg-orange-500 selection:text-white">
      {/* ── LEFT PANEL: Branding & Animated Bongo Cat Coder ───────── */}
      <div className="relative hidden w-[45%] flex-col justify-between border-r border-surface-700/80 bg-surface-900 md:flex lg:w-[48%] xl:w-[50%] min-h-screen">
        {/* Subtle technical background grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Ambient warm glow in lower portion for mascot */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[450px] pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 65%, rgba(255, 101, 0, 0.12) 0%, rgba(255, 101, 0, 0.03) 45%, transparent 70%)',
          }}
        />

        {/* Top Hero Section (Branding, Headline, Feature Badges) - shrink-0 to maintain clean hierarchy */}
        <div className="relative z-10 shrink-0 px-6 pt-7 md:px-8 lg:px-10 lg:pt-8 xl:px-12">
          {/* Top-left EngineerOS logo */}
          <div className="mb-4 lg:mb-5">
            <EngineerOSLogo size="md" />
          </div>

          {/* Eyebrow */}
          <div className="mb-2.5 inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-500">
              Developer Productivity Platform
            </p>
          </div>

          {/* Headline */}
          <h1 className="text-[1.75rem] font-bold leading-[1.15] tracking-tight text-surface-100 lg:text-[2.15rem] xl:text-[2.5rem]">
            Learn, Build, and{' '}
            <span className="text-orange-500">Grow</span>
            <br />
            with EngineerOS
          </h1>

          {/* Supporting copy */}
          <p className="mt-2 max-w-sm text-[12.5px] lg:text-[13.5px] leading-relaxed text-surface-400">
            One workspace for your engineering journey.
          </p>

          {/* Feature badges with translucent styling */}
          <div className="mt-4 flex flex-wrap gap-1.5 lg:gap-2">
            {['Academics', 'Coding', 'GATE Prep', 'AI Assistant', 'Mock Interviews'].map(
              (item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-surface-700 bg-surface-850/80 px-2.5 py-0.5 text-[10.5px] lg:px-3 lg:py-1 lg:text-[11px] font-medium text-surface-400 backdrop-blur-sm transition-all duration-150 hover:border-orange-500/40 hover:text-surface-100 hover:bg-surface-800"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  {item}
                </span>
              )
            )}
          </div>
        </div>

        {/* Animated Bongo Cat Coder Mascot Container */}
        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 py-3 md:px-6 lg:px-8 lg:py-5">
          <div className="relative flex h-full w-full max-h-[390px] max-w-[540px] items-center justify-center">
            <BongoCatCoder />
          </div>
        </div>

        {/* Subtle bottom brand bar */}
        <div className="relative z-10 shrink-0 border-t border-surface-700/50 px-6 py-3 md:px-8 lg:px-10">
          <p className="text-[10.5px] lg:text-[11px] text-surface-500">
            © {new Date().getFullYear()} EngineerOS — The Complete Operating System for Engineering Students
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: Auth ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-surface-950 min-w-0 overflow-y-auto">
        {/* Top navigation */}
        <header className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5 border-b border-surface-700/50">
          {/* Mobile logo — visible on small screens */}
          <div className="md:hidden">
            <EngineerOSLogo size="sm" />
          </div>
          {/* Desktop spacer to keep nav right-aligned */}
          <div className="hidden md:block" />

          {/* Navigation actions with Theme Toggle */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle size="sm" />
            <Link
              to="/login"
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-150 rounded-[8px] ${
                isLoginPage
                  ? 'text-surface-100 bg-surface-850 border border-surface-700'
                  : 'text-surface-400 hover:text-surface-100'
              }`}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-[8px] transition-all duration-150 shadow-sm ${
                !isLoginPage
                  ? 'bg-orange-500 text-white hover:bg-[#E65300]'
                  : 'bg-orange-500 text-white hover:bg-[#E65300] active:scale-[0.98]'
              }`}
            >
              Create Account
            </Link>
          </nav>
        </header>

        {/* Auth form area */}
        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
          <div className="w-full flex flex-col items-center">
            {/* Mobile-only compact headline */}
            <div className="md:hidden mb-5 text-center px-4">
              <h1 className="text-xl font-bold tracking-tight text-surface-100">
                Learn, Build, and <span className="text-orange-500">Grow</span>
              </h1>
              <p className="mt-1 text-xs text-surface-400">
                One workspace for your engineering journey.
              </p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// ─── Standard Public Layout (fallback for non-auth public pages) ─────────────
const StandardLayout = () => (
  <div className="min-h-screen bg-surface-950 text-surface-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
    <header className="px-6 py-4 flex items-center justify-between border-b border-surface-700/80 bg-surface-900/80 backdrop-blur-md">
      <EngineerOSLogo size="md" />
      <div className="flex items-center gap-4 text-xs font-medium text-surface-400">
        <ThemeToggle size="sm" />
        <Link to="/login" className="hover:text-surface-100 transition-colors">
          Sign In
        </Link>
        <Link
          to="/register"
          className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition-all shadow-md shadow-orange-500/20"
        >
          Create Account
        </Link>
      </div>
    </header>
    <main className="flex-1 flex items-center justify-center p-6">
      <Outlet />
    </main>
    <footer className="py-4 text-center text-xs text-surface-400 border-t border-surface-700/80">
      EngineerOS — The Complete Operating System for an Engineering Student
    </footer>
  </div>
);

// ─── Public Layout Router ─────────────────────────────────────────────────────
export const PublicLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return (
      <AuthLayout>
        <Outlet />
      </AuthLayout>
    );
  }

  return <StandardLayout />;
};

export default PublicLayout;
