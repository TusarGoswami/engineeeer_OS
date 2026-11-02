import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext.jsx';
import { Button } from '../../components/Button.jsx';
import { Input } from '../../components/Input.jsx';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/Card.jsx';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const [serverError, setServerError] = useState('');

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

  const fillDemoAccount = (email, pass) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  const onSubmit = async values => {
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

  return (
    <div className="w-full max-w-md">
      <Card className="border-surface-800 bg-surface-900/80 shadow-2xl backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600/20 text-brand-400 font-bold text-xl border border-brand-500/30">
            OS
          </div>
          <CardTitle className="text-xl">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your engineering workspace
          </CardDescription>
        </CardHeader>

        <CardContent>
          {serverError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="student@university.edu"
              leftIcon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={Lock}
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-surface-800">
            <p className="text-xs font-semibold text-surface-400 mb-2 uppercase tracking-wider">
              Quick Demo Logins
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('student@engineeros.dev', 'Password123')}
                className="px-2.5 py-1 text-xs rounded-lg bg-surface-800/90 hover:bg-surface-700 text-surface-200 border border-surface-700 transition-colors"
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('senior@engineeros.dev', 'Password123')}
                className="px-2.5 py-1 text-xs rounded-lg bg-surface-800/90 hover:bg-surface-700 text-surface-200 border border-surface-700 transition-colors"
              >
                💼 Senior / Alumni
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@engineeros.dev', 'Password123')}
                className="px-2.5 py-1 text-xs rounded-lg bg-surface-800/90 hover:bg-surface-700 text-surface-200 border border-surface-700 transition-colors"
              >
                🛡️ Admin
              </button>
            </div>
            {serverError && (
              <p className="mt-3 text-[11px] text-surface-400 bg-surface-950/60 p-2 rounded-lg border border-surface-800">
                💡 <span className="font-semibold text-surface-300">New machine or fresh clone?</span> Run{' '}
                <code className="text-brand-400 font-mono">npm run seed</code> in the terminal to load demo accounts.
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="justify-center text-xs text-surface-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="ml-1 font-semibold text-brand-400 hover:text-brand-300">
            Create an account
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
