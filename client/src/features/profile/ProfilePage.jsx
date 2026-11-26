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
  Input,
  Select,
  Textarea,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Heatmap,
  PageHeader,
  CardSkeleton,
  useToast,
} from '../../components/index.js';
import ProfileCard from './components/ProfileCard.jsx';
import CardCustomizerDrawer from './components/CardCustomizerDrawer.jsx';
import AvatarCropperModal from './components/AvatarCropperModal.jsx';
import CardExportModal from './components/CardExportModal.jsx';
import { AchievementGallery } from './components/AchievementGallery.jsx';

/**
 * Profile & Settings workspace for managing visual EngineerOS card, academic profile metadata,
 * unlocked achievement vault, GDPR data export, and 52-week consistency telemetry.
 */
export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const cardRef = useRef(null);

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [profileData, setProfileData] = useState(null);
  const [badges, setBadges] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);

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

      const resolvedOwner = ownerProfile?.profile || ownerProfile;
      if (resolvedOwner) {
        reset({
          name: resolvedOwner.identity?.name || user?.name || '',
          university: resolvedOwner.identity?.university || user?.university || '',
          branch: resolvedOwner.identity?.branch || user?.branch || '',
          semester: resolvedOwner.identity?.semester || user?.semester || 1,
          bio: resolvedOwner.identity?.headline || user?.bio || '',
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

  const onPersonalSubmit = async (values) => {
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

  const handleAvatarUpdated = (result) => {
    if (result?.avatarUrl) {
      setProfileData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          identity: {
            ...(prev.identity || {}),
            avatarUrl: result.avatarUrl,
            avatarKey: result.avatarKey,
            avatarVersion: result.avatarVersion,
          },
          avatarUrl: result.avatarUrl,
        };
      });
    }
    loadProfile();
  };

  const username =
    profileData?.identity?.username || user?.username || user?.email?.split('@')[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header & Showcase Toolbar */}
      <PageHeader
        eyebrow="~/profile-settings"
        title="My EngineerOS Card"
        description="Your verified visual passport for engineering consistency, achievements, and career identity"
        actions={
          <>
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-medium bg-card hover:bg-elevated text-surface-200 hover:text-surface-100 transition-colors border border-surface-700 hover:border-surface-600 shadow-2xs"
              >
                <span>Live View</span>
                <ExternalLink className="w-3.5 h-3.5 text-surface-400" />
              </a>
            )}
          </>
        }
      />

      {/* Signature Card Showcase */}
      <div className="w-full flex justify-center">
        {loading ? (
          <CardSkeleton className="w-full max-w-3xl" lines={5} />
        ) : (
          <ProfileCard
            ref={cardRef}
            profile={profileData}
            className="w-full max-w-3xl"
          />
        )}
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="academic" className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList>
            <TabsTrigger value="academic">Academic & Info</TabsTrigger>
            <TabsTrigger value="badges">Badges ({badges.length})</TabsTrigger>
            <TabsTrigger value="telemetry">Activity Stream</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Academic & Personal Form */}
        <TabsContent value="academic" className="space-y-6">
          {successMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-compiler-500/10 border border-compiler-500/25 badge-compiler text-sm font-medium">
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
                  <Select label="Current Semester" {...register('semester')}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </Select>
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

                <Textarea
                  label="Headline / Bio (Max 120 chars)"
                  rows={2}
                  maxLength={120}
                  placeholder="Distributed Systems Enthusiast • 300+ LeetCode Solved"
                  {...register('bio')}
                />

                <CardFooter className="px-0 pb-0 flex flex-wrap items-center justify-between gap-3">
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

        {/* Tab 2: Badges Gallery — Hexagonal Achievement System */}
        <TabsContent value="badges" className="space-y-4">
          <AchievementGallery earnedBadges={badges} />
        </TabsContent>

        {/* Tab 3: Heatmap & Telemetry */}
        <TabsContent value="telemetry" className="space-y-4">
          <Card className="hm-card">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-[var(--hm-text-primary)]">
                    <Flame className="w-5 h-5 text-[var(--hm-accent)] shrink-0" />
                    <span>Annual Activity Stream</span>
                  </CardTitle>
                  <CardDescription className="text-[var(--hm-text-secondary)]">
                    All coding, GATE tests, academic learning, and mock interviews logged across 52 weeks
                  </CardDescription>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-lg font-bold font-mono tabular-nums text-[var(--hm-accent-strong)]">
                    {profileData?.stats?.streaks?.current || 0} Days
                  </div>
                  <div className="text-xs text-[var(--hm-text-secondary)]">Current Streak</div>
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
        onProfileUpdated={(updated) => setProfileData(updated)}
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
