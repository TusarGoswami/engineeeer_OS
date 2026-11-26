/*
 * From Uiverse.io by Smit-Prajapati — https://uiverse.io/Smit-Prajapati/smart-liger-5
 * MIT License, Copyright (c) Smit-Prajapati (Smit Prajapati)
 *
 * Adapted for EngineerOS — unified orange accent palette (#FF8C42 / #FF6B35 / #E85D04)
 * with automatic Dark (#111315) & Light (#FFFFFF) mode compatibility via .pc-card CSS tokens.
 */

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
  Github,
} from 'lucide-react';
import Avatar from '../../../components/Avatar.jsx';

export const THEMES = {
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    description: 'Developer console with warm orange shell prompt and technical framing',
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Swiss modernist neutral layout with restrained orange highlights',
  },
  silicon: {
    id: 'silicon',
    name: 'Silicon Neon',
    description: 'Sleek engineering contrast with vibrant ember-orange accents',
  },
  varsity: {
    id: 'varsity',
    name: 'Varsity Academic',
    description: 'Collegiate crest typography with warm copper-orange detailing',
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blueprint CAD',
    description: 'Engineering schematic layout with dimensional orange markers',
  },
};

/* ── Per-variant typographic/structural framing (exclusively orange accent family) ── */
const THEME_TYPOGRAPHY = {
  terminal: {
    titleClass: 'font-mono tracking-tight',
    panelRadius: 'rounded-lg',
    chipRadius: 'rounded-md',
  },
  minimalist: {
    titleClass: 'font-semibold tracking-tight',
    panelRadius: 'rounded-lg',
    chipRadius: 'rounded-md',
  },
  silicon: {
    titleClass: 'font-bold tracking-tight',
    panelRadius: 'rounded-xl',
    chipRadius: 'rounded-md',
  },
  varsity: {
    titleClass: 'font-serif font-bold tracking-wide',
    panelRadius: 'rounded-xl',
    chipRadius: 'rounded-md',
  },
  blueprint: {
    titleClass: 'font-mono font-bold uppercase tracking-wider',
    panelRadius: 'rounded-md',
    chipRadius: 'rounded',
  },
};

export const ProfileCard = forwardRef(
  (
    {
      profile,
      themeOverride,
      compact = false,
      orientation = 'landscape',
      showQrCode = true,
      className = '',
    },
    ref
  ) => {
    if (!profile) return null;

    // Unwrap API envelope { profile: snapshot, settings, shareToken, shareUrl } if passed directly
    const raw =
      profile?.profile && typeof profile.profile === 'object' && !profile.identity
        ? {
            ...profile.profile,
            profileSettings: profile.profile.profileSettings || profile.settings,
            shareToken: profile.shareToken || profile.profile.shareToken,
            shareUrl: profile.shareUrl || profile.profile.shareUrl,
          }
        : profile;

    const isPortrait = orientation === 'portrait';

    const theme =
      themeOverride ||
      raw.profileSettings?.theme ||
      raw.theme ||
      'terminal';

    const sections = raw.profileSettings?.sections || {
      showHeatmap: true,
      showGate: true,
      showInterviews: true,
      showUniversity: true,
      showPhoto: true,
      showSkills: true,
      showBadges: true,
    };

    /* ── Avatar resolution ── */
    const resolvedAvatarKey =
      raw.identity?.avatarKey ||
      raw.avatarKey ||
      raw.user?.avatarKey ||
      '';

    const rawAvatarUrl =
      raw.identity?.avatarUrl ||
      raw.avatarUrl ||
      raw.profile?.avatarUrl ||
      raw.user?.profile?.avatarUrl ||
      (resolvedAvatarKey
        ? `/api/v1/users/avatar/${encodeURIComponent(resolvedAvatarKey)}`
        : '');

    const avatarVersion =
      raw.identity?.avatarVersion ||
      raw.avatarVersion ||
      raw.user?.avatarVersion ||
      1;

    const avatarUrl = rawAvatarUrl
      ? rawAvatarUrl.includes('?')
        ? `${rawAvatarUrl}&v=${avatarVersion}`
        : `${rawAvatarUrl}?v=${avatarVersion}`
      : '';

    /* ── Identity ── */
    const identity = {
      name:
        raw.identity?.name || raw.name || raw.user?.name || '',
      username:
        raw.identity?.username ||
        raw.username ||
        raw.user?.username ||
        '',
      headline:
        raw.identity?.headline || raw.headline || '',
      university:
        raw.identity?.university ||
        raw.university ||
        raw.user?.university ||
        '',
      branch:
        raw.identity?.branch ||
        raw.branch ||
        raw.user?.branch ||
        '',
      semester:
        raw.identity?.semester ||
        raw.semester ||
        raw.user?.semester ||
        1,
      graduationYear:
        raw.identity?.graduationYear ||
        raw.graduationYear ||
        raw.profile?.graduationYear ||
        raw.user?.profile?.graduationYear,
      avatarUrl,
      avatarKey: resolvedAvatarKey,
      githubHandle:
        raw.identity?.githubHandle ||
        raw.githubHandle ||
        raw.profile?.githubHandle ||
        raw.user?.profile?.githubHandle ||
        '',
      isAlumni:
        raw.isAlumni ??
        raw.identity?.isAlumni ??
        raw.user?.isAlumni ??
        false,
    };

    /* ── Normalized Stats (supports both ProfileSnapshot schema and test mocks) ── */
    const rawStats = raw.stats || {};
    const stats = {
      coding: {
        solved: rawStats.coding?.solved ?? rawStats.coding?.solvedCount ?? 0,
        easy: rawStats.coding?.easy ?? rawStats.coding?.easyCount ?? 0,
        medium: rawStats.coding?.medium ?? rawStats.coding?.mediumCount ?? 0,
        hard: rawStats.coding?.hard ?? rawStats.coding?.hardCount ?? 0,
        accuracy: rawStats.coding?.accuracy ?? rawStats.coding?.accuracyRate ?? 0,
      },
      gate: {
        testsTaken: rawStats.gate?.testsTaken ?? rawStats.gate?.testsAttempted ?? 0,
        bestScore: rawStats.gate?.bestScore ?? rawStats.gate?.averageScore ?? 0,
        accuracy: rawStats.gate?.accuracy ?? rawStats.gate?.accuracyRate ?? 0,
      },
      academic: {
        subjectsEnrolled:
          rawStats.academic?.subjectsEnrolled ?? rawStats.academics?.activeSubjectsCount ?? 0,
        syllabusProgress:
          rawStats.academic?.syllabusProgress ?? rawStats.academics?.completionPercentage ?? 0,
      },
      interviews: {
        completed:
          rawStats.interviews?.completed ?? rawStats.interviews?.completedCount ?? 0,
        averageScore:
          rawStats.interviews?.averageScore ?? rawStats.interviews?.averageReadiness ?? 0,
      },
      streaks: {
        current: rawStats.streaks?.current ?? rawStats.streaks?.currentStreak ?? 0,
        longest: rawStats.streaks?.longest ?? rawStats.streaks?.longestStreak ?? 0,
      },
    };

    const academicPct = Math.min(100, Math.max(0, Math.round(stats.academic.syllabusProgress || 0)));
    const codingPct =
      stats.coding.solved > 0
        ? Math.min(100, Math.max(5, Math.round((stats.coding.solved / 20) * 100)))
        : 0;
    const gatePct =
      stats.gate.testsTaken > 0 || stats.gate.bestScore > 0
        ? Math.min(100, Math.max(10, Math.round(stats.gate.accuracy || stats.gate.bestScore || 25)))
        : 0;
    const interviewPct =
      stats.interviews.completed > 0 || stats.interviews.averageScore > 0
        ? Math.min(100, Math.max(10, Math.round(stats.interviews.averageScore || 50)))
        : 0;
    const overallProgress = Math.round(
      (academicPct + codingPct + gatePct + interviewPct) / 4
    );

    const badges = raw.badges || [];
    const topSkills = (raw.topSkills || [])
      .map((s) => (typeof s === 'string' ? s : s?.name))
      .filter(Boolean);
    const recentActivity = raw.recentActivity || [];

    /* ── QR code URL ── */
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://engineeros.dev';
    const profileUrl = `${baseUrl}/u/${identity.username || 'user'}${
      raw.shareToken ? `?token=${raw.shareToken}` : ''
    }`;

    const typo = THEME_TYPOGRAPHY[theme] || THEME_TYPOGRAPHY.terminal;

    /* ── Theme-aware CSS token styles ── */
    const glassStyle = {
      transformStyle: 'preserve-3d',
      position: 'absolute',
      inset: '8px',
      borderRadius: '22px',
      borderTop: '1px solid var(--pc-glass-border)',
      borderLeft: '1px solid var(--pc-glass-border)',
      background: 'var(--pc-glass)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      transform: 'translate3d(0,0,20px)',
      pointerEvents: 'none',
      zIndex: 1,
    };

    /* Five layered circles — upper-right corner logo motif (consistent orange accents) */
    const circleBase = {
      display: 'block',
      position: 'absolute',
      aspectRatio: '1',
      borderRadius: '50%',
      top: 0,
      right: 0,
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      background: 'var(--pc-circle-bg)',
      border: '1px solid var(--pc-circle-border)',
      boxShadow: 'var(--pc-circle-shadow)',
      transition: 'all 0.5s ease-in-out',
    };

    const contentDepth = {
      transformStyle: 'preserve-3d',
      transform: 'translate3d(0,0,55px)',
      position: 'relative',
      zIndex: 2,
    };

    const ringSizes = isPortrait
      ? ['148px', '118px', '90px', '64px', '38px']
      : ['160px', '130px', '100px', '72px', '44px'];

    const renderHeatmapBars = (barSizeClass) =>
      recentActivity.slice(-30).map((d) => {
        const count = d.count || 0;
        const bgClass =
          count === 0
            ? 'bg-[#EDE9E4] dark:bg-white/[0.08]'
            : count <= 2
            ? 'bg-[#FFD0A8] dark:bg-[#FF8C42]/40'
            : count <= 5
            ? 'bg-[#FF8C42] dark:bg-[#FF6B35]/75'
            : 'bg-[#E85D04] dark:bg-[#FF8C42]';
        return (
          <div
            key={d.date}
            title={`${d.date}: ${count} actions`}
            className={`${barSizeClass} rounded-sm shrink-0 transition-colors ${bgClass}`}
          />
        );
      });

    const telemetryMetrics = [
      {
        key: 'coding',
        label: 'Coding',
        icon: Code2,
        value: stats.coding?.solved || 0,
        subtitle: (
          <span className="inline-flex items-center gap-1 font-mono">
            <span className="font-semibold text-[#E85D04] dark:text-[#FFB36B]">
              {stats.coding?.easy || 0}E
            </span>
            <span style={{ color: 'var(--pc-text-muted)' }}>/</span>
            <span className="font-semibold text-[#FF6B35] dark:text-[#FF8C42]">
              {stats.coding?.medium || 0}M
            </span>
            <span style={{ color: 'var(--pc-text-muted)' }}>/</span>
            <span className="font-semibold text-[#C2410C] dark:text-[#FF6B35]">
              {stats.coding?.hard || 0}H
            </span>
            {stats.coding?.accuracy > 0 && (
              <span style={{ color: 'var(--pc-text-muted)' }}>
                · {stats.coding.accuracy}% Acc
              </span>
            )}
          </span>
        ),
        visible: true,
      },
      {
        key: 'gate',
        label: 'GATE Prep',
        icon: Award,
        value: stats.gate?.bestScore
          ? `${stats.gate.bestScore}`
          : `${stats.gate?.testsTaken || 0}`,
        subtitle: `${stats.gate?.bestScore ? 'Best Score' : 'Mocks Taken'} · ${
          stats.gate?.accuracy || 0
        }% Accuracy`,
        visible: sections.showGate !== false,
      },
      {
        key: 'curriculum',
        label: 'Curriculum',
        icon: BookOpen,
        value: `${stats.academic?.syllabusProgress || 0}%`,
        subtitle: `${stats.academic?.subjectsEnrolled || 0} Subjects · Syllabus Tracked`,
        progress: Math.min(100, Math.max(0, stats.academic?.syllabusProgress || 0)),
        visible: true,
      },
      {
        key: 'readiness',
        label: 'Readiness',
        icon: Sparkles,
        value: stats.interviews?.averageScore
          ? `${stats.interviews.averageScore}/100`
          : `${stats.interviews?.completed || 0}`,
        subtitle: `${
          stats.interviews?.averageScore ? 'Mock Score' : 'Sessions Done'
        } · AI Evaluated`,
        visible: sections.showInterviews !== false,
      },
    ].filter((item) => item.visible);

    return (
      /* perspective wrapper */
      <div
        className={`pc-parent ${
          isPortrait
            ? 'pc-parent-portrait w-full max-w-md xl:max-w-none h-full flex flex-col'
            : 'w-full max-w-2xl'
        } ${className}`}
        style={{ perspective: '1200px' }}
      >
        {/* 3D theme-aware card body (adapts via .pc-card & .dark .pc-card CSS vars) */}
        <div
          ref={ref}
          id="engineeros-profile-card"
          data-orientation={orientation}
          className={`pc-card w-full rounded-3xl relative overflow-visible ${
            isPortrait ? 'pc-card-portrait flex-1 flex flex-col' : ''
          }`}
        >
          {/* ── Layered orange-tinted circles — upper-right motif ── */}
          <div
            className="pc-logo"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              transformStyle: 'preserve-3d',
              pointerEvents: 'none',
              zIndex: 0,
            }}
            aria-hidden="true"
          >
            <span
              className="pc-circle pc-circle1"
              style={{
                ...circleBase,
                width: ringSizes[0],
                transform: 'translate3d(0,0,15px)',
                top: '6px',
                right: '6px',
                transitionDelay: '0s',
              }}
            />
            <span
              className="pc-circle pc-circle2"
              style={{
                ...circleBase,
                width: ringSizes[1],
                transform: 'translate3d(0,0,32px)',
                top: '9px',
                right: '9px',
                transitionDelay: '0.1s',
              }}
            />
            <span
              className="pc-circle pc-circle3"
              style={{
                ...circleBase,
                width: ringSizes[2],
                transform: 'translate3d(0,0,50px)',
                top: '15px',
                right: '15px',
                transitionDelay: '0.2s',
              }}
            />
            <span
              className="pc-circle pc-circle4"
              style={{
                ...circleBase,
                width: ringSizes[3],
                transform: 'translate3d(0,0,68px)',
                top: '22px',
                right: '22px',
                transitionDelay: '0.3s',
              }}
            />
            <span
              className="pc-circle pc-circle5"
              style={{
                ...circleBase,
                width: ringSizes[4],
                transform: 'translate3d(0,0,86px)',
                top: '29px',
                right: '29px',
                transitionDelay: '0.4s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: 'var(--pc-accent)',
                  letterSpacing: '-0.5px',
                  userSelect: 'none',
                }}
              >
                OS
              </span>
            </span>
          </div>

          {/* ── Glass surface overlay ── */}
          <div style={glassStyle} aria-hidden="true" />

          {/* ═══════════════════════════════════════════════════
              CARD CONTENT — elevated via translate3d
              ═══════════════════════════════════════════════════ */}
          <div
            style={contentDepth}
            className={isPortrait ? 'flex-1 flex flex-col justify-between' : ''}
          >
            {/* ── Header bar ── */}
            <div
              className={`flex items-center justify-between px-5 border-b ${
                isPortrait ? 'py-2.5 pr-16 shrink-0' : 'py-3'
              }`}
              style={{ borderColor: 'var(--pc-border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                {theme === 'terminal' ? (
                  <>
                    <div className="flex gap-1.5 mr-2" aria-hidden="true">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E85D04] inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF8C42] inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FFB36B] inline-block" />
                    </div>
                    <TerminalIcon
                      className="w-4 h-4 shrink-0"
                      style={{ color: 'var(--pc-accent)' }}
                    />
                    <span
                      className="text-xs font-mono font-medium"
                      style={{ color: 'var(--pc-accent)' }}
                    >
                      {identity.username
                        ? `${identity.username}@engineeros:~$ id`
                        : 'engineeros:~$ whoami'}
                    </span>
                  </>
                ) : theme === 'blueprint' ? (
                  <div className="flex items-center gap-2 font-mono">
                    <span
                      className="font-bold text-xs"
                      style={{ color: 'var(--pc-accent)' }}
                    >
                      [SCHEMA // OS-CARD-V2]
                    </span>
                    <span
                      className="text-xs hidden sm:inline"
                      style={{ color: 'var(--pc-text-secondary)' }}
                    >
                      {'// SPEC: ENGINEERING PROFILE'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{
                        background: 'var(--pc-accent-bg)',
                        border: '1px solid var(--pc-border)',
                      }}
                    >
                      <Cpu
                        className="w-3.5 h-3.5"
                        style={{ color: 'var(--pc-accent)' }}
                      />
                    </div>
                    <span
                      className="text-xs font-semibold tracking-wider uppercase"
                      style={{ color: 'var(--pc-text-secondary)' }}
                    >
                      EngineerOS Certified Card
                    </span>
                  </div>
                )}
              </div>

              {/* Streak pill (kept cleanly in Identity area in portrait mode so header clears the OS rings) */}
              {!isPortrait && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-mono font-medium"
                  style={{
                    background: 'var(--pc-surface)',
                    border: '1px solid var(--pc-border)',
                    color: 'var(--pc-text-primary)',
                  }}
                >
                  <Flame
                    className="w-3.5 h-3.5"
                    style={{ color: 'var(--pc-accent)', fill: 'var(--pc-accent)' }}
                  />
                  <span>{stats.streaks?.current || 0}d streak</span>
                </span>
              )}
            </div>

            {isPortrait ? (
              /* ── Simplified Portrait Card (Photo, Student Name, Streak, Overall Progress Ring, Module Bars, QR) ── */
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center gap-3.5">
                {/* 1. Identity Row: Glowing Photo + Student Name + University/Branch + Streak */}
                <div className="flex items-center gap-3.5 pr-16">
                  {sections.showPhoto !== false ? (
                    <div className="relative shrink-0">
                      <div
                        className="rounded-full p-0.5"
                        style={{
                          border: '2px solid rgba(255, 140, 66, 0.7)',
                          boxShadow: '0 0 18px rgba(255, 107, 53, 0.25)',
                        }}
                      >
                        <Avatar
                          src={identity.avatarUrl}
                          name={identity.name}
                          size="xl"
                          className="!ring-0"
                          fallbackClassName="!bg-gradient-to-br !from-[#FF8C42] !to-[#E85D04] !text-white !ring-0"
                        />
                      </div>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 bg-[#E85D04] dark:bg-[#FF8C42] text-white rounded-full p-0.5 border-2 border-white dark:border-[#111315] shadow-sm"
                        title="Verified Engineer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0"
                      style={{
                        background: 'var(--pc-surface)',
                        color: 'var(--pc-accent)',
                        border: '1.5px solid var(--pc-border)',
                      }}
                    >
                      {identity.name?.slice(0, 2).toUpperCase() || 'OS'}
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <h2
                      className={`text-xl font-bold leading-tight truncate ${typo.titleClass}`}
                      style={{ color: 'var(--pc-text-primary)' }}
                    >
                      {identity.name || 'Engineer'}
                    </h2>

                    {sections.showUniversity !== false && (identity.branch || identity.university) && (
                      <p
                        className="text-xs flex items-center gap-1.5 truncate"
                        style={{ color: 'var(--pc-text-secondary)' }}
                      >
                        <GraduationCap
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: 'var(--pc-accent)' }}
                        />
                        <span className="truncate">
                          {[identity.branch, identity.university].filter(Boolean).join(' • ')}
                        </span>
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {identity.username && (
                        <span
                          className="text-xs font-mono font-medium"
                          style={{ color: 'var(--pc-accent)' }}
                        >
                          @{identity.username}
                        </span>
                      )}
                      <span
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold"
                        style={{
                          background: 'var(--pc-surface)',
                          border: '1px solid var(--pc-border)',
                          color: 'var(--pc-text-primary)',
                        }}
                      >
                        <Flame
                          className="w-3 h-3"
                          style={{ color: 'var(--pc-accent)', fill: 'var(--pc-accent)' }}
                        />
                        <span>{stats.streaks?.current || 0}d streak</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Overall Progress Ring + Module Bars (combined panel) */}
                <div
                  className={`pc-panel ${typo.panelRadius} px-4 py-3.5 space-y-3.5`}
                >
                  {/* Progress Ring Row */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          fill="none"
                          stroke="var(--pc-accent-bg)"
                          strokeWidth="8"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          fill="none"
                          stroke="url(#pcOverallRingGrad)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 32}
                          strokeDashoffset={
                            2 * Math.PI * 32 * (1 - Math.min(100, Math.max(0, overallProgress)) / 100)
                          }
                          className="transition-all duration-700"
                          style={{
                            filter: overallProgress > 0 ? 'drop-shadow(0 0 6px rgba(255,140,66,0.5))' : 'none',
                          }}
                        />
                        <defs>
                          <linearGradient id="pcOverallRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FF8C42" />
                            <stop offset="100%" stopColor="#E85D04" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <span
                        className="absolute text-lg font-mono font-bold tabular-nums"
                        style={{ color: 'var(--pc-text-primary)' }}
                      >
                        {overallProgress}%
                      </span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div
                        className="text-sm font-bold tracking-tight"
                        style={{ color: 'var(--pc-text-primary)' }}
                      >
                        Overall Progress
                      </div>
                      <p
                        className="text-xs italic"
                        style={{ color: 'var(--pc-accent-soft)' }}
                      >
                        {overallProgress >= 75
                          ? 'Outstanding momentum!'
                          : overallProgress >= 35
                          ? 'Keep going! Building daily.'
                          : overallProgress > 0
                          ? 'Great start! Keep pushing.'
                          : 'Solve a problem or mock to begin!'}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full" style={{ background: 'var(--pc-border)' }} />

                  {/* Module Progress Bars */}
                  <div className="space-y-2.5">
                    <div
                      className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--pc-text-secondary)' }}
                    >
                      Modules Progress
                    </div>
                  {[
                    {
                      key: 'academics',
                      label: 'Academic Hub',
                      icon: BookOpen,
                      pct: academicPct,
                      visible: true,
                    },
                    {
                      key: 'coding',
                      label: 'Coding Platform',
                      icon: Code2,
                      pct: codingPct,
                      visible: true,
                    },
                    {
                      key: 'gate',
                      label: 'GATE Hub',
                      icon: Award,
                      pct: gatePct,
                      visible: sections.showGate !== false,
                    },
                    {
                      key: 'interviews',
                      label: 'AI Readiness',
                      icon: Sparkles,
                      pct: interviewPct,
                      visible: sections.showInterviews !== false,
                    },
                  ]
                    .filter((m) => m.visible)
                    .map((mod) => {
                      const ModIcon = mod.icon;
                      return (
                        <div key={mod.key} className="flex items-center gap-2.5">
                          <ModIcon
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: 'var(--pc-accent)' }}
                          />
                          <span
                            className="text-xs font-medium w-28 truncate shrink-0"
                            style={{ color: 'var(--pc-text-secondary)' }}
                          >
                            {mod.label}
                          </span>
                          <div
                            className="flex-1 h-2 rounded-full overflow-hidden"
                            style={{ background: 'var(--pc-accent-bg)' }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${mod.pct}%`,
                                background: 'linear-gradient(90deg, #FF8C42, #E85D04)',
                                boxShadow: mod.pct > 0 ? '0 0 8px rgba(255, 140, 66, 0.35)' : 'none',
                              }}
                            />
                          </div>
                          <span
                            className="text-xs font-mono font-semibold tabular-nums w-9 text-right shrink-0"
                            style={{ color: 'var(--pc-text-primary)' }}
                          >
                            {mod.pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Landscape Body (ProfilePage & PublicProfilePage) ── */
              <div className="p-5 space-y-5">
              {/* Identity */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {sections.showPhoto !== false ? (
                    <div className="relative shrink-0">
                      <div
                        className="rounded-full p-0.5"
                        style={{
                          border: '2px solid rgba(255, 140, 66, 0.55)',
                          boxShadow: '0 0 0 3px rgba(255, 140, 66, 0.14)',
                        }}
                      >
                        <Avatar
                          src={identity.avatarUrl}
                          name={identity.name}
                          size="xl"
                          className="!ring-0"
                          fallbackClassName="!bg-gradient-to-br !from-[#FF8C42] !to-[#E85D04] !text-white !ring-0"
                        />
                      </div>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 bg-[#E85D04] dark:bg-[#FF8C42] text-white rounded-full p-0.5 border-2 border-white dark:border-[#111315] shadow-sm"
                        title="Verified Engineer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg"
                      style={{
                        background: 'var(--pc-surface)',
                        color: 'var(--pc-accent)',
                        border: '1.5px solid var(--pc-border)',
                      }}
                    >
                      {identity.name?.slice(0, 2).toUpperCase() || 'OS'}
                    </div>
                  )}

                  <div className="min-w-0">
                    {/* Name + username */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2
                        className={`text-xl font-bold ${typo.titleClass}`}
                        style={{ color: 'var(--pc-text-primary)' }}
                      >
                        {identity.name || 'Engineer'}
                      </h2>
                      {identity.username && (
                        <span
                          className="text-xs font-mono font-medium"
                          style={{ color: 'var(--pc-accent)' }}
                        >
                          @{identity.username}
                        </span>
                      )}
                    </div>

                    {/* Alumni pill */}
                    {identity.isAlumni && (
                      <div className="mt-1.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{
                            background: 'var(--pc-accent-bg)',
                            border: '1px solid var(--pc-border)',
                            color: 'var(--pc-accent-soft)',
                          }}
                        >
                          <Award className="w-3 h-3 shrink-0" />
                          Verified Alumni Mentor
                        </span>
                      </div>
                    )}

                    {/* Headline */}
                    {identity.headline && (
                      <p
                        className="text-sm mt-1 line-clamp-2 leading-snug"
                        style={{ color: 'var(--pc-text-secondary)' }}
                      >
                        {identity.headline}
                      </p>
                    )}

                    {/* University row */}
                    {sections.showUniversity !== false && identity.university && (
                      <div
                        className="flex items-center gap-2 text-xs mt-1.5 flex-wrap"
                        style={{ color: 'var(--pc-text-secondary)' }}
                      >
                        <span className="inline-flex items-center gap-1">
                          <GraduationCap
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: 'var(--pc-accent)' }}
                          />
                          {identity.university}
                        </span>
                        {identity.branch && (
                          <>
                            <span style={{ color: 'var(--pc-text-muted)' }}>•</span>
                            <span>{identity.branch}</span>
                          </>
                        )}
                        {identity.semester && (
                          <>
                            <span style={{ color: 'var(--pc-text-muted)' }}>•</span>
                            <span>Sem {identity.semester}</span>
                          </>
                        )}
                        {identity.graduationYear && (
                          <>
                            <span style={{ color: 'var(--pc-text-muted)' }}>•</span>
                            <span className="inline-flex items-center gap-0.5">
                              <Calendar
                                className="w-3 h-3"
                                style={{ color: 'var(--pc-accent)' }}
                              />
                              &apos;{String(identity.graduationYear).slice(-2)}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* GitHub handle */}
                    {identity.githubHandle && (
                      <div className="mt-2">
                        <a
                          href={`https://github.com/${identity.githubHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pc-link inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono"
                        >
                          <Github
                            className="w-3.5 h-3.5"
                            style={{ color: 'var(--pc-accent)' }}
                          />
                          <span>{identity.githubHandle}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4 Core Pillars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Coding */}
                <div className={`pc-panel ${typo.panelRadius} p-3.5`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-xs uppercase tracking-wider font-semibold"
                      style={{ color: 'var(--pc-text-secondary)' }}
                    >
                      Coding
                    </span>
                    <Code2
                      className="w-4 h-4 shrink-0"
                      style={{ color: 'var(--pc-accent)' }}
                    />
                  </div>
                  <div
                    className="text-2xl font-mono font-bold"
                    style={{ color: 'var(--pc-text-primary)' }}
                  >
                    {stats.coding?.solved || 0}
                  </div>
                  <div className="text-[11px] mt-1 flex items-center gap-1 font-mono">
                    <span className="font-semibold text-[#E85D04] dark:text-[#FFB36B]">
                      {stats.coding?.easy || 0}E
                    </span>
                    <span style={{ color: 'var(--pc-text-muted)' }}>/</span>
                    <span className="font-semibold text-[#FF6B35] dark:text-[#FF8C42]">
                      {stats.coding?.medium || 0}M
                    </span>
                    <span style={{ color: 'var(--pc-text-muted)' }}>/</span>
                    <span className="font-semibold text-[#C2410C] dark:text-[#FF6B35]">
                      {stats.coding?.hard || 0}H
                    </span>
                  </div>
                  {stats.coding?.accuracy > 0 && (
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: 'var(--pc-text-muted)' }}
                    >
                      {stats.coding.accuracy}% Accuracy
                    </div>
                  )}
                </div>

                {/* GATE */}
                {sections.showGate !== false && (
                  <div
                    className={`pc-panel ${typo.panelRadius} p-3.5`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-xs uppercase tracking-wider font-semibold"
                        style={{ color: 'var(--pc-text-secondary)' }}
                      >
                        GATE Prep
                      </span>
                      <Award
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--pc-accent)' }}
                      />
                    </div>
                    <div
                      className="text-2xl font-mono font-bold"
                      style={{ color: 'var(--pc-text-primary)' }}
                    >
                      {stats.gate?.bestScore
                        ? `${stats.gate.bestScore}`
                        : `${stats.gate?.testsTaken || 0}`}
                    </div>
                    <div
                      className="text-[11px] mt-1"
                      style={{ color: 'var(--pc-text-secondary)' }}
                    >
                      {stats.gate?.bestScore ? 'Best Score' : 'Mocks Taken'}
                    </div>
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: 'var(--pc-text-muted)' }}
                    >
                      {stats.gate?.accuracy || 0}% Accuracy
                    </div>
                  </div>
                )}

                {/* Academics / Curriculum */}
                <div
                  className={`pc-panel ${typo.panelRadius} p-3.5 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-xs uppercase tracking-wider font-semibold"
                        style={{ color: 'var(--pc-text-secondary)' }}
                      >
                        Curriculum
                      </span>
                      <BookOpen
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--pc-accent)' }}
                      />
                    </div>
                    <div
                      className="text-2xl font-mono font-bold"
                      style={{ color: 'var(--pc-text-primary)' }}
                    >
                      {stats.academic?.syllabusProgress || 0}%
                    </div>
                    <div
                      className="text-[11px] mt-1"
                      style={{ color: 'var(--pc-text-secondary)' }}
                    >
                      {stats.academic?.subjectsEnrolled || 0} Subjects
                    </div>
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: 'var(--pc-text-muted)' }}
                    >
                      Syllabus Tracked
                    </div>
                  </div>
                  <div
                    className="w-full h-1 rounded-full overflow-hidden mt-2"
                    style={{ background: 'var(--pc-accent-bg)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, stats.academic?.syllabusProgress || 0))}%`,
                        background: 'linear-gradient(90deg, #FF8C42, #E85D04)',
                      }}
                    />
                  </div>
                </div>

                {/* Interviews */}
                {sections.showInterviews !== false && (
                  <div
                    className={`pc-panel ${typo.panelRadius} p-3.5`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-xs uppercase tracking-wider font-semibold"
                        style={{ color: 'var(--pc-text-secondary)' }}
                      >
                        Readiness
                      </span>
                      <Sparkles
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--pc-accent)' }}
                      />
                    </div>
                    <div
                      className="text-2xl font-mono font-bold"
                      style={{ color: 'var(--pc-text-primary)' }}
                    >
                      {stats.interviews?.averageScore
                        ? `${stats.interviews.averageScore}/100`
                        : `${stats.interviews?.completed || 0}`}
                    </div>
                    <div
                      className="text-[11px] mt-1"
                      style={{ color: 'var(--pc-text-secondary)' }}
                    >
                      {stats.interviews?.averageScore
                        ? 'Mock Score'
                        : 'Sessions Done'}
                    </div>
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: 'var(--pc-text-muted)' }}
                    >
                      AI Evaluated
                    </div>
                  </div>
                )}
              </div>

              {/* Top Skills */}
              {sections.showSkills !== false && topSkills.length > 0 && (
                <div className="space-y-2">
                  <div
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--pc-text-secondary)' }}
                  >
                    Verified Proficiencies
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {topSkills.map(skill => (
                      <span
                        key={skill}
                        className={`text-xs px-2.5 py-1 ${typo.chipRadius} font-mono font-medium`}
                        style={{
                          background: 'var(--pc-surface-subtle)',
                          border: '1px solid var(--pc-border)',
                          color: 'var(--pc-accent-soft)',
                        }}
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
                  <div
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--pc-text-secondary)' }}
                  >
                    Earned Credentials ({badges.length})
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {badges.slice(0, compact ? 3 : 5).map(b => (
                      <div
                        key={b.badgeId || b.name}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                        style={{
                          background: 'var(--pc-surface)',
                          border: '1px solid var(--pc-border)',
                          color: 'var(--pc-text-primary)',
                        }}
                      >
                        <span className="text-sm">{b.icon || '🎖️'}</span>
                        <span className="font-medium">{b.name}</span>
                        <span
                          className="text-[10px] uppercase font-mono font-semibold"
                          style={{ color: 'var(--pc-accent)' }}
                        >
                          • {b.tier}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Heatmap — Orange monochrome progression (no green/teal) */}
              {sections.showHeatmap !== false && recentActivity.length > 0 && (
                <div className="space-y-2">
                  <div
                    className="flex items-center justify-between text-xs"
                    style={{ color: 'var(--pc-text-secondary)' }}
                  >
                    <span className="font-semibold uppercase tracking-wider">
                      Consistency Stream (Last 30 Days)
                    </span>
                    <span className="font-mono">
                      {recentActivity.reduce((acc, a) => acc + (a.count || 0), 0)} events
                    </span>
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto py-1">
                    {renderHeatmapBars('h-4 w-2.5')}
                  </div>
                </div>
              )}
              </div>
            )}

            {/* ── Footer — elevated action zone ── */}
            <div
              className={`pc-bottom flex items-center justify-between gap-3 px-5 border-t shrink-0 ${
                isPortrait ? 'py-3' : 'py-4'
              }`}
              style={{
                borderColor: 'var(--pc-border-subtle)',
                transformStyle: 'preserve-3d',
                transform: 'translate3d(0,0,0)',
                transition: 'transform 0.5s ease-in-out',
              }}
            >
              <div className="flex items-center gap-3">
                {/* EngineerOS emblem */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                  style={{
                    background: 'var(--pc-accent-bg)',
                    border: '1px solid var(--pc-border)',
                    color: 'var(--pc-accent)',
                  }}
                >
                  OS
                </div>
                <div>
                  <div
                    className="text-xs font-semibold tracking-wide"
                    style={{ color: 'var(--pc-text-primary)' }}
                  >
                    EngineerOS Authentic Card
                  </div>
                  <div
                    className="text-[11px] font-mono"
                    style={{ color: 'var(--pc-text-secondary)' }}
                  >
                    engineeros.dev/u/{identity.username || 'user'}
                  </div>
                </div>
              </div>

              {/* QR Code — crisp white backing with subtle orange accent border */}
              {showQrCode && (
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className="p-1.5 bg-white rounded-lg shadow-sm"
                    style={{
                      border: '1.5px solid var(--pc-border)',
                    }}
                  >
                    <QRCodeSVG
                      value={profileUrl}
                      size={isPortrait ? 38 : 40}
                      level="M"
                      bgColor="#FFFFFF"
                      fgColor="#111315"
                      includeMargin={false}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;
