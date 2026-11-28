import { useState } from 'react';
import { Trophy, Lock } from 'lucide-react';
import { Modal, ProgressBar } from '../../../components/index.js';
import { AchievementBadge } from './AchievementBadge.jsx';
import {
  BADGE_CATALOGUE,
  LOCKED_METAL_THEME,
  METAL_THEMES,
} from './badgeCatalogueClient.js';

const TIER_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

const TIER_FALLBACK_METAL = {
  platinum: 'platinum',
  gold: 'gold',
  silver: 'silver',
  bronze: 'bronze',
};

const resolveCardTheme = (badge, isUnlocked) => {
  if (!isUnlocked) {
    return {
      ...LOCKED_METAL_THEME,
      tierPillClass:
        'bg-surface-800/50 dark:bg-surface-800/60 border-surface-700/80 text-surface-400',
    };
  }
  const key = badge.metalTheme || TIER_FALLBACK_METAL[badge.tier] || 'orange';
  return METAL_THEMES[key] || METAL_THEMES.orange;
};

/**
 * Individual achievement vault card hosting the 3D rotating hexagonal medallion.
 */
const AchievementBadgeCard = ({ badge, isUnlocked, onClick }) => {
  const metalCfg = resolveCardTheme(badge, isUnlocked);
  const tierLabel = TIER_LABELS[badge.tier] || TIER_LABELS.bronze;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${badge.name} — ${isUnlocked ? 'Unlocked' : 'Locked'} ${tierLabel} badge`}
      className={`eo-medal-card group relative flex flex-col items-center justify-between text-center rounded-xl p-4 transition-all duration-200 border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 ${
        isUnlocked
          ? `bg-card border-surface-700/85 ${metalCfg.cardBorderHover} hover:-translate-y-0.5 shadow-[var(--shadow-card)]`
          : 'bg-elevated/35 border-surface-700/60 hover:border-surface-600/80 opacity-85 hover:opacity-100'
      }`}
    >
      {/* Subtle radial spotlight behind coin on hover */}
      {isUnlocked && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 top-3 h-24 rounded-full opacity-0 group-hover:opacity-75 transition-opacity duration-300 blur-xl"
          style={{ background: metalCfg.glowRgba }}
        />
      )}

      {/* 3D Collectible Medallion (80px-96px desktop display) */}
      <div className="relative z-10 flex items-center justify-center py-2 min-h-[104px] w-full">
        <AchievementBadge
          badge={badge}
          isUnlocked={isUnlocked}
          depth={7}
          sizeClass="w-20 h-20 sm:w-24 sm:h-24"
        />
      </div>

      {/* Badge Title & Tier Pill */}
      <div className="relative z-10 w-full mt-2 space-y-1.5">
        <div
          className={`font-display text-xs sm:text-[13px] font-semibold leading-tight tracking-tight line-clamp-1 ${
            isUnlocked ? 'text-surface-100' : 'text-surface-400'
          }`}
        >
          {badge.name}
        </div>

        <div className="flex items-center justify-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${metalCfg.tierPillClass}`}
          >
            {!isUnlocked && <Lock className="w-2.5 h-2.5" aria-hidden="true" />}
            {tierLabel}
          </span>
        </div>
      </div>
    </button>
  );
};

/**
 * High-detail inspection modal showcasing an enlarged 3D spinning medallion
 * with front emblem, extruded edge thickness, reverse OS monogram, and unlock status.
 */
const BadgeDetailModal = ({ badge, isUnlocked, earnedDate, isOpen, onClose }) => {
  if (!badge) return null;
  const metalCfg = resolveCardTheme(badge, isUnlocked);
  const tierLabel = TIER_LABELS[badge.tier] || TIER_LABELS.bronze;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <div className="eo-medal-card flex flex-col items-center gap-4 py-3">
        {/* Pedestal chamber */}
        <div
          className="relative w-52 h-52 sm:w-56 sm:h-56 rounded-2xl bg-elevated/60 border border-surface-700/80 flex items-center justify-center shadow-[var(--shadow-card)] overflow-hidden"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute w-36 h-36 rounded-full blur-2xl opacity-70"
            style={{ background: metalCfg.glowRgba }}
          />
          <AchievementBadge
            badge={badge}
            isUnlocked={isUnlocked}
            depth={10}
            sizeClass="w-36 h-36 sm:w-40 sm:h-40"
          />
        </div>

        <div className="text-center space-y-2">
          <h3
            className={`font-display text-lg font-bold tracking-tight ${
              isUnlocked ? 'text-surface-100' : 'text-surface-400'
            }`}
          >
            {badge.name}
          </h3>

          <div className="flex items-center justify-center gap-2">
            <span
              className={`text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-md border ${metalCfg.tierPillClass}`}
            >
              {tierLabel} Tier
            </span>
            {badge.shortCode && (
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-elevated border border-surface-700 text-surface-300">
                {badge.shortCode}
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-surface-400 text-center leading-relaxed max-w-xs">
          {badge.description}
        </p>

        <div className="text-[10px] font-mono uppercase tracking-wider text-surface-400">
          {badge.category}
        </div>

        {isUnlocked ? (
          <div className="flex items-center gap-2 badge-compiler bg-compiler-500/10 border border-compiler-500/25 px-3 py-1.5 rounded-lg">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Unlocked</span>
            {earnedDate && (
              <>
                <span className="opacity-40">•</span>
                <span className="text-[10px] font-mono opacity-85">
                  {new Date(earnedDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-surface-400 bg-elevated border border-surface-700 px-3 py-1.5 rounded-lg">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Locked</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

/**
 * Premium 3D Collectible Achievement Vault showcasing all 13 hexagonal
 * metallic medallions with continuous 3D spin and detail inspection.
 */
export const AchievementGallery = ({ earnedBadges = [] }) => {
  const [selectedBadge, setSelectedBadge] = useState(null);

  const earnedMap = new Map();
  earnedBadges.forEach((b) => {
    if (b && b.isUnlocked !== false) {
      earnedMap.set(b.badgeId, b);
    }
  });

  const allBadges = BADGE_CATALOGUE.map((catalogueBadge) => {
    const earned = earnedMap.get(catalogueBadge.badgeId);
    return {
      ...catalogueBadge,
      isUnlocked: Boolean(earned),
      earnedDate: earned?.earnedAt || null,
    };
  });

  const tierWeight = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  const sorted = [...allBadges].sort((a, b) => {
    if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
    return (tierWeight[a.tier] ?? 4) - (tierWeight[b.tier] ?? 4);
  });

  const unlocked = sorted.filter((b) => b.isUnlocked);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/25">
            <Trophy className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-surface-100 tracking-tight">
              Achievement Vault
            </h2>
            <p className="text-xs text-surface-400 mt-0.5 font-mono">
              {unlocked.length} of {allBadges.length} badges unlocked
            </p>
          </div>
        </div>

        <div className="w-full sm:w-44">
          <ProgressBar
            value={allBadges.length > 0 ? (unlocked.length / allBadges.length) * 100 : 0}
            variant="brand"
            size="sm"
            showValue
          />
        </div>
      </div>

      {/* 3D Collectible Medallion Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {sorted.map((badge) => (
          <AchievementBadgeCard
            key={badge.badgeId}
            badge={badge}
            isUnlocked={badge.isUnlocked}
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
