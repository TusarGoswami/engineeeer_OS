import { useState, useEffect } from 'react';
import {
  Palette,
  Shield,
  Eye,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  Drawer,
  Button,
  Input,
  Textarea,
  Badge,
  useToast,
} from '../../../components/index.js';
import profileService from '../../../services/profile.service.js';
import { THEMES, normalizeThemeId } from './ProfileCard.jsx';

/**
 * Slide-over customization drawer for card aesthetic theme, handle/bio, visibility, and section toggles.
 */
export const CardCustomizerDrawer = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  onThemePreview,
  onSectionsPreview,
}) => {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isRotatingToken, setIsRotatingToken] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const resolvedProfile = profile?.profile || profile;
  const resolvedSettings = profile?.settings || resolvedProfile?.profileSettings;

  const [theme, setTheme] = useState(
    normalizeThemeId(resolvedSettings?.theme || resolvedProfile?.theme)
  );
  const [visibility, setVisibility] = useState(
    resolvedSettings?.visibility || 'public'
  );
  const [username, setUsername] = useState(
    resolvedProfile?.identity?.username || resolvedProfile?.username || ''
  );
  const [headline, setHeadline] = useState(
    resolvedProfile?.identity?.headline || resolvedProfile?.headline || ''
  );
  const [sections, setSections] = useState({
    showHeatmap: resolvedSettings?.sections?.showHeatmap ?? true,
    showGate: resolvedSettings?.sections?.showGate ?? true,
    showInterviews: resolvedSettings?.sections?.showInterviews ?? true,
    showUniversity: resolvedSettings?.sections?.showUniversity ?? true,
    showPhoto: resolvedSettings?.sections?.showPhoto ?? true,
    showSkills: resolvedSettings?.sections?.showSkills ?? true,
    showBadges: resolvedSettings?.sections?.showBadges ?? true,
  });

  useEffect(() => {
    if (!resolvedProfile) return;
    setTheme(normalizeThemeId(resolvedSettings?.theme || resolvedProfile?.theme));
    setVisibility(resolvedSettings?.visibility || 'public');
    setUsername(resolvedProfile?.identity?.username || resolvedProfile?.username || '');
    setHeadline(resolvedProfile?.identity?.headline || resolvedProfile?.headline || '');
    setSections({
      showHeatmap: resolvedSettings?.sections?.showHeatmap ?? true,
      showGate: resolvedSettings?.sections?.showGate ?? true,
      showInterviews: resolvedSettings?.sections?.showInterviews ?? true,
      showUniversity: resolvedSettings?.sections?.showUniversity ?? true,
      showPhoto: resolvedSettings?.sections?.showPhoto ?? true,
      showSkills: resolvedSettings?.sections?.showSkills ?? true,
      showBadges: resolvedSettings?.sections?.showBadges ?? true,
    });
  }, [profile, isOpen]);

  const shareToken = profile?.shareToken || resolvedProfile?.shareToken;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${baseUrl}/u/${username}${
    visibility === 'unlisted' && shareToken ? `?token=${shareToken}` : ''
  }`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    showToast('Profile link copied to clipboard', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRotateToken = async () => {
    try {
      setIsRotatingToken(true);
      const res = await profileService.regenerateShareToken();
      showToast('Share token regenerated successfully', 'success');
      if (onProfileUpdated) {
        onProfileUpdated((prev) => ({
          ...prev,
          shareToken: res.shareToken,
        }));
      }
    } catch {
      showToast('Failed to regenerate share token', 'error');
    } finally {
      setIsRotatingToken(false);
    }
  };

  const handleToggleSection = (key) => {
    setSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (onSectionsPreview) {
        onSectionsPreview(next);
      }
      return next;
    });
  };

  const handleSelectTheme = (nextTheme) => {
    const normalized = normalizeThemeId(nextTheme);
    setTheme(normalized);
    if (onThemePreview) {
      onThemePreview(normalized);
    }
  };

  const handleCloseDrawer = () => {
    if (onThemePreview) {
      onThemePreview(null);
    }
    if (onSectionsPreview) {
      onSectionsPreview(null);
    }
    onClose();
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        username: username.trim().toLowerCase(),
        headline: headline.trim(),
        profileSettings: {
          theme,
          visibility,
          sections,
        },
      };

      const updated = await profileService.updateOwnerProfile(payload);
      showToast('Card settings saved successfully', 'success');
      if (onThemePreview) {
        onThemePreview(null);
      }
      if (onSectionsPreview) {
        onSectionsPreview(null);
      }
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleCloseDrawer}
      title="Customize Profile Card"
      description="Personalize your aesthetic theme, public visibility, and section disclosures"
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={handleCloseDrawer} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Theme Picker */}
        <div className="space-y-3">
          <div className="font-mono text-[11px] font-semibold text-surface-200 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-brand-500" />
            <span>Visual Aesthetics Theme</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {Object.values(THEMES).map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectTheme(t.id)}
                  className={`flex items-center gap-3 text-left p-3 rounded-xl border transition-colors ${
                    active
                      ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/35'
                      : 'border-surface-700 bg-elevated/55 hover:border-surface-600'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-7 h-7 rounded-lg border shrink-0 flex items-center justify-center ${t.swatchBg} ${t.swatchBorder}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-sm ${t.swatchAccent}`} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-surface-100">{t.name}</span>
                      {active && (
                        <Badge variant="brand" size="sm">
                          ACTIVE
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-surface-400 mt-0.5">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Identity & Handle */}
        <div className="space-y-3 pt-4 border-t border-surface-700">
          <div className="font-mono text-[11px] font-semibold text-surface-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Handle & Bio</span>
          </div>
          <div className="space-y-3">
            <Input
              label="Username / Public Handle"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alexj"
              helperText="Must be 3-24 alphanumeric characters or underscores"
            />
            <Textarea
              label="Headline / Tech Stack (Max 120 chars)"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={120}
              showCount
              rows={2}
              placeholder="Systems Engineer • Distributed Systems & DSA • Rust/Go"
            />
          </div>
        </div>

        {/* Visibility Setting */}
        <div className="space-y-3 pt-4 border-t border-surface-700">
          <div className="font-mono text-[11px] font-semibold text-surface-200 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 badge-compiler" />
            <span>Card Visibility & Privacy</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'public', label: 'Public', desc: 'Listed & searchable' },
              { id: 'unlisted', label: 'Unlisted', desc: 'Only via secret link' },
              { id: 'private', label: 'Private', desc: 'Only you can view' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVisibility(v.id)}
                className={`p-2.5 rounded-xl border text-left sm:text-center transition-colors ${
                  visibility === v.id
                    ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/35'
                    : 'border-surface-700 bg-elevated/55 hover:border-surface-600'
                }`}
              >
                <div className="text-xs font-semibold text-surface-100 capitalize">{v.label}</div>
                <div className="text-[10px] text-surface-400 mt-0.5">{v.desc}</div>
              </button>
            ))}
          </div>

          {visibility !== 'private' && (
            <div className="p-3 rounded-xl bg-elevated/70 border border-surface-700 space-y-2">
              <div className="flex items-center justify-between text-xs text-surface-400">
                <span>Public Share Link</span>
                {visibility === 'unlisted' && (
                  <button
                    type="button"
                    onClick={handleRotateToken}
                    disabled={isRotatingToken}
                    className="text-brand-700 hover:underline inline-flex items-center gap-1 text-[11px] font-medium"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRotatingToken ? 'animate-spin' : ''}`} />
                    <span>Rotate Token</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  aria-label="Public share link"
                  className="w-full min-w-0 text-xs font-mono bg-card border border-surface-600 rounded-lg px-2.5 py-1.5 text-surface-200 select-all focus:outline-none focus:border-brand-500"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCopyLink}
                  leftIcon={copiedLink ? Check : Copy}
                >
                  {copiedLink ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Displayed Sections */}
        <div className="space-y-3 pt-4 border-t border-surface-700">
          <div className="font-mono text-[11px] font-semibold text-surface-200 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-brand-500" />
            <span>Displayed Sections</span>
          </div>
          <div className="space-y-1.5">
            {[
              { key: 'showHeatmap', label: 'Activity Heatmap & Streak Stream' },
              { key: 'showGate', label: 'GATE Examination Scores & Mocks' },
              { key: 'showInterviews', label: 'Interview Readiness Score' },
              { key: 'showUniversity', label: 'University & Graduation Year' },
              { key: 'showPhoto', label: 'Profile Photo / Avatar' },
              { key: 'showSkills', label: 'Verified Skills & Topic Tags' },
              { key: 'showBadges', label: 'Earned Platform Badges' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-2.5 rounded-lg border border-surface-700 bg-elevated/45 hover:bg-elevated cursor-pointer transition-colors"
              >
                <span className="text-xs font-medium text-surface-200">{item.label}</span>
                <input
                  type="checkbox"
                  checked={sections[item.key]}
                  onChange={() => handleToggleSection(item.key)}
                  className="w-4 h-4 rounded border-surface-600 accent-brand-500 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default CardCustomizerDrawer;
