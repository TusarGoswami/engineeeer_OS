import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, GraduationCap, AlertCircle } from 'lucide-react';
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

export const RegisterPage = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

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

  const onSubmit = async values => {
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

  return (
    <div className="w-full max-w-lg">
      <Card className="border-surface-800 bg-surface-900/80 shadow-2xl backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your Account</CardTitle>
          <CardDescription>
            Join EngineerOS to organize your studies, code, and career
          </CardDescription>
        </CardHeader>

        <CardContent>
          {serverError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <Input
              label="Full Name"
              placeholder="Alex Smith"
              leftIcon={User}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="alex@stanford.edu"
              leftIcon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password (min 8 chars, 1 uppercase, 1 digit)"
              type="password"
              placeholder="••••••••"
              leftIcon={Lock}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="University / College"
                placeholder="MIT / Stanford / IIT"
                leftIcon={GraduationCap}
                error={errors.university?.message}
                {...register('university')}
              />

              <Input
                label="Branch / Major"
                placeholder="Computer Science"
                error={errors.branch?.message}
                {...register('branch')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-medium text-surface-300">Semester (1 to 8)</label>
                <select
                  className="w-full rounded-xl bg-surface-950/80 border border-surface-800 text-surface-100 text-sm px-3.5 py-2.5 focus:outline-none focus:border-brand-500"
                  {...register('semester')}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-medium text-surface-300">Account Role</label>
                <select
                  className="w-full rounded-xl bg-surface-950/80 border border-surface-800 text-surface-100 text-sm px-3.5 py-2.5 focus:outline-none focus:border-brand-500"
                  {...register('role')}
                >
                  <option value="student">Student</option>
                  <option value="senior">Senior / Peer Mentor</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4"
              isLoading={isSubmitting}
            >
              Complete Registration
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center text-xs text-surface-400">
          Already have an account?{' '}
          <Link to="/login" className="ml-1 font-semibold text-brand-400 hover:text-brand-300">
            Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;
