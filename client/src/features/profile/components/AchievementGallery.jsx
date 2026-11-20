import { useState } from 'react';
import {
  Lock,
  Trophy,
  Flame,
  Zap,
  Crown,
  Monitor,
  Sword,
  Target,
  Award as AwardIcon,
  Shield,
  GraduationCap,
  Handshake,
  Medal,
  BookOpen,
  Users,
} from 'lucide-react';
import { BADGE_CATALOGUE } from './badgeCatalogueClient.js';
import { Modal } from '../../../components/Modal.jsx';
import { useTheme } from '../../../context/ThemeContext.jsx';

/* ═══════════════════════════════════════════════════════════════════════
   TIER PALETTES — each tier has a distinct metallic finish
   ═══════════════════════════════════════════════════════════════════════ */
const TIER_CONFIG = {
  bronze: {
    label: 'Bronze',
    glow: 'shadow-orange-900/40',
    glowHover: 'group-hover:shadow-orange-700/50',
    accent: 'text-amber-500',
    accentBg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
    iconColor: '#d97706',
    iconColorLight: '#b45309',
    ringColor: 'ring-amber-500/30',
    // SVG gradient stops — dark theme
    borderStart: '#c2410c',
    borderMid: '#fb923c',
    borderEnd: '#c2410c',
    fillCenter: '#431407',
    fillEdge: '#1c1917',
    shimmerColor: '#fb923c',
    // SVG gradient stops — light theme
    fillCenterLight: '#fff7ed',
    fillEdgeLight: '#fed7aa',
    shimmerColorLight: '#f97316',
    borderStartLight: '#ea580c',
    borderMidLight: '#fdba74',
    borderEndLight: '#ea580c',
  },
  silver: {
    label: 'Silver',
    glow: 'shadow-slate-500/30',
    glowHover: 'group-hover:shadow-slate-400/50',
    accent: 'text-slate-300',
    accentBg: 'bg-slate-400/10 border-slate-400/20 text-slate-400',
    iconColor: '#94a3b8',
    iconColorLight: '#64748b',
    ringColor: 'ring-slate-400/30',
    borderStart: '#94a3b8',
    borderMid: '#e2e8f0',
    borderEnd: '#94a3b8',
    fillCenter: '#1e293b',
    fillEdge: '#0f172a',
    shimmerColor: '#cbd5e1',
    fillCenterLight: '#f8fafc',
    fillEdgeLight: '#e2e8f0',
    shimmerColorLight: '#94a3b8',
    borderStartLight: '#64748b',
    borderMidLight: '#cbd5e1',
    borderEndLight: '#64748b',
  },
  gold: {
    label: 'Gold',
    glow: 'shadow-amber-500/40',
    glowHover: 'group-hover:shadow-amber-400/60',
    accent: 'text-amber-400',
    accentBg: 'bg-amber-400/10 border-amber-400/20 text-amber-400',
    iconColor: '#fbbf24',
    iconColorLight: '#d97706',
    ringColor: 'ring-amber-400/30',
    borderStart: '#d97706',
    borderMid: '#fbbf24',
    borderEnd: '#d97706',
    fillCenter: '#451a03',
    fillEdge: '#1c1917',
    shimmerColor: '#fbbf24',
    fillCenterLight: '#fffbeb',
    fillEdgeLight: '#fef3c7',
    shimmerColorLight: '#f59e0b',
    borderStartLight: '#b45309',
    borderMidLight: '#fcd34d',
    borderEndLight: '#b45309',
  },
  platinum: {
    label: 'Platinum',
    glow: 'shadow-cyan-500/40',
    glowHover: 'group-hover:shadow-cyan-400/60',
    accent: 'text-cyan-400',
    accentBg: 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400',
    iconColor: '#22d3ee',
    iconColorLight: '#0891b2',
    ringColor: 'ring-cyan-400/30',
    borderStart: '#22d3ee',
    borderMid: '#a5f3fc',
    borderEnd: '#22d3ee',
    fillCenter: '#083344',
    fillEdge: '#042f2e',
    shimmerColor: '#67e8f9',
    fillCenterLight: '#ecfeff',
    fillEdgeLight: '#cffafe',
    shimmerColorLight: '#06b6d4',
    borderStartLight: '#0891b2',
    borderMidLight: '#67e8f9',
    borderEndLight: '#0891b2',
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   BADGE ICON MAP — distinctive Lucide icons for each badge
   ═══════════════════════════════════════════════════════════════════════ */
const BADGE_ICONS = {
  streak_7: Flame,
  streak_30: Zap,
  streak_100: Crown,
  coding_first: Monitor,
  coding_25: Sword,
  coding_50: Target,
  coding_100: Trophy,
  gate_debut: BookOpen,
  gate_veteran: Shield,
  interview_first: Users,
  community_helper: Handshake,
  academic_master: GraduationCap,
  alumni_verified: Medal,
};

// Locked / disabled palette
const LOCKED_COLORS = {
  borderStart: '#374151',
  borderMid: '#4b5563',
  borderEnd: '#374151',
  fillCenter: '#111827',
  fillEdge: '#030712',
  shimmerColor: '#374151',
  borderStartLight: '#9ca3af',
  borderMidLight: '#d1d5db',
  borderEndLight: '#9ca3af',
  fillCenterLight: '#f1f5f9',
  fillEdgeLight: '#e2e8f0',
  shimmerColorLight: '#9ca3af',
};

/* ═══════════════════════════════════════════════════════════════════════
   HEXAGONAL SVG BADGE — theme‑aware core visual component
   ═══════════════════════════════════════════════════════════════════════ */
const HexBadge = ({ badgeId, tier, isUnlocked, className = '' }) => {
  const { isDark } = useTheme();
  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  const IconComponent = BADGE_ICONS[badgeId] || AwardIcon;
  const c = isUnlocked ? tierCfg : LOCKED_COLORS;

  // Pick palette based on theme
  const borderStart = isDark ? c.borderStart : c.borderStartLight;
  const borderMid = isDark ? c.borderMid : c.borderMidLight;
  const borderEnd = isDark ? c.borderEnd : c.borderEndLight;
  const fillCenter = isDark ? c.fillCenter : c.fillCenterLight;
  const fillEdge = isDark ? c.fillEdge : c.fillEdgeLight;
  const shimmerColor = isDark ? c.shimmerColor : c.shimmerColorLight;
  const iconColor = isDark
    ? (isUnlocked ? tierCfg.iconColor : '#6b7280')
    : (isUnlocked ? tierCfg.iconColorLight : '#9ca3af');

  // Hexagonal coordinates (pointy-top hexagon)
  const hexPoints = '50,2 93,25 93,75 50,98 7,75 7,25';
  const hexInner = '50,6 89,27 89,73 50,94 11,73 11,27';
  const hexInnermost = '50,14 82,32 82,68 50,86 18,68 18,32';

  // Unique ids scoped to this badge + theme to avoid SVG collisions
  const uid = `${badgeId}-${isDark ? 'd' : 'l'}`;

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-lg"
        style={{
          filter: isUnlocked ? undefined : 'saturate(0.15) brightness(0.5)',
        }}
      >
        <defs>
          {/* Metallic gradient for the border */}
          <linearGradient id={`border-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={borderStart} />
            <stop offset="50%" stopColor={borderMid} />
            <stop offset="100%" stopColor={borderEnd} />
          </linearGradient>
          {/* Interior radial gradient */}
          <radialGradient id={`fill-${uid}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={fillCenter} stopOpacity="0.95" />
            <stop offset="100%" stopColor={fillEdge} stopOpacity="1" />
          </radialGradient>
          {/* Subtle inner shimmer */}
          <radialGradient id={`shimmer-${uid}`} cx="35%" cy="30%" r="45%">
            <stop offset="0%" stopColor={shimmerColor} stopOpacity={isDark ? '0.08' : '0.15'} />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer hex border */}
        <polygon points={hexPoints} fill={`url(#border-${uid})`} />
        {/* Inner hex fill */}
        <polygon points={hexInner} fill={`url(#fill-${uid})`} />
        {/* Inner shimmer overlay */}
        <polygon points={hexInner} fill={`url(#shimmer-${uid})`} />

        {/* Subtle hexagonal inner ring */}
        <polygon
          points={hexInnermost}
          fill="none"
          stroke={isUnlocked ? borderMid : (isDark ? '#374151' : '#d1d5db')}
          strokeWidth="0.4"
          strokeOpacity={isUnlocked ? '0.25' : '0.1'}
        />
      </svg>

      {/* Icon overlay — centered on the hex */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '4%' }}>
        {isUnlocked ? (
          <IconComponent
            className="w-[32%] h-[32%]"
            strokeWidth={1.5}
            style={{ color: iconColor }}
          />
        ) : (
          <Lock
            className="w-[24%] h-[24%]"
            strokeWidth={1.5}
            style={{ color: iconColor }}
          />
        )}
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════════
   ACHIEVEMENT BADGE CARD — hex badge + name + tier underneath
   ═══════════════════════════════════════════════════════════════════════ */
const AchievementBadgeCard = ({ badge, isUnlocked, onClick }) => {
  const tierCfg = TIER_CONFIG[badge.tier] || TIER_CONFIG.bronze;

  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl
        transition-all duration-300 ease-out cursor-pointer
        focus:outline-none focus-visible:ring-2 ${tierCfg.ringColor} focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
        ${isUnlocked
          ? `bg-surface-900/40 hover:bg-surface-800/60 border border-surface-700/40 hover:border-surface-600/60 shadow-lg ${tierCfg.glow} ${tierCfg.glowHover} hover:shadow-xl hover:-translate-y-1`
          : 'bg-surface-900/20 border border-surface-800/30 hover:bg-surface-900/30 opacity-60 hover:opacity-80'
        }`}
      aria-label={`${badge.name} — ${isUnlocked ? 'Unlocked' : 'Locked'} ${tierCfg.label} badge`}
    >
      {/* Hex Badge Visual */}
      <div className={`w-20 h-20 sm:w-24 sm:h-24 transition-transform duration-300 ${isUnlocked ? 'group-hover:scale-110' : 'group-hover:scale-105'}`}>
        <HexBadge
          badgeId={badge.badgeId}
          tier={badge.tier}
          isUnlocked={isUnlocked}
        />
      </div>

      {/* Badge Name */}
      <span className={`text-[11px] sm:text-xs font-semibold text-center leading-tight
        ${isUnlocked ? 'text-surface-100' : 'text-surface-500'}`}
      >
        {badge.name}
      </span>

      {/* Tier Pill */}
      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border
        ${isUnlocked ? tierCfg.accentBg : 'bg-surface-800/40 border-surface-700/30 text-surface-500'}`}
      >
        {tierCfg.label}
      </span>
    </button>
  );
};


/* ═══════════════════════════════════════════════════════════════════════
   BADGE DETAIL MODAL — shown when user clicks a badge
   ═══════════════════════════════════════════════════════════════════════ */
const BadgeDetailModal = ({ badge, isUnlocked, earnedDate, isOpen, onClose }) => {
  if (!badge) return null;
  const tierCfg = TIER_CONFIG[badge.tier] || TIER_CONFIG.bronze;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <div className="flex flex-col items-center gap-4 py-2">
        {/* Large hex badge */}
        <div className="w-32 h-32 sm:w-40 sm:h-40">
          <HexBadge
            badgeId={badge.badgeId}
            tier={badge.tier}
            isUnlocked={isUnlocked}
          />
        </div>

        {/* Badge Name */}
        <h3 className={`text-lg font-bold tracking-tight text-center
          ${isUnlocked ? 'text-surface-100' : 'text-surface-400'}`}
        >
          {badge.name}
        </h3>

        {/* Tier pill */}
        <span className={`text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border ${tierCfg.accentBg}`}>
          {tierCfg.label} Tier
        </span>

        {/* Description */}
        <p className="text-xs text-surface-400 text-center leading-relaxed max-w-xs">
          {badge.description}
        </p>

        {/* Category */}
        <div className="text-[10px] font-mono uppercase tracking-wider text-surface-500">
          {badge.category}
        </div>

        {/* Status */}
        {isUnlocked ? (
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Unlocked</span>
            {earnedDate && (
              <>
                <span className="text-emerald-500/40">•</span>
                <span className="text-[10px] font-mono text-emerald-400/80">
                  {new Date(earnedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-surface-500 bg-surface-800/40 border border-surface-700/30 px-3 py-1.5 rounded-xl">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Locked</span>
          </div>
        )}
      </div>
    </Modal>
  );
};


/* ═══════════════════════════════════════════════════════════════════════
   ACHIEVEMENT GALLERY — the main exported component
   ═══════════════════════════════════════════════════════════════════════ */
export const AchievementGallery = ({ earnedBadges = [] }) => {
  const [selectedBadge, setSelectedBadge] = useState(null);

  // Build a map of earned badges for quick lookup
  const earnedMap = new Map();
  earnedBadges.forEach(b => {
    earnedMap.set(b.badgeId, b);
  });

  // Merge catalogue with earned state
  const allBadges = BADGE_CATALOGUE.map(catalogueBadge => {
    const earned = earnedMap.get(catalogueBadge.badgeId);
    return {
      ...catalogueBadge,
      isUnlocked: Boolean(earned),
      earnedDate: earned?.earnedAt || null,
    };
  });

  // Sort: unlocked first, then by tier weight
  const tierWeight = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  const sorted = [...allBadges].sort((a, b) => {
    if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
    return (tierWeight[a.tier] ?? 4) - (tierWeight[b.tier] ?? 4);
  });

  const unlocked = sorted.filter(b => b.isUnlocked);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-surface-100 tracking-tight">
              Achievement Vault
            </h2>
            <p className="text-xs text-surface-400 mt-0.5">
              {unlocked.length} of {allBadges.length} badges unlocked
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-32 h-2 rounded-full bg-surface-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
              style={{ width: `${allBadges.length > 0 ? (unlocked.length / allBadges.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-surface-400">
            {allBadges.length > 0 ? Math.round((unlocked.length / allBadges.length) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
        {sorted.map(badge => (
          <AchievementBadgeCard
            key={badge.badgeId}
            badge={badge}
            isUnlocked={badge.isUnlocked}
            earnedDate={badge.earnedDate}
            onClick={() => setSelectedBadge(badge)}
          />
        ))}
      </div>

      {/* Detail Modal */}
      <BadgeDetailModal
        badge={selectedBadge}
        isUnlocked={selectedBadge?.isUnlocked}
        earnedDate={selectedBadge?.earnedDate}
        isOpen={Boolean(selectedBadge)}
        onClose={() => setSelectedBadge(null)}
      />
    </div>
  );
};

export default AchievementGallery;
