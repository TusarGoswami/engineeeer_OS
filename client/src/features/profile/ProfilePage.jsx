import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, GraduationCap, Building2, Download, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { userService } from '../../services/user.service.js';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/Card.jsx';
import { Input } from '../../components/Input.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [successMsg, setSuccessMsg] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      university: user?.university || '',
      branch: user?.branch || '',
      semester: user?.semester || 1,
      bio: user?.bio || '',
      currentCompany: user?.profile?.currentCompany || '',
      githubHandle: user?.profile?.githubHandle || '',
    },
  });

  const onSubmit = async values => {
    setSuccessMsg('');
    try {
      await updateUser({
        name: values.name,
        university: values.university,
        branch: values.branch,
        semester: Number(values.semester),
        bio: values.bio,
        profile: {
          currentCompany: values.currentCompany,
          githubHandle: values.githubHandle,
        },
      });
      setSuccessMsg('Profile saved successfully.');
    } catch {
      // Handled
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await userService.exportMe();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `engineeros-export-${user?.name?.toLowerCase().replace(/\s+/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl border border-surface-800 bg-surface-900/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 font-bold text-white text-2xl shadow-lg shadow-brand-600/30">
            {user?.name?.slice(0, 2).toUpperCase() || 'OS'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{user?.name}</h1>
              <Badge variant="brand" className="capitalize">
                {user?.role}
              </Badge>
              {user?.isAlumni && <Badge variant="purple">Alumni</Badge>}
            </div>
            <p className="text-sm text-surface-400 mt-0.5">{user?.email}</p>
            <p className="text-xs text-surface-500 mt-1">
              {user?.university
                ? `${user.university} • ${user.branch} • Semester ${user.semester}`
                : 'Engineering Student'}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={Download}
          isLoading={isExporting}
          onClick={handleExportData}
        >
          Export Data (GDPR)
        </Button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Academic & Personal Details</CardTitle>
          <CardDescription>Update your semester, institution, and career focus</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" leftIcon={User} {...register('name')} />
              <Input
                label="University / College"
                leftIcon={GraduationCap}
                {...register('university')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Branch / Major" {...register('branch')} />
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-medium text-surface-300">Semester</label>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Current Company / Placement"
                placeholder="Google / Microsoft / Amazon (if applicable)"
                leftIcon={Building2}
                {...register('currentCompany')}
              />
              <Input label="GitHub Handle" placeholder="octocat" {...register('githubHandle')} />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-medium text-surface-300">Bio</label>
              <textarea
                rows={3}
                className="w-full rounded-xl bg-surface-950/80 border border-surface-800 text-surface-100 text-sm p-3 focus:outline-none focus:border-brand-500 placeholder-surface-500"
                placeholder="Share your tech interests, tech stack, or engineering aspirations..."
                {...register('bio')}
              />
            </div>

            <CardFooter className="px-0 pb-0">
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
