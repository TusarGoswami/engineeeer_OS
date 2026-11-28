import { useEffect, useRef, useState } from 'react';
import {
  MEDAL_HEX_OUTER,
  MedallionFrontFace,
  MedallionReverseFace,
  resolveMetalPalette,
} from './BadgeMedallionArt.jsx';
import { getBadgeMeta } from './badgeCatalogueClient.js';
import './AchievementBadge.css';

// Exact pointy-top hexagon vertices matching MEDAL_HEX_OUTER (0..100 SVG space)
const HEX_VERTICES = [
  [50, 2],
  [91.57, 26],
  [91.57, 74],
  [50, 98],
  [8.43, 74],
  [8.43, 26],
];

const HEX_SIDE_WALLS = HEX_VERTICES.map(([x1, y1], idx) => {
  const [x2, y2] = HEX_VERTICES[(idx + 1) % HEX_VERTICES.length];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

  return {
    idx,
    midX: Number(midX.toFixed(3)),
    midY: Number(midY.toFixed(3)),
    len: Number((len + 0.9).toFixed(3)),
    angleDeg: Number(angleDeg.toFixed(3)),
  };
});

const CORE_SLICE_OFFSETS = [-0.45, 0, 0.45];

/**
 * Six extruded rectangular side walls plus thin internal hexagonal core slices
 * that bridge the front and reverse faces to produce genuine solid coin depth.
 */
const HexExtrudedWalls = ({ depth, palette }) => {
  const halfDepth = depth / 2;
  const wallHeight = depth + 0.8;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ transformStyle: 'preserve-3d' }}
      data-face="side"
      aria-hidden="true"
    >
      {/* Solid metallic internal hex core layers prevent hairline seam gaps at edge-on angles */}
      {CORE_SLICE_OFFSETS.map((ratio) => (
        <div
          key={ratio}
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translateZ(${(halfDepth * ratio).toFixed(2)}px)`,
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full block">
            <polygon
              points={MEDAL_HEX_OUTER}
              fill={ratio === 0 ? palette.wallDark : palette.wallMid}
            />
          </svg>
        </div>
      ))}

      {/* Six perimeter metal walls aligned along each hexagonal edge */}
      {HEX_SIDE_WALLS.map((wall) => {
        const isLitFacet = wall.idx === 0 || wall.idx === 1 || wall.idx === 5;
        const background = isLitFacet
          ? `linear-gradient(180deg, ${palette.wallDark} 0%, ${palette.wallBright} 48%, ${palette.wallMid} 76%, ${palette.wallDark} 100%)`
          : `linear-gradient(180deg, ${palette.wallDark} 0%, ${palette.wallMid} 45%, ${palette.wallBright} 72%, ${palette.wallDark} 100%)`;

        return (
          <div
            key={wall.idx}
            style={{
              position: 'absolute',
              left: `${wall.midX}%`,
              top: `${wall.midY}%`,
              width: `${wall.len}%`,
              height: `${wallHeight}px`,
              background,
              transform: `translate(-50%, -50%) rotateZ(${wall.angleDeg}deg) rotateX(90deg)`,
              backfaceVisibility: 'visible',
              WebkitBackfaceVisibility: 'visible',
              boxShadow: 'inset 0 0 1px rgba(255,255,255,0.22)',
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * Collectible 3D Rotating Hexagonal Achievement Medallion.
 * Mounts front symbol face, extruded metallic thickness walls, and reverse OS monogram face
 * inside a CSS preserve-3d stage rotating smoothly around the vertical Y axis.
 */
export const AchievementBadge = ({
  badge,
  badgeId,
  metalTheme,
  isUnlocked: isUnlockedProp,
  depth = 7,
  sizeClass = 'w-20 h-20 sm:w-24 sm:h-24',
  showLockedPadlock = true,
  paused = false,
  spinDuration,
  className = '',
}) => {
  const resolvedId = badge?.badgeId || badgeId || 'achievement';
  const meta = getBadgeMeta(resolvedId);
  const resolvedUnlocked =
    typeof isUnlockedProp === 'boolean'
      ? isUnlockedProp
      : Boolean(badge?.unlocked ?? true);
  const resolvedMetal = metalTheme || badge?.metalTheme || meta.metalTheme;

  const palette = resolveMetalPalette(resolvedId, resolvedMetal, resolvedUnlocked);
  const halfDepth = depth / 2;

  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsInView(entry.isIntersecting);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const playState = paused || !isInView ? 'paused' : 'running';

  return (
    <div
      ref={containerRef}
      data-testid="achievement-badge-3d"
      data-badge-id={resolvedId}
      data-unlocked={resolvedUnlocked ? 'true' : 'false'}
      data-metal-theme={palette.id}
      className={`eo-medal-stage relative aspect-square select-none ${sizeClass} ${className}`}
      style={{ '--eo-badge-glow': palette.glowRgba }}
    >
      <div
        className="eo-medal-float relative w-full h-full"
        style={{ animationPlayState: playState }}
      >
        <div
          className="eo-medal-rotor eo-medal-glow relative w-full h-full"
          style={{
            animationPlayState: playState,
            ...(spinDuration ? { animationDuration: spinDuration } : {}),
          }}
        >
          {/* Reverse Coin Face (-halfDepth, rotated 180deg around Y) */}
          <div
            className="absolute inset-0"
            style={{
              transform: `rotateY(180deg) translateZ(${halfDepth}px)`,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <MedallionReverseFace
              badgeId={resolvedId}
              metalTheme={resolvedMetal}
              isUnlocked={resolvedUnlocked}
            />
          </div>

          {/* Extruded Hexagonal Side Walls + Internal Core Slices */}
          <HexExtrudedWalls depth={depth} palette={palette} />

          {/* Front Embossed Face (+halfDepth) */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translateZ(${halfDepth}px)`,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <MedallionFrontFace
              badgeId={resolvedId}
              metalTheme={resolvedMetal}
              isUnlocked={resolvedUnlocked}
              showLockedPadlock={showLockedPadlock}
            />
            <div className="eo-medal-shimmer" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementBadge;

