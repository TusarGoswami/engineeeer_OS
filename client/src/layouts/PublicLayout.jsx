import { Outlet, Link, useLocation } from 'react-router-dom';
import { BongoCatCoder } from '../components/BongoCatCoder.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { BrandLogo } from '../components/BrandLogo.jsx';

/**
 * Shared brand wordmark linking to application root.
 */
const EngineerOSLogo = ({ size = 'md' }) => (
  <BrandLogo to="/" size={size} />
);

/**
 * Two-column authentication layout with BongoCatCoder showcase and semantic light/dark surfaces.
 */
const AuthLayout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-canvas text-surface-100 selection:bg-brand-500 selection:text-white">
      {/* Left Hero Panel */}
      <div className="relative hidden w-[45%] flex-col justify-between border-r border-surface-700 bg-sidebar md:flex lg:w-[48%] xl:w-[50%] min-h-screen">
        {/* Subtle technical dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Restrained ambient spotlight behind mascot */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[420px] pointer-events-none opacity-40 dark:opacity-80"
          style={{
            background:
              'radial-gradient(circle at 50% 65%, rgba(239, 107, 34, 0.10) 0%, rgba(239, 107, 34, 0.02) 45%, transparent 70%)',
          }}
        />

        {/* Top Copy */}
        <div className="relative z-10 shrink-0 px-6 pt-7 md:px-8 lg:px-10 lg:pt-8 xl:px-12">
          <div className="mb-5">
            <EngineerOSLogo size="md" />
          </div>

          <div className="mb-2.5 inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            <p className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
              Developer Productivity Platform
            </p>
          </div>

          <h1 className="font-display text-[1.75rem] font-bold leading-[1.15] tracking-tight text-surface-100 lg:text-[2.15rem] xl:text-[2.45rem]">
            Learn, Build, and{' '}
            <span className="text-brand-500">Grow</span>
            <br />
            with EngineerOS
          </h1>

          <p className="mt-2.5 max-w-sm text-[13px] lg:text-sm leading-relaxed text-surface-400">
            One unified engineering workspace for DSA practice, academics, GATE prep, and mock interviews.
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5 lg:gap-2">
            {['Academics', 'Coding', 'GATE Prep', 'AI Assistant', 'Mock Interviews'].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-md border border-surface-700 bg-elevated/80 px-2.5 py-1 text-[11px] font-medium text-surface-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Mascot Showcase */}
        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 py-3 md:px-6 lg:px-8 lg:py-5">
          <div className="relative flex h-full w-full max-h-[390px] max-w-[540px] items-center justify-center">
            <BongoCatCoder />
          </div>
        </div>

        {/* Footer Bar */}
        <div className="relative z-10 shrink-0 border-t border-surface-700 px-6 py-3 md:px-8 lg:px-10">
          <p className="font-mono text-[11px] text-surface-400">
            © {new Date().getFullYear()} EngineerOS — Operating System for Engineering Students
          </p>
        </div>
      </div>

      {/* Right Authentication Form Area */}
      <div className="flex flex-1 flex-col bg-canvas min-w-0 overflow-y-auto">
        <header className="flex items-center justify-between px-5 py-3.5 sm:px-8 border-b border-surface-700 bg-navbar/95 backdrop-blur-sm">
          <div className="md:hidden">
            <EngineerOSLogo size="sm" />
          </div>
          <div className="hidden md:block" />

          <nav className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle size="sm" />
            <Link
              to="/login"
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-150 rounded-lg ${
                isLoginPage
                  ? 'text-surface-100 bg-elevated border border-surface-700'
                  : 'text-surface-400 hover:text-surface-100'
              }`}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 bg-brand-500 text-white hover:bg-brand-600 shadow-xs"
            >
              Create Account
            </Link>
          </nav>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
          <div className="w-full flex flex-col items-center">
            <div className="md:hidden mb-5 text-center px-4">
              <h1 className="font-display text-xl font-bold tracking-tight text-surface-100">
                Learn, Build, and <span className="text-brand-500">Grow</span>
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

/**
 * Minimal layout wrapper for non-auth public routes such as /auth/callback.
 */
const StandardLayout = () => (
  <div className="min-h-screen bg-canvas text-surface-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
    <header className="px-6 py-3.5 flex items-center justify-between border-b border-surface-700 bg-navbar/95 backdrop-blur-sm">
      <EngineerOSLogo size="md" />
      <div className="flex items-center gap-3 text-xs font-medium text-surface-300">
        <ThemeToggle size="sm" />
        <Link to="/login" className="hover:text-surface-100 transition-colors">
          Sign In
        </Link>
        <Link
          to="/register"
          className="px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold transition-colors shadow-xs"
        >
          Create Account
        </Link>
      </div>
    </header>
    <main className="flex-1 flex items-center justify-center p-6">
      <Outlet />
    </main>
    <footer className="py-4 text-center font-mono text-xs text-surface-400 border-t border-surface-700">
      EngineerOS — The Complete Operating System for an Engineering Student
    </footer>
  </div>
);

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
