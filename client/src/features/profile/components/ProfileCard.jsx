import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Code2,
  BookOpen,
  Sparkles,
  Flame,
  Award,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Terminal as TerminalIcon,
  Cpu,
} from 'lucide-react';
import Avatar from '../../../components/Avatar.jsx';

export const THEMES = {
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    description: 'Hacker console with phosphor green, scanlines & shell prompt',
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Swiss modernist monochrome with sharp typography',
  },
  silicon: {
    id: 'silicon',
    name: 'Silicon Neon',
    description: 'Deep twilight canvas with vibrant violet-cobalt glow',
  },
  varsity: {
    id: 'varsity',
    name: 'Varsity Academic',
    description: 'Collegiate navy & gold foil crest with formal academic framing',
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blueprint CAD',
    description: 'Engineering schematic with dimensional callouts and grid',
  },
};

export const ProfileCard = forwardRef(
  (
    {
      profile,
      themeOverride,
      compact = false,
      showQrCode = true,
      className = '',
    },
    ref
  ) => {
    if (!profile) return null;

    const theme =
      themeOverride ||
      profile.profileSettings?.theme ||
      profile.theme ||
      'terminal';

    const sections = profile.profileSettings?.sections || {
      showHeatmap: true,
      showGate: true,
      showInterviews: true,
      showUniversity: true,
      showPhoto: true,
      showSkills: true,
      showBadges: true,
    };

    const identity = profile.identity || {
      name: profile.name,
      username: profile.username,
      headline: profile.headline,
      university: profile.university,
      branch: profile.branch,
      semester: profile.semester,
      graduationYear: profile.graduationYear || profile.profile?.graduationYear,
      avatarUrl: profile.avatarUrl,
    };

    const stats = profile.stats || {
      coding: { solved: 0, easy: 0, medium: 0, hard: 0, accuracy: 0 },
      gate: { testsTaken: 0, bestScore: 0, accuracy: 0 },
      academic: { subjectsEnrolled: 0, syllabusProgress: 0 },
      interviews: { completed: 0, averageScore: 0 },
      streaks: { current: 0, longest: 0 },
    };

    const badges = profile.badges || [];
    const topSkills = profile.topSkills || [];
    const recentActivity = profile.recentActivity || [];

    // Public URL for QR Code
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://engineeros.dev';
    const profileUrl = `${baseUrl}/u/${identity.username || 'user'}${
      profile.shareToken ? `?token=${profile.shareToken}` : ''
    }`;

    // Theme Styles Configuration
    const themeStyles = {
      terminal: {
        container:
          'bg-[#0A0F1D] text-emerald-400 font-mono border-2 border-emerald-500/30 shadow-2xl shadow-emerald-950/40 relative overflow-hidden',
        header: 'border-b border-emerald-500/20 bg-[#070B16] px-5 py-3',
        cardTitle: 'text-emerald-300 font-mono',
        subtext: 'text-emerald-500/70',
        panel: 'bg-[#0E1528] border border-emerald-500/20 rounded-lg p-3.5',
        metricVal: 'text-emerald-300 font-bold',
        metricLabel: 'text-emerald-500/80 text-xs uppercase tracking-wider',
        chip: 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30',
        footer: 'border-t border-emerald-500/20 bg-[#070B16]',
        badgeBorder: 'border border-emerald-500/40 bg-emerald-950/60',
      },
      minimalist: {
        container:
          'bg-[#0C0F17] text-surface-100 font-sans border border-surface-700/60 shadow-2xl relative overflow-hidden rounded-xl',
        header: 'border-b border-surface-800 bg-[#080B11] px-5 py-4',
        cardTitle: 'text-white font-semibold tracking-tight',
        subtext: 'text-surface-400',
        panel: 'bg-[#121622] border border-surface-800 rounded-lg p-3.5',
        metricVal: 'text-white font-mono font-bold',
        metricLabel: 'text-surface-400 text-xs tracking-wider uppercase',
        chip: 'bg-surface-800 text-surface-200 border border-surface-700',
        footer: 'border-t border-surface-800 bg-[#080B11]',
        badgeBorder: 'border border-surface-700 bg-surface-800/80',
      },
      silicon: {
        container:
          'bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#1E1B4B] text-white font-sans border-2 border-indigo-500/30 shadow-2xl shadow-indigo-950/50 relative overflow-hidden rounded-2xl backdrop-blur-xl',
        header:
          'border-b border-indigo-500/20 bg-indigo-950/30 backdrop-blur-md px-5 py-4',
        cardTitle: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 font-bold tracking-tight',
        subtext: 'text-indigo-200/70',
        panel: 'bg-surface-900/60 border border-indigo-500/20 rounded-xl p-3.5 backdrop-blur-md',
        metricVal: 'text-indigo-100 font-mono font-bold',
        metricLabel: 'text-indigo-300/80 text-xs uppercase tracking-wider',
        chip: 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/30',
        footer: 'border-t border-indigo-500/20 bg-indigo-950/40 backdrop-blur-md',
        badgeBorder: 'border border-indigo-500/40 bg-indigo-900/40 shadow-inner',
      },
      varsity: {
        container:
          'bg-[#0B132B] text-amber-100 font-sans border-2 border-amber-500/40 shadow-2xl shadow-amber-950/40 relative overflow-hidden rounded-2xl',
        header: 'border-b border-amber-500/30 bg-[#070D1E] px-5 py-4',
        cardTitle: 'text-amber-300 font-serif font-bold tracking-wide',
        subtext: 'text-amber-200/70',
        panel: 'bg-[#111C3A] border border-amber-500/20 rounded-xl p-3.5',
        metricVal: 'text-amber-200 font-mono font-bold',
        metricLabel: 'text-amber-400/80 text-xs uppercase tracking-wider font-semibold',
        chip: 'bg-amber-950/60 text-amber-300 border border-amber-500/30',
        footer: 'border-t border-amber-500/30 bg-[#070D1E]',
        badgeBorder: 'border border-amber-500/50 bg-amber-950/40',
      },
      blueprint: {
        container:
          'bg-[#06152D] text-cyan-200 font-mono border-2 border-cyan-500/40 shadow-2xl shadow-cyan-950/40 relative overflow-hidden rounded-none',
        header: 'border-b-2 border-cyan-500/40 bg-[#040E1E] px-5 py-3',
        cardTitle: 'text-cyan-300 font-mono font-bold uppercase tracking-widest',
        subtext: 'text-cyan-400/70',
        panel: 'bg-[#081C3C] border border-cyan-500/30 p-3.5',
        metricVal: 'text-cyan-100 font-mono font-bold',
        metricLabel: 'text-cyan-400/80 text-xs uppercase tracking-wider',
        chip: 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40',
        footer: 'border-t-2 border-cyan-500/40 bg-[#040E1E]',
        badgeBorder: 'border border-cyan-500/50 bg-cyan-950/60',
      },
    };

    const style = themeStyles[theme] || themeStyles.terminal;

    return (
      <div
        ref={ref}
        id="engineeros-profile-card"
        className={`${style.container} w-full max-w-2xl transition-all duration-300 ${className}`}
      >
        {/* Terminal Title Bar / Card Header */}
        <div className={`flex items-center justify-between ${style.header}`}>
          <div className="flex items-center gap-2">
            {theme === 'terminal' ? (
              <>
                <div className="flex gap-1.5 mr-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                </div>
                <TerminalIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400/90 font-mono">
                  {identity.username ? `${identity.username}@engineeros:~$ id` : 'engineeros:~$ whoami'}
                </span>
              </>
            ) : theme === 'blueprint' ? (
              <div className="flex items-center gap-2">
                <span className="text-cyan-500 font-bold text-xs">[SCHEMA // OS-CARD-V2]</span>
                <span className="text-xs text-cyan-400/60">{'//'} SPEC: ENGINEERING PROFILE</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-brand-600/30 border border-brand-500/40 flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5 text-brand-400" />
                </div>
                <span className="text-xs font-semibold tracking-wider uppercase text-surface-400">
                  EngineerOS Certified Card
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-mono bg-surface-900/80 border border-surface-700/50 text-surface-300">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{stats.streaks?.current || 0}d streak</span>
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-6">
          {/* Identity Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {sections.showPhoto !== false ? (
                <div className="relative shrink-0">
                  <Avatar
                    src={identity.avatarUrl}
                    name={identity.name}
                    size="xl"
                    className="border-2 border-surface-700 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-surface-950">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-surface-800 flex items-center justify-center font-bold text-surface-300 text-lg border border-surface-700">
                  {identity.name?.slice(0, 2).toUpperCase() || 'OS'}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className={`text-xl font-bold ${style.cardTitle}`}>
                    {identity.name || 'Engineer'}
                  </h2>
                  {identity.username && (
                    <span className={`text-xs font-mono ${style.subtext}`}>
                      @{identity.username}
                    </span>
                  )}
                </div>

                {identity.headline && (
                  <p className={`text-sm mt-0.5 line-clamp-2 ${style.subtext}`}>
                    {identity.headline}
                  </p>
                )}

                {sections.showUniversity !== false && identity.university && (
                  <div className="flex items-center gap-2 text-xs mt-1.5 opacity-80 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {identity.university}
                    </span>
                    {identity.branch && (
                      <>
                        <span>•</span>
                        <span>{identity.branch}</span>
                      </>
                    )}
                    {identity.semester && (
                      <>
                        <span>•</span>
                        <span>Sem {identity.semester}</span>
                      </>
                    )}
                    {identity.graduationYear && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5">
                          <Calendar className="w-3 h-3" />
                          &apos;{String(identity.graduationYear).slice(-2)}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4 Core Pillars Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Coding */}
            <div className={style.panel}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={style.metricLabel}>Coding</span>
                <Code2 className="w-4 h-4 opacity-70" />
              </div>
              <div className={`text-2xl ${style.metricVal}`}>
                {stats.coding?.solved || 0}
              </div>
              <div className="text-[11px] opacity-75 mt-1 flex items-center gap-1">
                <span className="text-emerald-400 font-semibold">{stats.coding?.easy || 0}E</span>
                <span>/</span>
                <span className="text-amber-400 font-semibold">{stats.coding?.medium || 0}M</span>
                <span>/</span>
                <span className="text-rose-400 font-semibold">{stats.coding?.hard || 0}H</span>
              </div>
              {stats.coding?.accuracy > 0 && (
                <div className="text-[10px] opacity-60 mt-0.5">
                  {stats.coding.accuracy}% Accuracy
                </div>
              )}
            </div>

            {/* 2. GATE */}
            {sections.showGate !== false && (
              <div className={style.panel}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={style.metricLabel}>GATE Prep</span>
                  <Award className="w-4 h-4 opacity-70" />
                </div>
                <div className={`text-2xl ${style.metricVal}`}>
                  {stats.gate?.bestScore ? `${stats.gate.bestScore}` : `${stats.gate?.testsTaken || 0}`}
                </div>
                <div className="text-[11px] opacity-75 mt-1">
                  {stats.gate?.bestScore ? 'Best Score' : 'Mocks Taken'}
                </div>
                <div className="text-[10px] opacity-60 mt-0.5">
                  {stats.gate?.accuracy || 0}% Accuracy
                </div>
              </div>
            )}

            {/* 3. Academics */}
            <div className={style.panel}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={style.metricLabel}>Curriculum</span>
                <BookOpen className="w-4 h-4 opacity-70" />
              </div>
              <div className={`text-2xl ${style.metricVal}`}>
                {stats.academic?.syllabusProgress || 0}%
              </div>
              <div className="text-[11px] opacity-75 mt-1">
                {stats.academic?.subjectsEnrolled || 0} Subjects
              </div>
              <div className="text-[10px] opacity-60 mt-0.5">
                Syllabus Tracked
              </div>
            </div>

            {/* 4. Interviews */}
            {sections.showInterviews !== false && (
              <div className={style.panel}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={style.metricLabel}>Readiness</span>
                  <Sparkles className="w-4 h-4 opacity-70" />
                </div>
                <div className={`text-2xl ${style.metricVal}`}>
                  {stats.interviews?.averageScore ? `${stats.interviews.averageScore}/100` : `${stats.interviews?.completed || 0}`}
                </div>
                <div className="text-[11px] opacity-75 mt-1">
                  {stats.interviews?.averageScore ? 'Mock Score' : 'Sessions Done'}
                </div>
                <div className="text-[10px] opacity-60 mt-0.5">
                  AI Evaluated
                </div>
              </div>
            )}
          </div>

          {/* Top Skills Tags */}
          {sections.showSkills !== false && topSkills.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Verified Proficiencies
              </div>
              <div className="flex flex-wrap gap-2">
                {topSkills.map(skill => (
                  <span
                    key={skill}
                    className={`text-xs px-2.5 py-1 rounded-md font-mono ${style.chip}`}
                  >
                    #{skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Earned Badges */}
          {sections.showBadges !== false && badges.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Earned Credentials ({badges.length})
              </div>
              <div className="flex flex-wrap gap-2.5">
                {badges.slice(0, compact ? 3 : 5).map(b => (
                  <div
                    key={b.badgeId || b.name}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${style.badgeBorder}`}
                  >
                    <span className="text-sm">{b.icon || '🎖️'}</span>
                    <span className="font-medium">{b.name}</span>
                    <span className="text-[10px] uppercase opacity-70 font-mono">
                      • {b.tier}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mini Activity Heatmap Preview */}
          {sections.showHeatmap !== false && recentActivity.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs opacity-70">
                <span className="font-semibold uppercase tracking-wider">
                  Consistency Stream (Last 30 Days)
                </span>
                <span className="font-mono">
                  {recentActivity.reduce((acc, a) => acc + (a.count || 0), 0)} events
                </span>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                {recentActivity.slice(-30).map(d => {
                  const count = d.count || 0;
                  const bgClass =
                    count === 0
                      ? 'bg-surface-800/40'
                      : count <= 2
                      ? 'bg-emerald-500/40'
                      : count <= 5
                      ? 'bg-emerald-500/70'
                      : 'bg-emerald-400';
                  return (
                    <div
                      key={d.date}
                      title={`${d.date}: ${count} actions`}
                      className={`h-4 w-2.5 rounded-sm shrink-0 ${bgClass}`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Verification Footer & QR Code */}
        <div
          className={`flex items-center justify-between px-6 py-4 ${style.footer}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-900 border border-surface-700/60 flex items-center justify-center font-bold text-xs text-white">
              OS
            </div>
            <div>
              <div className="text-xs font-semibold text-white tracking-wide">
                EngineerOS Authentic Card
              </div>
              <div className="text-[11px] opacity-70 font-mono">
                engineeros.dev/u/{identity.username || 'user'}
              </div>
            </div>
          </div>

          {showQrCode && (
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white rounded-md shadow">
                <QRCodeSVG
                  value={profileUrl}
                  size={40}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;
