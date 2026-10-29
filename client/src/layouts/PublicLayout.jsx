import { Outlet, Link } from 'react-router-dom';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Public Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-surface-800/60 bg-surface-950/40 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 font-bold text-white text-xs shadow-md shadow-brand-600/30">
            OS
          </div>
          <span className="font-bold text-white text-base tracking-tight">EngineerOS</span>
        </Link>
        <div className="flex items-center gap-4 text-xs font-medium text-surface-400">
          <Link to="/login" className="hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-all shadow-md shadow-brand-600/25"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-surface-400 border-t border-surface-900">
        EngineerOS — The Complete Operating System for an Engineering Student
      </footer>
    </div>
  );
};

export default PublicLayout;
