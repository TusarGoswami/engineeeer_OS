import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  User,
  GraduationCap,
  Building2,
  Download,
  CheckCircle2,
  Share2,
  Camera,
  SlidersHorizontal,
  ExternalLink,
  Flame,
  Award,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { userService } from '../../services/user.service.js';
import profileService from '../../services/profile.service.js';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/Tabs.jsx';
import { Heatmap } from '../../components/Heatmap.jsx';
import { useToast } from '../../components/Toast.jsx';
import ProfileCard from './components/ProfileCard.jsx';
import CardCustomizerDrawer from './components/CardCustomizerDrawer.jsx';
import AvatarCropperModal from './components/AvatarCropperModal.jsx';
import CardExportModal from './components/CardExportModal.jsx';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const cardRef = useRef(null);

  // Modals & Drawers state
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Profile data from backend
  const [profileData, setProfileData] = useState(null);
  const [badges, setBadges] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form for Personal & Academic details
  const {
    register,
    handleSubmit,
    reset,
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

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [ownerProfile, myBadges, myHeatmap] = await Promise.all([
        profileService.getOwnerProfile(),
        profileService.getMyBadges().catch(() => []),
        profileService.getHeatmap(12).catch(() => []),
      ]);

      setProfileData(ownerProfile);
      setBadges(myBadges || []);
      setHeatmapData(myHeatmap || []);

      if (ownerProfile) {
        reset({
          name: ownerProfile.identity?.name || user?.name || '',
          university: ownerProfile.identity?.university || user?.university || '',
          branch: ownerProfile.identity?.branch || user?.branch || '',
          semester: ownerProfile.identity?.semester || user?.semester || 1,
          bio: ownerProfile.identity?.headline || user?.bio || '',
          currentCompany: user?.profile?.currentCompany || '',
          githubHandle: user?.profile?.githubHandle || '',
        });
      }
    } catch {
      showToast('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onPersonalSubmit = async values => {
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

      // Also sync snapshot name/headline
      await profileService.updateOwnerProfile({
        headline: values.bio?.slice(0, 120),
      });

      setSuccessMsg('Academic details updated successfully.');
      showToast('Profile updated', 'success');
      loadProfile();
    } catch {
      showToast('Failed to save profile', 'error');
    }
  };

  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      const data = await userService.exportMe();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `engineeros-export-${(user?.name || 'user')
        .toLowerCase()
        .replace(/\s+/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported successfully', 'success');
    } catch {
      showToast('Failed to export data', 'error');
    } finally {
      setIsExportingData(false);
    }
  };

  const handleAvatarUpdated = () => {
    loadProfile();
  };

  const username =
    profileData?.identity?.username || user?.username || user?.email?.split('@')[0];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Profile Card Showcase Section */}
      <div className="flex flex-col items-center space-y-4">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              My EngineerOS Card
            </h1>
            <p className="text-sm text-surface-400">
              Your verified visual passport for engineering consistency & achievements
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={Camera}
              onClick={() => setIsCropperOpen(true)}
            >
              Photo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={SlidersHorizontal}
              onClick={() => setIsCustomizerOpen(true)}
            >
              Customize
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Share2}
              onClick={() => setIsExportOpen(true)}
            >
              Share & Export
            </Button>
            {username && (
              <a
                href={`/u/${username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface-800 hover:bg-surface-700 text-surface-200 transition-colors border border-surface-700/80"
              >
                <span>Live View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Live Card Preview */}
        <div className="w-full flex justify-center py-2">
          {loading ? (
            <div className="w-full max-w-2xl h-80 rounded-2xl bg-surface-900/40 border border-surface-800 animate-pulse" />
          ) : (
            <ProfileCard
              ref={cardRef}
              profile={profileData}
              className="max-w-2xl"
            />
          )}
        </div>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="academic" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md mx-auto mb-6">
          <TabsTrigger value="academic">Academic & Info</TabsTrigger>
          <TabsTrigger value="badges">Badges ({badges.length})</TabsTrigger>
          <TabsTrigger value="telemetry">Activity Stream</TabsTrigger>
        </TabsList>

        {/* Tab 1: Academic & Personal Form */}
        <TabsContent value="academic" className="space-y-6">
          {successMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Academic & Personal Details</CardTitle>
              <CardDescription>
                Update your semester, university, and headline displayed across EngineerOS
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onPersonalSubmit)} className="space-y-4">
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
                    <label className="text-xs font-medium text-surface-300">
                      Current Semester
                    </label>
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
                    label="Current Company / Dream Target"
                    placeholder="Google / Atlassian / Microsoft"
                    leftIcon={Building2}
                    {...register('currentCompany')}
                  />
                  <Input
                    label="GitHub Handle"
                    placeholder="octocat"
                    {...register('githubHandle')}
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-medium text-surface-300">
                    Headline / Bio (Max 120 chars)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={120}
                    className="w-full rounded-xl bg-surface-950/80 border border-surface-800 text-surface-100 text-sm p-3 focus:outline-none focus:border-brand-500 placeholder-surface-500"
                    placeholder="Distributed Systems Enthusiast • 300+ LeetCode Solved"
                    {...register('bio')}
                  />
                </div>

                <CardFooter className="px-0 pb-0 flex items-center justify-between">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                  >
                    Save Changes
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={Download}
                    isLoading={isExportingData}
                    onClick={handleExportData}
                  >
                    Export Data (GDPR)
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Badges Gallery */}
        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Earned Credentials & Milestones</span>
              </CardTitle>
              <CardDescription>
                Deterministic badges unlocked as you solve problems, maintain streaks, and take assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {badges.length === 0 ? (
                <div className="text-center py-8 text-surface-400 text-sm">
                  No badges unlocked yet. Start your daily streak or solve coding problems to earn credentials!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {badges.map(b => (
                    <div
                      key={b.badgeId || b.name}
                      className="flex items-start gap-3 p-3.5 rounded-xl border border-surface-800 bg-surface-900/40 hover:border-surface-700 transition-colors"
                    >
                      <div className="text-2xl p-2 rounded-xl bg-surface-800 shrink-0">
                        {b.icon || '🎖️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-sm font-semibold text-white truncate">
                            {b.name}
                          </h4>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-800 text-surface-300 font-bold">
                            {b.tier}
                          </span>
                        </div>
                        <p className="text-xs text-surface-400 mt-1 line-clamp-2">
                          {b.description}
                        </p>
                        {b.earnedAt && (
                          <p className="text-[10px] text-surface-500 font-mono mt-2">
                            Earned on {new Date(b.earnedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Heatmap & Telemetry */}
        <TabsContent value="telemetry" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-500" />
                    <span>Annual Activity Stream</span>
                  </CardTitle>
                  <CardDescription>
                    All coding, GATE tests, academic learning, and mock interviews logged across 52 weeks
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    {profileData?.stats?.streaks?.current || 0} Days
                  </div>
                  <div className="text-xs text-surface-400">Current Streak</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Heatmap
                data={heatmapData}
                weeks={52}
                currentStreak={profileData?.stats?.streaks?.current || 0}
                longestStreak={profileData?.stats?.streaks?.longest || 0}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals & Drawers */}
      <CardCustomizerDrawer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        profile={profileData}
        onProfileUpdated={updated => setProfileData(updated)}
      />

      <AvatarCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        onAvatarUpdated={handleAvatarUpdated}
      />

      <CardExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        cardElementRef={cardRef}
        profile={profileData}
      />
    </div>
  );
};

export default ProfilePage;
