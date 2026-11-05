import { useState, forwardRef, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  GraduationCap,
  BookOpen,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from './AuthContext.jsx';

// ─── Validation schema (100% UNTOUCHED) ───────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['student', 'senior']).default('student'),
  university: z.string().min(2, 'University is required'),
  branch: z.string().min(2, 'Branch/Major is required'),
  semester: z.coerce.number().min(1).max(8).default(1),
});

// ─── Accessible AuthInput (Identical to LoginPage) ───────────────────────────
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

// ─── Accessible AuthSelect (Custom Styled for Dark Architecture) ──────────────
const AuthSelect = forwardRef(
  ({ label, error, children, id, className = '', ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || props.name || generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-[13px] font-medium text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={[
              'w-full appearance-none rounded-[9px] border bg-[#0D1015] px-3.5 py-2.5 pr-9 text-sm text-zinc-100',
              'transition-all duration-200 outline-none cursor-pointer',
              'focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/40'
                : 'border-[#292E38]',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute right-3 text-zinc-500">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && (
          <p className="text-[12px] font-medium text-rose-400">{error}</p>
        )}
      </div>
    );
  }
);
AuthSelect.displayName = 'AuthSelect';

// ─── Register Page Component ──────────────────────────────────────────────────
export const RegisterPage = () => {
  // ── All original functional hooks — UNTOUCHED ──────────────────────────────
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      role: 'student',
      university: '',
      branch: 'Computer Science',
      semester: 1,
    },
  });

  // ── Original submission handler — UNTOUCHED ────────────────────────────────
  const onSubmit = async (values) => {
    setServerError('');
    try {
      await registerAuth(values);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(
        err.response?.data?.error?.message || 'Registration failed. Please try again.'
      );
    }
  };

  // ── Password register binding ──────────────────────────────────────────────
  const { ref: passwordRef, ...passwordRest } = register('password');

  return (
    <div className="relative w-full max-w-[480px]">
      {/* Subtle ambient accent illumination behind signup card (identical to LoginPage) */}
      <div
        className="absolute -inset-1 rounded-[20px] pointer-events-none -z-10 opacity-70 blur-md transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(255, 101, 0, 0.08) 0%, transparent 75%)',
        }}
      />

      {/* ── Signup Card (Specifications: max-w 480px, #151922, border #292E38, radius 16px) ── */}
      <div className="rounded-[16px] border border-[#292E38] bg-[#151922] px-7 py-7 shadow-2xl shadow-black/60 sm:px-8 sm:py-8">
        {/* Card heading */}
        <div className="mb-6">
          <h2 className="text-[22px] font-bold tracking-tight text-[#F4F4F5]">
            Create your account
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#A1A1AA]">
            Join EngineerOS to organize your studies, code, and career.
          </p>
        </div>

        {/* Server error banner — original error state logic preserved */}
        {serverError && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-sm text-rose-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="leading-snug">{serverError}</span>
          </div>
        )}

        {/* ── Form — original onSubmit handler preserved ───────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
          {/* Full Name */}
          <AuthInput
            id="name"
            label="Full Name"
            placeholder="Alex Smith"
            leftIcon={User}
            error={errors.name?.message}
            {...register('name')}
          />

          {/* Email Address */}
          <AuthInput
            id="email"
            label="Email Address"
            type="email"
            placeholder="alex@stanford.edu"
            leftIcon={Mail}
            error={errors.email?.message}
            {...register('email')}
          />

          {/* Password with requirement hint and visibility toggle */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-[13px] font-medium text-zinc-300">
                Password
              </label>
              <span className="text-[11px] text-zinc-500">
                min 8 chars, 1 uppercase, 1 digit
              </span>
            </div>
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

          {/* Two-column sub-fields: University & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AuthInput
              id="university"
              label="University / College"
              placeholder="MIT / Stanford / IIT"
              leftIcon={GraduationCap}
              error={errors.university?.message}
              {...register('university')}
            />

            <AuthInput
              id="branch"
              label="Branch / Major"
              placeholder="Computer Science"
              leftIcon={BookOpen}
              error={errors.branch?.message}
              {...register('branch')}
            />
          </div>

          {/* Two-column sub-fields: Semester & Account Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AuthSelect
              id="semester"
              label="Semester"
              error={errors.semester?.message}
              {...register('semester')}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s} className="bg-[#151922] text-zinc-100">
                  Semester {s}
                </option>
              ))}
            </AuthSelect>

            <AuthSelect
              id="role"
              label="Account Role"
              error={errors.role?.message}
              {...register('role')}
            >
              <option value="student" className="bg-[#151922] text-zinc-100">
                Student
              </option>
              <option value="senior" className="bg-[#151922] text-zinc-100">
                Senior / Peer Mentor
              </option>
            </AuthSelect>
          </div>

          {/* Submit button — brand orange with loading spinner */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[9px] bg-[#FF6500] py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#E65300] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating account…</span>
              </>
            ) : (
              <span>Complete Registration</span>
            )}
          </button>
        </form>

        {/* ── Footer Link — original destination preserved ──────────────── */}
        <p className="mt-5 text-center text-[13px] text-[#71717A]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-orange-500 transition-colors duration-150 hover:text-orange-400"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
