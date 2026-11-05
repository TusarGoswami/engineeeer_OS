import { useState, forwardRef, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext.jsx';

// ─── Validation schema (100% UNTOUCHED) ───────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Accessible AuthInput with Ref Forwarding & Id Pairing ───────────────────
const AuthInput = forwardRef(
  ({ label, error, leftIcon: LeftIcon, rightIcon: RightIcon, id, className = '', ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || props.name || generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {LeftIcon && (
            <div className="pointer-events-none absolute left-3.5 text-zinc-500">
              <LeftIcon className="h-4 w-4" />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={[
              'w-full rounded-[9px] border bg-[#0D1015] px-3.5 py-2.5 text-sm text-zinc-100',
              'placeholder-zinc-600 transition-all duration-200 outline-none',
              'focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              LeftIcon ? 'pl-10' : '',
              RightIcon ? 'pr-10' : '',
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/40'
                : 'border-[#292E38]',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />
          {RightIcon && (
            <div className="absolute right-3.5 flex items-center">{RightIcon}</div>
          )}
        </div>
        {error && (
          <p className="text-[12px] font-medium text-rose-400">{error}</p>
        )}
      </div>
    );
  }
);
AuthInput.displayName = 'AuthInput';

// ─── Login Page ───────────────────────────────────────────────────────────────
export const LoginPage = () => {
  // ── All original functional hooks — UNTOUCHED ──────────────────────────────
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // ── Original handlers — UNTOUCHED ─────────────────────────────────────────
  const fillDemoAccount = (email, pass) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(
        err.response?.data?.error?.message || 'Login failed. Please check your credentials.'
      );
    }
  };

  // ── Password register binding ──────────────────────────────────────────────
  const { ref: passwordRef, ...passwordRest } = register('password');

  return (
    <div className="relative w-full max-w-[430px]">
      {/* Subtle ambient accent illumination behind login card */}
      <div
        className="absolute -inset-1 rounded-[20px] pointer-events-none -z-10 opacity-70 blur-md transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(255, 101, 0, 0.08) 0%, transparent 75%)',
        }}
      />

      {/* ── Login Card (Specifications: max-w 430px, #151922, border #292E38, radius 16px) ── */}
      <div className="rounded-[16px] border border-[#292E38] bg-[#151922] px-7 py-8 shadow-2xl shadow-black/60 sm:px-8 sm:py-8">
        {/* Card heading */}
        <div className="mb-7">
          <h2 className="text-[22px] font-bold tracking-tight text-[#F4F4F5]">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1AA]">
            Enter your credentials to access your engineering workspace.
          </p>
        </div>

        {/* Server error banner — original error state logic preserved */}
        {serverError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-sm text-rose-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="leading-snug">{serverError}</span>
          </div>
        )}

        {/* ── Form — original onSubmit handler preserved ───────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email Address with connected label/id */}
          <AuthInput
            id="email"
            label="Email Address"
            type="email"
            placeholder="student@university.edu"
            leftIcon={Mail}
            error={errors.email?.message}
            {...register('email')}
          />

          {/* Password with connected label/id and visibility toggle */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[13px] font-medium text-zinc-300">
              Password
            </label>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-3.5 text-zinc-500">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={[
                  'w-full rounded-[9px] border bg-[#0D1015] px-3.5 py-2.5 pl-10 pr-10 text-sm text-zinc-100',
                  'placeholder-zinc-600 transition-all duration-200 outline-none',
                  'focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  errors.password
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/40'
                    : 'border-[#292E38]',
                ]
                  .filter(Boolean)
                  .join(' ')}
                ref={passwordRef}
                {...passwordRest}
              />
              {/* Password visibility toggle */}
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 text-zinc-500 transition-colors duration-150 hover:text-zinc-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-orange-500"
                aria-label={showPassword ? 'Hide text' : 'Show text'}
                tabIndex={0}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-[12px] font-medium text-rose-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Sign In submit button — original submit type and loading state */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#FF6500] py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#E65300] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in…</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* ── Quick Demo Logins — all handlers and credentials untouched ── */}
        <div className="mt-6 border-t border-[#292E38] pt-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#71717A]">
            Quick Demo Logins
          </p>
          <div className="grid grid-cols-3 gap-2">
            {/* Student — original onClick handler preserved */}
            <button
              type="button"
              onClick={() => fillDemoAccount('student@engineeros.dev', 'Password123')}
              className="rounded-[8px] border border-[#292E38] bg-[#1A1E26] px-2 py-2 text-[12px] font-medium text-zinc-300 transition-all duration-150 hover:border-zinc-500 hover:bg-[#222733] hover:text-white active:scale-[0.98]"
            >
              Student
            </button>

            {/* Senior / Alumni — original onClick handler preserved */}
            <button
              type="button"
              onClick={() => fillDemoAccount('senior@engineeros.dev', 'Password123')}
              className="rounded-[8px] border border-[#292E38] bg-[#1A1E26] px-2 py-2 text-[12px] font-medium text-zinc-300 transition-all duration-150 hover:border-zinc-500 hover:bg-[#222733] hover:text-white active:scale-[0.98]"
            >
              Senior
            </button>

            {/* Admin — original onClick handler preserved */}
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@engineeros.dev', 'Password123')}
              className="rounded-[8px] border border-[#292E38] bg-[#1A1E26] px-2 py-2 text-[12px] font-medium text-zinc-300 transition-all duration-150 hover:border-zinc-500 hover:bg-[#222733] hover:text-white active:scale-[0.98]"
            >
              Admin
            </button>
          </div>

          {/* Seed hint — only shown on server error, original logic preserved */}
          {serverError && (
            <p className="mt-3 rounded-lg border border-[#292E38] bg-[#0D1015] p-2.5 text-[11px] text-zinc-400">
              💡{' '}
              <span className="font-semibold text-zinc-300">New machine or fresh clone?</span>{' '}
              Run{' '}
              <code className="font-mono text-orange-500">npm run seed</code> in the terminal to
              load demo accounts.
            </p>
          )}
        </div>

        {/* ── Footer — original Link destination preserved ──────────────── */}
        <p className="mt-6 text-center text-[13px] text-[#71717A]">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-orange-500 transition-colors duration-150 hover:text-orange-400"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
