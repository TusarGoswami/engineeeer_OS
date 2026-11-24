/*
 * From Uiverse.io by Smit-Prajapati — https://uiverse.io/Smit-Prajapati/smart-liger-5
 * MIT License, Copyright (c) Smit-Prajapati (Smit Prajapati)
 *
 * Adapted for EngineerOS — dark engineering dashboard aesthetic,
 * orange accent palette, full profile data integration.
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

/* ── Per-theme inner styling (colours only — 3D wrapper is universal) ── */
const THEME_STYLES = {
  terminal: {
    circleAccent: 'rgba(16,185,129,0.15)',
    circleBorder: 'rgba(16,185,129,0.3)',
    cardBg: 'linear-gradient(135deg,#0B0D11 0%,#101319 60%,#0f1a14 100%)',
    glassOverlay: 'linear-gradient(160deg,rgba(16,185,129,0.06) 0%,rgba(16,185,129,0.01) 100%)',
    glassBorder: 'rgba(16,185,129,0.15)',
    shadowColor: 'rgba(16,185,129,0.12)',
    hoverShadow: 'rgba(16,185,129,0.2)',
    btnBg: 'rgba(16,185,129,0.12)',
    btnBorder: 'rgba(16,185,129,0.3)',
    btnColor: '#6ee7b7',
    cardTitle: 'text-emerald-300 font-mono',
    subtext: 'text-emerald-500/70',
    panel: 'bg-[#151922] border border-emerald-500/20 rounded-lg p-3.5',
    metricVal: 'text-emerald-300 font-bold',
    metricLabel: 'text-emerald-500/80 text-xs uppercase tracking-wider',
    chip: 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30',
    badgeBorder: 'border border-emerald-500/40 bg-emerald-950/60',
    headerText: 'text-emerald-400',
  },
  minimalist: {
    circleAccent: 'rgba(100,116,139,0.12)',
    circleBorder: 'rgba(100,116,139,0.25)',
    cardBg: 'linear-gradient(135deg,#0B0D11 0%,#101319 100%)',
    glassOverlay: 'linear-gradient(160deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.01) 100%)',
    glassBorder: 'rgba(255,255,255,0.08)',
    shadowColor: 'rgba(0,0,0,0.3)',
    hoverShadow: 'rgba(0,0,0,0.5)',
    btnBg: 'rgba(255,255,255,0.06)',
    btnBorder: 'rgba(255,255,255,0.12)',
    btnColor: '#e2e8f0',
    cardTitle: 'text-white font-semibold tracking-tight',
    subtext: 'text-surface-400',
    panel: 'bg-[#151922] border border-[#292E38] rounded-lg p-3.5',
    metricVal: 'text-white font-mono font-bold',
    metricLabel: 'text-surface-400 text-xs tracking-wider uppercase',
    chip: 'bg-[#1B202A] text-surface-200 border border-[#292E38]',
    badgeBorder: 'border border-[#292E38] bg-[#1B202A]',
    headerText: 'text-surface-300',
  },
  silicon: {
    circleAccent: 'rgba(255,101,0,0.14)',
    circleBorder: 'rgba(255,101,0,0.3)',
    cardBg: 'linear-gradient(135deg,#0B0D11 0%,#151922 55%,#1a1208 100%)',
    glassOverlay: 'linear-gradient(160deg,rgba(255,101,0,0.07) 0%,rgba(255,101,0,0.01) 100%)',
    glassBorder: 'rgba(255,101,0,0.2)',
    shadowColor: 'rgba(255,101,0,0.15)',
    hoverShadow: 'rgba(255,101,0,0.25)',
    btnBg: 'rgba(255,101,0,0.1)',
    btnBorder: 'rgba(255,101,0,0.3)',
    btnColor: '#fb923c',
    cardTitle: 'text-transparent bg-clip-text bg-gradient-to-r from-[#FF6500] via-amber-400 to-[#38BDF8] font-bold tracking-tight',
    subtext: 'text-[#A1A1AA]',
    panel: 'bg-[#151922] border border-[#292E38] rounded-xl p-3.5',
    metricVal: 'text-orange-200 font-mono font-bold',
    metricLabel: 'text-orange-400/80 text-xs uppercase tracking-wider',
    chip: 'bg-orange-950/40 text-orange-300 border border-orange-500/30',
    badgeBorder: 'border border-orange-500/40 bg-[#1B202A]',
    headerText: 'text-orange-300',
  },
  varsity: {
    circleAccent: 'rgba(217,119,6,0.14)',
    circleBorder: 'rgba(217,119,6,0.3)',
    cardBg: 'linear-gradient(135deg,#0B0D11 0%,#101319 60%,#1a1508 100%)',
    glassOverlay: 'linear-gradient(160deg,rgba(217,119,6,0.07) 0%,rgba(217,119,6,0.01) 100%)',
    glassBorder: 'rgba(217,119,6,0.2)',
    shadowColor: 'rgba(217,119,6,0.12)',
    hoverShadow: 'rgba(217,119,6,0.22)',
    btnBg: 'rgba(217,119,6,0.1)',
    btnBorder: 'rgba(217,119,6,0.3)',
    btnColor: '#fcd34d',
    cardTitle: 'text-amber-300 font-serif font-bold tracking-wide',
    subtext: 'text-amber-200/70',
    panel: 'bg-[#151922] border border-amber-500/20 rounded-xl p-3.5',
    metricVal: 'text-amber-200 font-mono font-bold',
    metricLabel: 'text-amber-400/80 text-xs uppercase tracking-wider font-semibold',
    chip: 'bg-amber-950/60 text-amber-300 border border-amber-500/30',
    badgeBorder: 'border border-amber-500/50 bg-amber-950/40',
    headerText: 'text-amber-300',
  },
  blueprint: {
    circleAccent: 'rgba(6,182,212,0.12)',
    circleBorder: 'rgba(6,182,212,0.28)',
    cardBg: 'linear-gradient(135deg,#0B0D11 0%,#101319 100%)',
    glassOverlay: 'linear-gradient(160deg,rgba(6,182,212,0.06) 0%,rgba(6,182,212,0.01) 100%)',
    glassBorder: 'rgba(6,182,212,0.18)',
    shadowColor: 'rgba(6,182,212,0.1)',
    hoverShadow: 'rgba(6,182,212,0.2)',
    btnBg: 'rgba(6,182,212,0.08)',
    btnBorder: 'rgba(6,182,212,0.25)',
    btnColor: '#67e8f9',
    cardTitle: 'text-cyan-300 font-mono font-bold uppercase tracking-widest',
    subtext: 'text-cyan-400/70',
    panel: 'bg-[#151922] border border-cyan-500/30 p-3.5',
    metricVal: 'text-cyan-100 font-mono font-bold',
    metricLabel: 'text-cyan-400/80 text-xs uppercase tracking-wider',
    chip: 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40',
    badgeBorder: 'border border-cyan-500/50 bg-cyan-950/60',
    headerText: 'text-cyan-300',
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

    /* ── Avatar resolution ── */
    const resolvedAvatarKey =
      profile.identity?.avatarKey ||
      profile.avatarKey ||
      profile.user?.avatarKey ||
      '';

    const rawAvatarUrl =
      profile.identity?.avatarUrl ||
      profile.avatarUrl ||
      profile.profile?.avatarUrl ||
      profile.user?.profile?.avatarUrl ||
      (resolvedAvatarKey
        ? `/api/v1/users/avatar/${encodeURIComponent(resolvedAvatarKey)}`
        : '');

    const avatarVersion =
      profile.identity?.avatarVersion ||
      profile.avatarVersion ||
      profile.user?.avatarVersion ||
      1;

    const avatarUrl = rawAvatarUrl
      ? rawAvatarUrl.includes('?')
        ? `${rawAvatarUrl}&v=${avatarVersion}`
        : `${rawAvatarUrl}?v=${avatarVersion}`
      : '';

    /* ── Identity ── */
    const identity = {
      name:
        profile.identity?.name || profile.name || profile.user?.name || '',
      username:
        profile.identity?.username ||
        profile.username ||
        profile.user?.username ||
        '',
      headline:
        profile.identity?.headline || profile.headline || '',
      university:
        profile.identity?.university ||
        profile.university ||
        profile.user?.university ||
        '',
      branch:
        profile.identity?.branch ||
        profile.branch ||
        profile.user?.branch ||
        '',
      semester:
        profile.identity?.semester ||
        profile.semester ||
        profile.user?.semester ||
        1,
      graduationYear:
        profile.identity?.graduationYear ||
        profile.graduationYear ||
        profile.profile?.graduationYear ||
        profile.user?.profile?.graduationYear,
      avatarUrl,
      avatarKey: resolvedAvatarKey,
      githubHandle:
        profile.identity?.githubHandle ||
        profile.githubHandle ||
        profile.profile?.githubHandle ||
        profile.user?.profile?.githubHandle ||
        '',
      isAlumni:
        profile.isAlumni ??
        profile.identity?.isAlumni ??
        profile.user?.isAlumni ??
        false,
    };

    /* ── Stats ── */
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

    /* ── QR code URL ── */
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://engineeros.dev';
    const profileUrl = `${baseUrl}/u/${identity.username || 'user'}${
      profile.shareToken ? `?token=${profile.shareToken}` : ''
    }`;

    /* ── Theme styles ── */
    const ts = THEME_STYLES[theme] || THEME_STYLES.terminal;

    /* ── Inline 3D card styles (from Uiverse reference, adapted) ── */
    const cardStyle = {
      background: ts.cardBg,
      boxShadow: `${ts.shadowColor} 40px 50px 25px -40px, ${ts.shadowColor} 0px 25px 25px -5px`,
      transition: 'all 0.5s ease-in-out',
      transformStyle: 'preserve-3d',
    };

    const glassStyle = {
      transformStyle: 'preserve-3d',
      position: 'absolute',
      inset: '8px',
      borderRadius: '22px',
      borderTop: `1.5px solid ${ts.glassBorder}`,
      borderLeft: `1.5px solid ${ts.glassBorder}`,
      background: ts.glassOverlay,
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      transform: 'translate3d(0,0,20px)',
      pointerEvents: 'none',
      zIndex: 1,
    };

    /* Five layered circles — upper-right corner logo */
    const circleBase = {
      display: 'block',
      position: 'absolute',
      aspectRatio: '1',
      borderRadius: '50%',
      top: 0,
      right: 0,
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      background: ts.circleAccent,
      border: `1px solid ${ts.circleBorder}`,
      boxShadow: `rgba(0,0,0,0.25) -8px 8px 16px 0px`,
      transition: 'all 0.5s ease-in-out',
    };

    /* ── Rendered content depth layer ── */
    const contentDepth = {
      transformStyle: 'preserve-3d',
      transform: 'translate3d(0,0,55px)',
      position: 'relative',
      zIndex: 2,
    };

    return (
      /* perspective wrapper — same role as .parent in Uiverse */
      <div
        className={`pc-parent w-full max-w-2xl ${className}`}
        style={{ perspective: '1200px' }}
      >
        {/* 3D card body — self-contained dark showcase card across both site themes */}
        <div
          ref={ref}
          id="engineeros-profile-card"
          className="pc-card w-full rounded-3xl relative overflow-visible text-[#F4F4F5]"
          style={cardStyle}
        >
          {/* ── Layered glass circles — upper-right logo motif ── */}
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
            {/* circle 1 — outermost */}
            <span
              className="pc-circle pc-circle1"
              style={{
                ...circleBase,
                width: '160px',
                transform: 'translate3d(0,0,15px)',
                top: '6px',
                right: '6px',
                transitionDelay: '0s',
              }}
            />
            {/* circle 2 */}
            <span
              className="pc-circle pc-circle2"
              style={{
                ...circleBase,
                width: '130px',
                transform: 'translate3d(0,0,32px)',
                top: '9px',
                right: '9px',
                transitionDelay: '0.1s',
              }}
            />
            {/* circle 3 */}
            <span
              className="pc-circle pc-circle3"
              style={{
                ...circleBase,
                width: '100px',
                transform: 'translate3d(0,0,50px)',
                top: '15px',
                right: '15px',
                transitionDelay: '0.2s',
              }}
            />
            {/* circle 4 */}
            <span
              className="pc-circle pc-circle4"
              style={{
                ...circleBase,
                width: '72px',
                transform: 'translate3d(0,0,68px)',
                top: '22px',
                right: '22px',
                transitionDelay: '0.3s',
              }}
            />
            {/* circle 5 — innermost, holds OS emblem */}
            <span
              className="pc-circle pc-circle5"
              style={{
                ...circleBase,
                width: '44px',
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
                  color: ts.btnColor,
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
          <div style={contentDepth}>
            {/* ── Header bar ── */}
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: ts.glassBorder }}
            >
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
                      {identity.username
                        ? `${identity.username}@engineeros:~$ id`
                        : 'engineeros:~$ whoami'}
                    </span>
                  </>
                ) : theme === 'blueprint' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-500 font-bold text-xs">
                      [SCHEMA // OS-CARD-V2]
                    </span>
                    <span className="text-xs text-cyan-400/60">
                      {'// SPEC: ENGINEERING PROFILE'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{
                        background: ts.btnBg,
                        border: `1px solid ${ts.btnBorder}`,
                      }}
                    >
                      <Cpu className="w-3.5 h-3.5" style={{ color: ts.btnColor }} />
                    </div>
                    <span className="text-xs font-semibold tracking-wider uppercase text-[#A1A1AA]">
                      EngineerOS Certified Card
                    </span>
                  </div>
                )}
              </div>

              {/* Streak pill */}
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-mono bg-[#101319]/90 border border-[#292E38] text-[#D4D4D8]">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{stats.streaks?.current || 0}d streak</span>
              </span>
            </div>

            {/* ── Body ── */}
            <div className="p-5 space-y-5">
              {/* Identity */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {sections.showPhoto !== false ? (
                    <div className="relative shrink-0">
                      <Avatar
                        src={identity.avatarUrl}
                        name={identity.name}
                        size="xl"
                        className="border-2 border-[#292E38] shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-[#0B0D11]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#1B202A] flex items-center justify-center font-bold text-[#D4D4D8] text-lg border border-[#292E38]">
                      {identity.name?.slice(0, 2).toUpperCase() || 'OS'}
                    </div>
                  )}

                  <div className="min-w-0">
                    {/* Name + username */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className={`text-xl font-bold ${ts.cardTitle}`}>
                        {identity.name || 'Engineer'}
                      </h2>
                      {identity.username && (
                        <span className={`text-xs font-mono ${ts.subtext}`}>
                          @{identity.username}
                        </span>
                      )}
                    </div>

                    {/* Alumni pill */}
                    {identity.isAlumni && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          🎖️ Verified Alumni Mentor
                        </span>
                      </div>
                    )}

                    {/* Headline */}
                    {identity.headline && (
                      <p className={`text-sm mt-0.5 line-clamp-2 ${ts.subtext}`}>
                        {identity.headline}
                      </p>
                    )}

                    {/* University row */}
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

                    {/* GitHub handle */}
                    {identity.githubHandle && (
                      <div className="mt-2">
                        <a
                          href={`https://github.com/${identity.githubHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#292E38] bg-[#101319]/90 px-2.5 py-1 text-xs font-mono text-[#E4E4E7] transition-colors hover:border-[#3F4450] hover:text-white"
                        >
                          <Github className="w-3.5 h-3.5" />
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
                <div className={ts.panel}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={ts.metricLabel}>Coding</span>
                    <Code2 className="w-4 h-4 opacity-70" />
                  </div>
                  <div className={`text-2xl ${ts.metricVal}`}>
                    {stats.coding?.solved || 0}
                  </div>
                  <div className="text-[11px] opacity-75 mt-1 flex items-center gap-1">
                    <span className="text-emerald-400 font-semibold">
                      {stats.coding?.easy || 0}E
                    </span>
                    <span>/</span>
                    <span className="text-amber-400 font-semibold">
                      {stats.coding?.medium || 0}M
                    </span>
                    <span>/</span>
                    <span className="text-rose-400 font-semibold">
                      {stats.coding?.hard || 0}H
                    </span>
                  </div>
                  {stats.coding?.accuracy > 0 && (
                    <div className="text-[10px] opacity-60 mt-0.5">
                      {stats.coding.accuracy}% Accuracy
                    </div>
                  )}
                </div>

                {/* GATE */}
                {sections.showGate !== false && (
                  <div className={ts.panel}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={ts.metricLabel}>GATE Prep</span>
                      <Award className="w-4 h-4 opacity-70" />
                    </div>
                    <div className={`text-2xl ${ts.metricVal}`}>
                      {stats.gate?.bestScore
                        ? `${stats.gate.bestScore}`
                        : `${stats.gate?.testsTaken || 0}`}
                    </div>
                    <div className="text-[11px] opacity-75 mt-1">
                      {stats.gate?.bestScore ? 'Best Score' : 'Mocks Taken'}
                    </div>
                    <div className="text-[10px] opacity-60 mt-0.5">
                      {stats.gate?.accuracy || 0}% Accuracy
                    </div>
                  </div>
                )}

                {/* Academics */}
                <div className={ts.panel}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={ts.metricLabel}>Curriculum</span>
                    <BookOpen className="w-4 h-4 opacity-70" />
                  </div>
                  <div className={`text-2xl ${ts.metricVal}`}>
                    {stats.academic?.syllabusProgress || 0}%
                  </div>
                  <div className="text-[11px] opacity-75 mt-1">
                    {stats.academic?.subjectsEnrolled || 0} Subjects
                  </div>
                  <div className="text-[10px] opacity-60 mt-0.5">
                    Syllabus Tracked
                  </div>
                </div>

                {/* Interviews */}
                {sections.showInterviews !== false && (
                  <div className={ts.panel}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={ts.metricLabel}>Readiness</span>
                      <Sparkles className="w-4 h-4 opacity-70" />
                    </div>
                    <div className={`text-2xl ${ts.metricVal}`}>
                      {stats.interviews?.averageScore
                        ? `${stats.interviews.averageScore}/100`
                        : `${stats.interviews?.completed || 0}`}
                    </div>
                    <div className="text-[11px] opacity-75 mt-1">
                      {stats.interviews?.averageScore
                        ? 'Mock Score'
                        : 'Sessions Done'}
                    </div>
                    <div className="text-[10px] opacity-60 mt-0.5">
                      AI Evaluated
                    </div>
                  </div>
                )}
              </div>

              {/* Top Skills */}
              {sections.showSkills !== false && topSkills.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider opacity-70">
                    Verified Proficiencies
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {topSkills.map(skill => (
                      <span
                        key={skill}
                        className={`text-xs px-2.5 py-1 rounded-md font-mono ${ts.chip}`}
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
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${ts.badgeBorder}`}
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

              {/* Activity Heatmap */}
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
                          ? 'bg-[#292E38]/50'
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

            {/* ── Footer — elevated action buttons (Uiverse .bottom equivalent) ── */}
            <div
              className="pc-bottom flex items-center justify-between px-5 py-4 border-t"
              style={{
                borderColor: ts.glassBorder,
                transformStyle: 'preserve-3d',
                transform: 'translate3d(0,0,0)',
                transition: 'transform 0.5s ease-in-out',
              }}
            >
              <div className="flex items-center gap-3">
                {/* EngineerOS emblem */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                  style={{
                    background: ts.btnBg,
                    border: `1px solid ${ts.btnBorder}`,
                  }}
                >
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

              {/* QR Code */}
              {showQrCode && (
                <div className="flex items-center gap-2 shrink-0">
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
        </div>
      </div>
    );
  }
);

ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;
