import { useState, useRef, useCallback, useEffect } from 'react';
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
    glow: 'dark:shadow-orange-900/40',
    glowHover: 'dark:group-hover:shadow-orange-700/50',
    accent: 'text-amber-700 dark:text-amber-500',
    accentBg: 'bg-amber-500/10 border-amber-600/25 dark:border-amber-500/20 text-amber-800 dark:text-amber-500',
    iconColor: '#d97706',
    iconColorLight: '#b45309',
    ringColor: 'ring-amber-500/30',
    borderStart: '#c2410c',
    borderMid: '#fb923c',
    borderEnd: '#c2410c',
    fillCenter: '#431407',
    fillEdge: '#1c1917',
    shimmerColor: '#fb923c',
    fillCenterLight: '#fff7ed',
    fillEdgeLight: '#fed7aa',
    shimmerColorLight: '#f97316',
    borderStartLight: '#ea580c',
    borderMidLight: '#fdba74',
    borderEndLight: '#ea580c',
  },
  silver: {
    label: 'Silver',
    glow: 'dark:shadow-slate-500/30',
    glowHover: 'dark:group-hover:shadow-slate-400/50',
    accent: 'text-slate-600 dark:text-slate-300',
    accentBg: 'bg-slate-500/10 dark:bg-slate-400/10 border-slate-400/30 dark:border-slate-400/20 text-slate-700 dark:text-slate-400',
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
    glow: 'dark:shadow-amber-500/40',
    glowHover: 'dark:group-hover:shadow-amber-400/60',
    accent: 'text-amber-700 dark:text-amber-400',
    accentBg: 'bg-amber-500/10 dark:bg-amber-400/10 border-amber-600/25 dark:border-amber-400/20 text-amber-800 dark:text-amber-400',
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
    glow: 'dark:shadow-cyan-500/40',
    glowHover: 'dark:group-hover:shadow-cyan-400/60',
    accent: 'text-sky-700 dark:text-cyan-400',
    accentBg: 'bg-sky-500/10 dark:bg-cyan-400/10 border-sky-600/25 dark:border-cyan-400/20 text-sky-800 dark:text-cyan-400',
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
   3D MEDAL CONSTANTS
   ═══════════════════════════════════════════════════════════════════════ */
const MEDAL_DEPTH = 8;        // px — medal thickness
const TILT_AMPLITUDE = 15;    // max degrees of hover tilt


/* ═══════════════════════════════════════════════════════════════════════
   useReducedMotion — respects prefers-reduced-motion
   ═══════════════════════════════════════════════════════════════════════ */
const useReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setPrefersReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
};


/* ═══════════════════════════════════════════════════════════════════════
   HEXAGONAL SVG BADGE — theme-aware front-face artwork (UNCHANGED)
   ═══════════════════════════════════════════════════════════════════════ */
const HexBadge = ({ badgeId, tier, isUnlocked, className = '' }) => {
  const { isDark } = useTheme();
  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  const IconComponent = BADGE_ICONS[badgeId] || AwardIcon;
  const c = isUnlocked ? tierCfg : LOCKED_COLORS;

  const borderStart = isDark ? c.borderStart : c.borderStartLight;
  const borderMid = isDark ? c.borderMid : c.borderMidLight;
  const borderEnd = isDark ? c.borderEnd : c.borderEndLight;
  const fillCenter = isDark ? c.fillCenter : c.fillCenterLight;
  const fillEdge = isDark ? c.fillEdge : c.fillEdgeLight;
  const shimmerColor = isDark ? c.shimmerColor : c.shimmerColorLight;
  const iconColor = isDark
    ? (isUnlocked ? tierCfg.iconColor : '#6b7280')
    : (isUnlocked ? tierCfg.iconColorLight : '#9ca3af');

  const hexPoints = '50,2 93,25 93,75 50,98 7,75 7,25';
  const hexInner = '50,6 89,27 89,73 50,94 11,73 11,27';
  const hexInnermost = '50,14 82,32 82,68 50,86 18,68 18,32';

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
          <linearGradient id={`border-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={borderStart} />
            <stop offset="50%" stopColor={borderMid} />
            <stop offset="100%" stopColor={borderEnd} />
          </linearGradient>
          <radialGradient id={`fill-${uid}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={fillCenter} stopOpacity="0.95" />
            <stop offset="100%" stopColor={fillEdge} stopOpacity="1" />
          </radialGradient>
          <radialGradient id={`shimmer-${uid}`} cx="35%" cy="30%" r="45%">
            <stop offset="0%" stopColor={shimmerColor} stopOpacity={isDark ? '0.08' : '0.15'} />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        <polygon points={hexPoints} fill={`url(#border-${uid})`} />
        <polygon points={hexInner} fill={`url(#fill-${uid})`} />
        <polygon points={hexInner} fill={`url(#shimmer-${uid})`} />

        <polygon
          points={hexInnermost}
          fill="none"
          stroke={isUnlocked ? borderMid : (isDark ? '#374151' : '#d1d5db')}
          strokeWidth="0.4"
          strokeOpacity={isUnlocked ? '0.25' : '0.1'}
        />
      </svg>

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
   HEX SIDE WALLS — 6 actual perpendicular rectangular surfaces
   connecting the front and back faces of the hexagonal medal.
   These remain visible at ALL rotation angles (critical at 90° & 270°).

   Geometry:
     Hex vertices (SVG viewBox 0–100, pointy-top):
       V0 (50, 2)   V1 (93, 25)  V2 (93, 75)
       V3 (50, 98)  V4 (7, 75)   V5 (7, 25)

     Each side wall is a narrow rectangle:
       width  = edge length (distance between adjacent vertices)
       height = medal depth (8–10 px)

     The panel sits at the edge midpoint, rotated so it's perpendicular
     to the front face and aligned with the hex edge direction.

     Transform chain per panel:
       1. translate(-50%, -50%)         → center at origin
       2. rotateX(90deg)               → flip upright (now in XZ plane)
       3. rotateZ(-edgeAngleDeg)       → align with hex edge direction
       4. translate3d(midX, midY, 0)   → move to edge position

     Because the panels are inside the preserve-3d auto-spin layer,
     they rotate with the medal and stay visible at 90°/270°.
   ═══════════════════════════════════════════════════════════════════════ */

const HEX_VERTICES = [
  [50, 2],    // V0 — top
  [93, 25],   // V1 — upper-right
  [93, 75],   // V2 — lower-right
  [50, 98],   // V3 — bottom
  [7, 75],    // V4 — lower-left
  [7, 25],    // V5 — upper-left
];

// Pre-compute side wall geometry for each of the 6 edges
const HEX_SIDE_WALLS = HEX_VERTICES.map((v, i) => {
  const w = HEX_VERTICES[(i + 1) % 6];
  const midX = (v[0] + w[0]) / 2;
  const midY = (v[1] + w[1]) / 2;
  const dx = w[0] - v[0];
  const dy = w[1] - v[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  // Angle of the edge line itself (used to rotate the panel to align with it)
  const edgeAngleRad = Math.atan2(dy, dx);
  const edgeAngleDeg = edgeAngleRad * (180 / Math.PI);
  return { midX, midY, len, edgeAngleDeg };
});

const HexSideWalls = ({ depth, edgeColor, edgeHighlight, isUnlocked }) => {
  return (
    <>
      {HEX_SIDE_WALLS.map((wall, i) => {
        // Alternate color for beveled metallic look — highlight the
        // top/bottom edges, darken the flanks for depth
        const isHighlightFace = i === 0 || i === 3;
        const bg = isHighlightFace
          ? `linear-gradient(to bottom, ${edgeHighlight}, ${edgeColor})`
          : `linear-gradient(to bottom, ${edgeColor}, ${edgeHighlight}, ${edgeColor})`;

        return (
          <div
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute',
              // Size: edge length × depth
              width: `${wall.len}%`,
              height: `${depth}px`,
              // Position the panel's top-left at the edge midpoint
              // then translate(-50%,-50%) centers it there
              left: `${wall.midX}%`,
              top: `${wall.midY}%`,
              background: bg,
              opacity: isUnlocked ? 1 : 0.3,
              transformOrigin: 'center center',
              // 1. Center at its own midpoint
              // 2. Rotate up 90° around X → panel now stands perpendicular to front face
              // 3. Rotate around Z to align with the hex edge direction
              transform: `translate(-50%, -50%) rotateX(90deg) rotate(${wall.edgeAngleDeg}deg)`,
              backfaceVisibility: 'visible',
            }}
          />
        );
      })}
    </>
  );
};


/* ═══════════════════════════════════════════════════════════════════════
   HexBadgeBack — Premium collectible reverse face of the 3D medal

   Design layers (bottom → top):
     1. Outer metallic hex border (matches front)
     2. Recessed inner field with radial metallic gradient
     3. Concentric engraved hex ring patterns (3 rings)
     4. 12 radial spoke lines emanating from center
     5. Embossed central gear/cog platform emblem
     6. 6 decorative rivet dots at inner hex vertices
     7. Tier insignia text engraved below emblem
     8. Top-highlight shimmer for metallic realism
   ═══════════════════════════════════════════════════════════════════════ */
const HexBadgeBack = ({ tier, isUnlocked }) => {
  const { isDark } = useTheme();
  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  const c = isUnlocked ? tierCfg : LOCKED_COLORS;

  const borderStart = isDark ? c.borderStart : c.borderStartLight;
  const borderMid = isDark ? c.borderMid : c.borderMidLight;
  const borderEnd = isDark ? c.borderEnd : (c.borderEndLight || c.borderStartLight);
  const fillCenter = isDark ? c.fillCenter : c.fillCenterLight;
  const fillEdge = isDark ? c.fillEdge : c.fillEdgeLight;
  const shimmerColor = isDark ? (c.shimmerColor || borderMid) : (c.shimmerColorLight || borderMid);

  // Unique ID per tier+theme to avoid SVG gradient clashes
  const uid = `bk-${tier}-${isDark ? 'd' : 'l'}`;

  // ── Hex rings at different scales (cx=50, cy=50, pointy-top) ──
  const hexRing = (r) => {
    const a = Math.PI / 3;
    return Array.from({ length: 6 }, (_, i) => {
      const angle = a * i - Math.PI / 2;
      return `${(50 + r * Math.cos(angle)).toFixed(1)},${(50 + r * Math.sin(angle)).toFixed(1)}`;
    }).join(' ');
  };

  // ── Radial spokes (12 lines from center outward) ──
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 12;
    const x2 = 50 + 38 * Math.cos(angle);
    const y2 = 50 + 38 * Math.sin(angle);
    return { x1: 50, y1: 50, x2: x2.toFixed(1), y2: y2.toFixed(1) };
  });

  // ── Rivet dots at inner hex vertices ──
  const rivetRadius = 32;
  const rivets = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return {
      cx: (50 + rivetRadius * Math.cos(angle)).toFixed(1),
      cy: (50 + rivetRadius * Math.sin(angle)).toFixed(1),
    };
  });

  // ── Gear/cog emblem paths (8-tooth gear centered at 50,50) ──
  const gearTeeth = 8;
  const gearOuter = 14;
  const gearInner = 10.5;
  const gearPath = (() => {
    const pts = [];
    for (let i = 0; i < gearTeeth; i++) {
      const aOuter = (Math.PI * 2 * i) / gearTeeth - Math.PI / 2;
      const aMid = aOuter + Math.PI / gearTeeth;
      // Outer tooth tip
      pts.push(`${i === 0 ? 'M' : 'L'}${(50 + gearOuter * Math.cos(aOuter - 0.15)).toFixed(1)},${(50 + gearOuter * Math.sin(aOuter - 0.15)).toFixed(1)}`);
      pts.push(`L${(50 + gearOuter * Math.cos(aOuter + 0.15)).toFixed(1)},${(50 + gearOuter * Math.sin(aOuter + 0.15)).toFixed(1)}`);
      // Valley between teeth
      pts.push(`L${(50 + gearInner * Math.cos(aMid - 0.12)).toFixed(1)},${(50 + gearInner * Math.sin(aMid - 0.12)).toFixed(1)}`);
      pts.push(`L${(50 + gearInner * Math.cos(aMid + 0.12)).toFixed(1)},${(50 + gearInner * Math.sin(aMid + 0.12)).toFixed(1)}`);
    }
    pts.push('Z');
    return pts.join(' ');
  })();

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        aria-hidden="true"
        style={{
          filter: isUnlocked ? undefined : 'saturate(0.15) brightness(0.5)',
        }}
      >
        <defs>
          {/* Outer border gradient — diagonal metallic sweep */}
          <linearGradient id={`bb-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={borderStart} />
            <stop offset="35%" stopColor={borderMid} />
            <stop offset="65%" stopColor={borderEnd} />
            <stop offset="100%" stopColor={borderStart} />
          </linearGradient>

          {/* Inner field — radial metallic fill */}
          <radialGradient id={`bf-${uid}`} cx="45%" cy="40%" r="58%">
            <stop offset="0%" stopColor={fillCenter} stopOpacity="0.97" />
            <stop offset="100%" stopColor={fillEdge} stopOpacity="1" />
          </radialGradient>

          {/* Bevel highlight — top-left specular glint */}
          <linearGradient id={`bh-${uid}`} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor={shimmerColor} stopOpacity={isDark ? '0.12' : '0.22'} />
            <stop offset="50%" stopColor={shimmerColor} stopOpacity="0" />
            <stop offset="100%" stopColor={borderStart} stopOpacity={isDark ? '0.06' : '0.08'} />
          </linearGradient>

          {/* Gear emblem fill — metallic gradient */}
          <linearGradient id={`bg-${uid}`} x1="30%" y1="10%" x2="70%" y2="90%">
            <stop offset="0%" stopColor={borderMid} stopOpacity={isDark ? '0.5' : '0.6'} />
            <stop offset="50%" stopColor={borderStart} stopOpacity={isDark ? '0.35' : '0.4'} />
            <stop offset="100%" stopColor={borderMid} stopOpacity={isDark ? '0.5' : '0.6'} />
          </linearGradient>

          {/* Gear emblem stroke gradient */}
          <linearGradient id={`bs-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={borderMid} stopOpacity="0.6" />
            <stop offset="100%" stopColor={borderStart} stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* ── Layer 1: Outer metallic hex border ── */}
        <polygon
          points="50,2 93,25 93,75 50,98 7,75 7,25"
          fill={`url(#bb-${uid})`}
        />

        {/* ── Layer 2: Recessed inner field ── */}
        <polygon
          points="50,6 89,27 89,73 50,94 11,73 11,27"
          fill={`url(#bf-${uid})`}
        />

        {/* ── Layer 3: Engraved concentric hex rings ── */}
        <polygon
          points={hexRing(38)}
          fill="none"
          stroke={borderMid}
          strokeWidth="0.35"
          strokeOpacity={isDark ? '0.12' : '0.18'}
        />
        <polygon
          points={hexRing(30)}
          fill="none"
          stroke={borderMid}
          strokeWidth="0.5"
          strokeOpacity={isDark ? '0.18' : '0.25'}
        />
        <polygon
          points={hexRing(22)}
          fill="none"
          stroke={borderMid}
          strokeWidth="0.4"
          strokeOpacity={isDark ? '0.14' : '0.2'}
        />

        {/* ── Layer 4: Radial spoke lines ── */}
        {spokes.map((s, i) => (
          <line
            key={i}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={borderMid}
            strokeWidth="0.2"
            strokeOpacity={isDark ? '0.07' : '0.1'}
          />
        ))}

        {/* ── Layer 5: Embossed gear/cog platform emblem ── */}
        {/* Gear shadow (slight offset for embossed depth) */}
        <path
          d={gearPath}
          fill={fillEdge}
          fillOpacity={isDark ? '0.4' : '0.15'}
          transform="translate(0.4, 0.6)"
        />
        {/* Gear body */}
        <path
          d={gearPath}
          fill={`url(#bg-${uid})`}
          stroke={`url(#bs-${uid})`}
          strokeWidth="0.5"
        />
        {/* Gear center hole */}
        <circle
          cx="50"
          cy="50"
          r="5"
          fill={fillCenter}
          fillOpacity={isDark ? '0.8' : '0.5'}
          stroke={borderMid}
          strokeWidth="0.4"
          strokeOpacity={isDark ? '0.3' : '0.35'}
        />
        {/* Gear center dot (axle) */}
        <circle
          cx="50"
          cy="50"
          r="2"
          fill={borderMid}
          fillOpacity={isDark ? '0.25' : '0.3'}
        />

        {/* ── Layer 6: Decorative rivet dots ── */}
        {rivets.map((r, i) => (
          <g key={i}>
            {/* Rivet shadow */}
            <circle
              cx={Number(r.cx) + 0.3}
              cy={Number(r.cy) + 0.3}
              r="1.3"
              fill={fillEdge}
              fillOpacity={isDark ? '0.3' : '0.12'}
            />
            {/* Rivet body */}
            <circle
              cx={r.cx}
              cy={r.cy}
              r="1.2"
              fill={borderStart}
              fillOpacity={isDark ? '0.4' : '0.35'}
              stroke={borderMid}
              strokeWidth="0.3"
              strokeOpacity={isDark ? '0.25' : '0.3'}
            />
          </g>
        ))}

        {/* ── Layer 7: Tier insignia text ── */}
        <text
          x="50"
          y="72"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="5.5"
          fontFamily="monospace"
          fontWeight="bold"
          fill={borderMid}
          opacity={isDark ? '0.2' : '0.28'}
          letterSpacing="3"
        >
          {tierCfg.label.toUpperCase()}
        </text>

        {/* Thin separator line above tier text */}
        <line
          x1="35"
          y1="66"
          x2="65"
          y2="66"
          stroke={borderMid}
          strokeWidth="0.3"
          strokeOpacity={isDark ? '0.15' : '0.2'}
        />

        {/* ── Layer 8: Top-highlight shimmer overlay ── */}
        <polygon
          points="50,6 89,27 89,73 50,94 11,73 11,27"
          fill={`url(#bh-${uid})`}
        />
      </svg>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════════
   HexMedal3D — 3D medal with continuous auto-spin for unlocked badges

   Architecture (nested transforms to avoid conflicts):
     perspective container
       └── hover-tilt layer  (rotateX / rotateY from mouse — transitions)
             └── auto-spin layer  (rotateY 360° infinite CSS animation)
                   ├── FRONT FACE   translateZ(+half)
                   ├── EDGE LAYERS  translateZ(...)
                   └── BACK FACE    rotateY(180) translateZ(+half)
   ═══════════════════════════════════════════════════════════════════════ */
const HexMedal3D = ({
  badgeId,
  tier,
  isUnlocked,
  className = '',
  tiltX = 0,
  tiltY = 0,
  autoSpin = false,
  depth = MEDAL_DEPTH,
}) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const reducedMotion = useReducedMotion();

  const { isDark } = useTheme();
  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  const c = isUnlocked ? tierCfg : LOCKED_COLORS;

  const edgeStart = isDark ? c.borderStart : c.borderStartLight;
  const edgeMid = isDark ? c.borderMid : c.borderMidLight;

  const halfDepth = depth / 2;

  // IntersectionObserver — pause animation when off-screen
  useEffect(() => {
    if (!autoSpin || reducedMotion) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoSpin, reducedMotion]);



  const shouldSpin = autoSpin && !reducedMotion;

  return (
    <div ref={containerRef} className={className} style={{ perspective: '800px' }}>
      {/* ── HOVER-TILT LAYER ── */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        {/* ── AUTO-SPIN LAYER ── */}
        <div
          className={shouldSpin ? 'hex-medal-auto-spin' : ''}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            animationPlayState: isVisible ? 'running' : 'paused',
          }}
        >
          {/* FRONT FACE */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translateZ(${halfDepth}px)`,
              backfaceVisibility: 'hidden',
            }}
          >
            <HexBadge badgeId={badgeId} tier={tier} isUnlocked={isUnlocked} />
          </div>

          {/* 3D SIDE WALLS — 6 perpendicular surfaces visible at all angles */}
          <HexSideWalls
            depth={depth}
            edgeColor={edgeStart}
            edgeHighlight={edgeMid}
            isUnlocked={isUnlocked}
          />

          {/* BACK FACE */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `rotateY(180deg) translateZ(${halfDepth}px)`,
              backfaceVisibility: 'hidden',
            }}
          >
            <HexBadgeBack tier={tier} isUnlocked={isUnlocked} />
          </div>
        </div>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════════
   ACHIEVEMENT BADGE CARD — 3D medal + name + tier pill
   Hover tilt on mouse move · Click opens detail modal
   ═══════════════════════════════════════════════════════════════════════ */
const AchievementBadgeCard = ({ badge, isUnlocked, onClick }) => {
  const tierCfg = TIER_CONFIG[badge.tier] || TIER_CONFIG.bronze;
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const rafId = useRef(null);
  const reducedMotion = useReducedMotion();

  const handleMouseMove = useCallback(
    (e) => {
      if (reducedMotion) return;
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        setTilt({
          x: (0.5 - ny) * TILT_AMPLITUDE * 2,
          y: (nx - 0.5) * TILT_AMPLITUDE * 2,
        });
      });
    },
    [reducedMotion],
  );

  const handleMouseLeave = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    setTilt({ x: 0, y: 0 });
  }, []);

  useEffect(
    () => () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    },
    [],
  );

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl
        transition-all duration-300 ease-out cursor-pointer
        focus:outline-none focus-visible:ring-2 ${tierCfg.ringColor} focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
        ${isUnlocked
          ? `bg-surface-850 dark:bg-surface-900/40 dark:hover:bg-surface-800/60 border border-surface-700 dark:border-surface-700/40 hover:border-surface-600 dark:hover:border-surface-600/60 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] dark:shadow-lg ${tierCfg.glow} ${tierCfg.glowHover} dark:hover:shadow-xl hover:-translate-y-1`
          : 'bg-surface-900 dark:bg-surface-900/20 border border-surface-700 dark:border-surface-800/30 hover:bg-surface-800/60 dark:hover:bg-surface-900/30 opacity-70 dark:opacity-60 hover:opacity-85'
        }`}
      aria-label={`${badge.name} — ${isUnlocked ? 'Unlocked' : 'Locked'} ${tierCfg.label} badge`}
    >
      {/* 3D Medal — auto-spins for unlocked badges */}
      <div className="w-20 h-20 sm:w-24 sm:h-24">
        <HexMedal3D
          badgeId={badge.badgeId}
          tier={badge.tier}
          isUnlocked={isUnlocked}
          tiltX={tilt.x}
          tiltY={tilt.y}
          autoSpin={isUnlocked}
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
   BADGE DETAIL MODAL — large 3D badge with auto-spin + details
   ═══════════════════════════════════════════════════════════════════════ */
const BadgeDetailModal = ({ badge, isUnlocked, earnedDate, isOpen, onClose }) => {
  if (!badge) return null;
  const tierCfg = TIER_CONFIG[badge.tier] || TIER_CONFIG.bronze;

  const modalBadgeRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const rafId = useRef(null);
  const reducedMotion = useReducedMotion();

  const handleMouseMove = useCallback(
    (e) => {
      if (reducedMotion) return;
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const rect = modalBadgeRef.current?.getBoundingClientRect();
        if (!rect) return;
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        setTilt({
          x: (0.5 - ny) * TILT_AMPLITUDE * 2,
          y: (nx - 0.5) * TILT_AMPLITUDE * 2,
        });
      });
    },
    [reducedMotion],
  );

  const handleMouseLeave = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    setTilt({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!isOpen) setTilt({ x: 0, y: 0 });
  }, [isOpen]);

  useEffect(
    () => () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    },
    [],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <div className="flex flex-col items-center gap-4 py-2">
        {/* Large 3D auto-spinning badge */}
        <div
          ref={modalBadgeRef}
          className="w-32 h-32 sm:w-40 sm:h-40"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <HexMedal3D
            badgeId={badge.badgeId}
            tier={badge.tier}
            isUnlocked={isUnlocked}
            tiltX={tilt.x}
            tiltY={tilt.y}
            autoSpin={isUnlocked}
            depth={10}
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
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-600/25 dark:border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Unlocked</span>
            {earnedDate && (
              <>
                <span className="text-emerald-500/40">•</span>
                <span className="text-[10px] font-mono text-emerald-700/80 dark:text-emerald-400/80">
                  {new Date(earnedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-surface-500 bg-surface-900 dark:bg-surface-800/40 border border-surface-700 dark:border-surface-700/30 px-3 py-1.5 rounded-xl">
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

  const earnedMap = new Map();
  earnedBadges.forEach(b => {
    earnedMap.set(b.badgeId, b);
  });

  const allBadges = BADGE_CATALOGUE.map(catalogueBadge => {
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

  const unlocked = sorted.filter(b => b.isUnlocked);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-600/25 dark:border-amber-500/20">
            <Trophy className="w-5 h-5 text-amber-700 dark:text-amber-400" />
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

        <div className="hidden sm:flex items-center gap-3">
          <div className="w-32 h-2 rounded-full bg-surface-700 dark:bg-surface-800 overflow-hidden">
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
