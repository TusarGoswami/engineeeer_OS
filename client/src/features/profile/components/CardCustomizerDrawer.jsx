import { useState } from 'react';
import {
  Palette,
  Shield,
  Eye,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import Drawer from '../../../components/Drawer.jsx';
import Button from '../../../components/Button.jsx';
import Input from '../../../components/Input.jsx';
import { useToast } from '../../../components/Toast.jsx';
import profileService from '../../../services/profile.service.js';
import { THEMES } from './ProfileCard.jsx';

export const CardCustomizerDrawer = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}) => {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isRotatingToken, setIsRotatingToken] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form state initialized from profile
  const [theme, setTheme] = useState(
    profile?.profileSettings?.theme || profile?.theme || 'terminal'
  );
  const [visibility, setVisibility] = useState(
    profile?.profileSettings?.visibility || 'public'
  );
  const [username, setUsername] = useState(
    profile?.identity?.username || profile?.username || ''
  );
  const [headline, setHeadline] = useState(
    profile?.identity?.headline || profile?.headline || ''
  );
  const [sections, setSections] = useState({
    showHeatmap: profile?.profileSettings?.sections?.showHeatmap ?? true,
    showGate: profile?.profileSettings?.sections?.showGate ?? true,
    showInterviews: profile?.profileSettings?.sections?.showInterviews ?? true,
    showUniversity: profile?.profileSettings?.sections?.showUniversity ?? true,
    showPhoto: profile?.profileSettings?.sections?.showPhoto ?? true,
    showSkills: profile?.profileSettings?.sections?.showSkills ?? true,
    showBadges: profile?.profileSettings?.sections?.showBadges ?? true,
  });

  const shareToken = profile?.shareToken;
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
        onProfileUpdated(prev => ({
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

  const handleToggleSection = key => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
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
      onClose={onClose}
      title="Customize Profile Card"
      description="Personalize your theme, public visibility, and section disclosures"
      size="md"
    >
      <div className="space-y-6 pb-6">
        {/* Theme Picker */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-surface-200 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-brand-400" />
            Visual Aesthetics Theme
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {Object.values(THEMES).map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`flex items-start text-left p-3 rounded-xl border transition-all ${
                  theme === t.id
                    ? 'border-brand-500 bg-brand-500/10 shadow-md ring-1 ring-brand-500/50'
                    : 'border-surface-800 bg-surface-900/40 hover:border-surface-700'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{t.name}</span>
                    {theme === t.id && (
                      <span className="text-[10px] bg-brand-500 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-surface-400 mt-0.5">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Identity & Handle */}
        <div className="space-y-3 pt-4 border-t border-surface-800">
          <label className="text-xs font-semibold text-surface-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Handle & Bio
          </label>
          <div className="space-y-3">
            <Input
              label="Username / Public Handle"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. alexj"
              helperText="Must be 3-24 alphanumeric characters or underscores"
            />
            <div className="space-y-1">
              <label className="text-xs font-medium text-surface-300">
                Headline / Tech Stack (Max 120 chars)
              </label>
              <textarea
                value={headline}
                onChange={e => setHeadline(e.target.value)}
                maxLength={120}
                rows={2}
                className="w-full rounded-xl bg-surface-950/80 border border-surface-800 text-surface-100 text-sm p-3 focus:outline-none focus:border-brand-500 placeholder-surface-500"
                placeholder="Systems Engineer • Distributed Systems & DSA • Rust/Go"
              />
              <div className="text-right text-[11px] text-surface-500">
                {headline.length}/120
              </div>
            </div>
          </div>
        </div>

        {/* Visibility Setting */}
        <div className="space-y-3 pt-4 border-t border-surface-800">
          <label className="text-xs font-semibold text-surface-200 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            Card Visibility & Privacy
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'public', label: 'Public', desc: 'Listed & searchable' },
              { id: 'unlisted', label: 'Unlisted', desc: 'Only via secret link' },
              { id: 'private', label: 'Private', desc: 'Only you can view' },
            ].map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVisibility(v.id)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  visibility === v.id
                    ? 'border-brand-500 bg-brand-500/10 shadow-sm'
                    : 'border-surface-800 bg-surface-900/40 hover:border-surface-700'
                }`}
              >
                <div className="text-sm font-semibold text-white capitalize">{v.label}</div>
                <div className="text-[10px] text-surface-400 mt-0.5">{v.desc}</div>
              </button>
            ))}
          </div>

          {/* Share Link Box */}
          {visibility !== 'private' && (
            <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-surface-400">
                <span>Public Share Link</span>
                {visibility === 'unlisted' && (
                  <button
                    type="button"
                    onClick={handleRotateToken}
                    disabled={isRotatingToken}
                    className="text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 text-[11px]"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRotatingToken ? 'animate-spin' : ''}`} />
                    Rotate Token
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="w-full text-xs font-mono bg-surface-900 border border-surface-700/60 rounded-lg px-2.5 py-1.5 text-surface-300 select-all"
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

        {/* Section Disclosures */}
        <div className="space-y-3 pt-4 border-t border-surface-800">
          <label className="text-xs font-semibold text-surface-200 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-purple-400" />
            Displayed Sections
          </label>
          <div className="space-y-2">
            {[
              { key: 'showHeatmap', label: 'Activity Heatmap & Streak Stream' },
              { key: 'showGate', label: 'GATE Examination Scores & Mocks' },
              { key: 'showInterviews', label: 'Interview Readiness Score' },
              { key: 'showUniversity', label: 'University & Graduation Year' },
              { key: 'showPhoto', label: 'Profile Photo / Avatar' },
              { key: 'showSkills', label: 'Verified Skills & Topic Tags' },
              { key: 'showBadges', label: 'Earned Platform Badges' },
            ].map(item => (
              <label
                key={item.key}
                className="flex items-center justify-between p-2.5 rounded-lg border border-surface-800/80 bg-surface-900/30 hover:bg-surface-900/60 cursor-pointer"
              >
                <span className="text-xs font-medium text-surface-300">{item.label}</span>
                <input
                  type="checkbox"
                  checked={sections[item.key]}
                  onChange={() => handleToggleSection(item.key)}
                  className="w-4 h-4 rounded border-surface-700 text-brand-600 focus:ring-brand-500 bg-surface-950 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Drawer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-800">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default CardCustomizerDrawer;

