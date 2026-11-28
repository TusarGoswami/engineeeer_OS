import { useContext, useId } from 'react';
import { Lock } from 'lucide-react';
import ThemeContext from '../../../context/ThemeContext.jsx';
import {
  LOCKED_METAL_THEME,
  METAL_THEMES,
  getBadgeMeta,
} from './badgeCatalogueClient.js';

// Exact regular pointy-top hexagon vertices (R = 48 around center 50,50)
export const MEDAL_HEX_OUTER = '50,2 91.57,26 91.57,74 50,98 8.43,74 8.43,26';
export const MEDAL_HEX_BEVEL = '50,6.5 87.67,28.25 87.67,71.75 50,93.5 12.33,71.75 12.33,28.25';
export const MEDAL_HEX_INNER = '50,11 83.77,30.5 83.77,69.5 50,89 16.23,69.5 16.23,30.5';
export const MEDAL_HEX_INSET = '50,15 80.31,32.5 80.31,67.5 50,85 19.69,67.5 19.69,32.5';

const hexRingPoints = (r) => {
  const step = Math.PI / 3;
  return Array.from({ length: 6 }, (_, i) => {
    const a = step * i - Math.PI / 2;
    return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
};

const useSafeIsDark = () => {
  const ctx = useContext(ThemeContext);
  if (ctx && typeof ctx.isDark === 'boolean') return ctx.isDark;
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
};

export const resolveMetalPalette = (badgeId, metalThemeOverride, isUnlocked) => {
  if (!isUnlocked) return LOCKED_METAL_THEME;
  const meta = getBadgeMeta(badgeId);
  const key = metalThemeOverride || meta.metalTheme || 'orange';
  return METAL_THEMES[key] || METAL_THEMES.orange;
};

/**
 * Distinct 13 front-face raised metallic SVG symbols (drawn inside viewBox 0..100).
 */
const MedallionSymbol = ({ badgeId, symbolGradId, accentGradId, shadowFilterId, isUnlocked }) => {
  const strokeMain = isUnlocked ? '#FFFFFF' : '#94A3B8';
  const symbolFill = `url(#${symbolGradId})`;
  const accentFill = `url(#${accentGradId})`;
  const opacity = isUnlocked ? 1 : 0.36;

  return (
    <g
      filter={shadowFilterId ? `url(#${shadowFilterId})` : undefined}
      opacity={opacity}
    >
      {(() => {
        switch (badgeId) {
          case 'streak_100':
            // Flaming emblem with 100
            return (
              <g>
                <path
                  d="M50 21c6 8-2 13 5 18 4-4 5-9 3-14 11 9 15 19 11 30-3 8-10 13-19 13s-16-5-19-14c-3-9 2-18 11-26-1 7 1 11 5 14 2-7 0-14 3-21Z"
                  fill={accentFill}
                  stroke={strokeMain}
                  strokeOpacity="0.45"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M50 37c4 4 6 7 5 12 0 4-3 6-6 6s-6-2-6-6c0-4 3-8 7-12Z"
                  fill={symbolFill}
                  fillOpacity="0.85"
                />
                <rect
                  x="30"
                  y="56"
                  width="40"
                  height="15.5"
                  rx="4"
                  fill="#0B1220"
                  fillOpacity="0.88"
                  stroke={symbolFill}
                  strokeWidth="1.4"
                />
                <text
                  x="50"
                  y="66.5"
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="800"
                  fontFamily="monospace"
                  letterSpacing="0.8"
                  fill={symbolFill}
                >
                  100
                </text>
              </g>
            );

          case 'coding_100':
            // Embossed Code brackets </>
            return (
              <g>
                <path
                  d="M39 36 L25 50 L39 64"
                  fill="none"
                  stroke={symbolFill}
                  strokeWidth="5.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M61 36 L75 50 L61 64"
                  fill="none"
                  stroke={symbolFill}
                  strokeWidth="5.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M54 31 L46 69"
                  fill="none"
                  stroke={accentFill}
                  strokeWidth="4.6"
                  strokeLinecap="round"
                />
                <path
                  d="M39 36 L25 50 L39 64 M61 36 L75 50 L61 64"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeOpacity="0.4"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );

          case 'alumni_verified':
            // Graduation cap with verification checkmark seal
            return (
              <g>
                <polygon
                  points="50,27 75,38 50,49 25,38"
                  fill={symbolFill}
                  stroke={strokeMain}
                  strokeOpacity="0.45"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
                <path
                  d="M34 44v13c9 6.5 23 6.5 32 0V44"
                  fill={symbolFill}
                  fillOpacity="0.82"
                  stroke={strokeMain}
                  strokeOpacity="0.4"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
                <line
                  x1="72"
                  y1="39.5"
                  x2="72"
                  y2="54"
                  stroke={accentFill}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <circle cx="72" cy="55.5" r="2.5" fill={accentFill} />
                <circle
                  cx="63.5"
                  cy="63"
                  r="9.5"
                  fill="#0B1410"
                  stroke={accentFill}
                  strokeWidth="2"
                />
                <path
                  d="M59.2 63.2 L62.2 66.2 L68.2 60"
                  fill="none"
                  stroke="#34D399"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );

          case 'streak_30':
            // Calendar plate with rising flame
            return (
              <g>
                <rect
                  x="27"
                  y="30"
                  width="46"
                  height="42"
                  rx="6"
                  fill={symbolFill}
                  fillOpacity="0.16"
                  stroke={symbolFill}
                  strokeWidth="2.4"
                />
                <path
                  d="M27 38 H73"
                  stroke={symbolFill}
                  strokeWidth="2"
                />
                <line x1="38" y1="25" x2="38" y2="33" stroke={symbolFill} strokeWidth="3.2" strokeLinecap="round" />
                <line x1="62" y1="25" x2="62" y2="33" stroke={symbolFill} strokeWidth="3.2" strokeLinecap="round" />
                <path
                  d="M50 42c5.5 6 8.5 9.5 6.8 15.8A7.4 7.4 0 0 1 42.3 58c0-4.8 3.2-9 6.6-12.5 0 3.2 1.2 4.6 2.3 5.5 1-3 0.7-5.6-1.2-9Z"
                  fill={accentFill}
                  stroke={strokeMain}
                  strokeOpacity="0.4"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
              </g>
            );

          case 'gate_veteran':
            // Faceted five-point bevelled star
            return (
              <g>
                <polygon
                  points="50,24 57.2,40 74.8,42 61.6,53.8 65.3,71.2 50,62.3 34.7,71.2 38.4,53.8 25.2,42 42.8,40"
                  fill={accentFill}
                  stroke={strokeMain}
                  strokeOpacity="0.55"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <polygon
                  points="50,24 57.2,40 50,50 42.8,40"
                  fill="#FFFFFF"
                  fillOpacity="0.28"
                />
                <polygon
                  points="50,50 74.8,42 61.6,53.8"
                  fill="#000000"
                  fillOpacity="0.18"
                />
                <circle cx="50" cy="49.5" r="4.5" fill={symbolFill} fillOpacity="0.9" />
              </g>
            );

          case 'academic_master':
            // Sculpted Trophy
            return (
              <g>
                <path
                  d="M36 32 H64 V46 C64 55 57.5 60.5 50 60.5 C42.5 60.5 36 55 36 46 Z"
                  fill={accentFill}
                  stroke={strokeMain}
                  strokeOpacity="0.5"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M36 36 H29.5 V43 C29.5 47.5 33 50.5 37 51"
                  fill="none"
                  stroke={symbolFill}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                <path
                  d="M64 36 H70.5 V43 C70.5 47.5 67 50.5 63 51"
                  fill="none"
                  stroke={symbolFill}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                <rect x="47.5" y="60" width="5" height="8" fill={symbolFill} />
                <path
                  d="M39 68 H61 L63 72.5 H37 Z"
                  fill={symbolFill}
                  stroke={strokeMain}
                  strokeOpacity="0.35"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
                <polygon
                  points="50,38.5 52.2,43 57,43.6 53.5,47 54.4,51.8 50,49.4 45.6,51.8 46.5,47 43,43.6 47.8,43"
                  fill="#FFFFFF"
                  fillOpacity="0.85"
                />
              </g>
            );

          case 'streak_7':
            // Calendar displaying 7 with flame
            return (
              <g>
                <rect
                  x="26"
                  y="31"
                  width="42"
                  height="40"
                  rx="6"
                  fill={symbolFill}
                  fillOpacity="0.14"
                  stroke={symbolFill}
                  strokeWidth="2.3"
                />
                <path d="M26 40 H68" stroke={symbolFill} strokeWidth="1.8" />
                <line x1="36" y1="26" x2="36" y2="33" stroke={symbolFill} strokeWidth="3" strokeLinecap="round" />
                <line x1="58" y1="26" x2="58" y2="33" stroke={symbolFill} strokeWidth="3" strokeLinecap="round" />
                <text
                  x="44"
                  y="62"
                  textAnchor="middle"
                  fontSize="20"
                  fontWeight="800"
                  fontFamily="monospace"
                  fill={symbolFill}
                >
                  7
                </text>
                <path
                  d="M64 25c4 4.5 6 7 4.8 11.8a5.6 5.6 0 0 1-11.2 0c0-3.5 2.4-6.8 5-9.2 0 2.3 0.9 3.4 1.8 4 0.8-2.2 0.6-4.2-0.4-6.6Z"
                  fill={accentFill}
                  stroke="#FFFFFF"
                  strokeOpacity="0.6"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />
              </g>
            );

          case 'coding_first':
            // Terminal prompt >_
            return (
              <g>
                <rect
                  x="25"
                  y="30"
                  width="50"
                  height="40"
                  rx="7"
                  fill="#09101A"
                  fillOpacity="0.72"
                  stroke={symbolFill}
                  strokeWidth="2.3"
                />
                <path d="M25 39.5 H75" stroke={symbolFill} strokeOpacity="0.45" strokeWidth="1.4" />
                <circle cx="32" cy="34.8" r="1.7" fill="#FB923C" />
                <circle cx="38" cy="34.8" r="1.7" fill="#FBBF24" />
                <circle cx="44" cy="34.8" r="1.7" fill="#34D399" />
                <path
                  d="M35 48 L45 55 L35 62"
                  fill="none"
                  stroke={symbolFill}
                  strokeWidth="3.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="50"
                  y1="62"
                  x2="65"
                  y2="62"
                  stroke={accentFill}
                  strokeWidth="3.6"
                  strokeLinecap="round"
                />
              </g>
            );

          case 'coding_25':
            // Friendly minimal robot head with circuit details
            return (
              <g>
                <line x1="50" y1="24" x2="50" y2="33" stroke={symbolFill} strokeWidth="2.6" strokeLinecap="round" />
                <circle cx="50" cy="23.5" r="3" fill={accentFill} />
                <line x1="25" y1="49" x2="31" y2="49" stroke={symbolFill} strokeWidth="3.2" strokeLinecap="round" />
                <line x1="69" y1="49" x2="75" y2="49" stroke={symbolFill} strokeWidth="3.2" strokeLinecap="round" />
                <rect
                  x="31"
                  y="33"
                  width="38"
                  height="33"
                  rx="10"
                  fill={symbolFill}
                  fillOpacity="0.2"
                  stroke={symbolFill}
                  strokeWidth="2.5"
                />
                <rect x="37" y="42" width="26" height="11" rx="5.5" fill="#0B101E" fillOpacity="0.85" />
                <circle cx="43.5" cy="47.5" r="2.7" fill={accentFill} />
                <circle cx="56.5" cy="47.5" r="2.7" fill={accentFill} />
                <path
                  d="M42.5 58.5 C46 62 54 62 57.5 58.5"
                  fill="none"
                  stroke={symbolFill}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </g>
            );

          case 'coding_50':
            // Faceted diamond
            return (
              <g>
                <polygon
                  points="36,30 64,30 74,44 50,72 26,44"
                  fill={symbolFill}
                  stroke={strokeMain}
                  strokeOpacity="0.65"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <polygon points="36,30 64,30 57,44 43,44" fill="#FFFFFF" fillOpacity="0.32" />
                <polygon points="26,44 43,44 50,72" fill="#000000" fillOpacity="0.16" />
                <polygon points="57,44 74,44 50,72" fill="#000000" fillOpacity="0.28" />
                <polygon points="43,44 57,44 50,72" fill={accentFill} fillOpacity="0.45" />
                <polyline
                  points="26,44 74,44 M36,30 43,44 50,30 57,44 64,30"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeOpacity="0.45"
                  strokeWidth="1"
                />
              </g>
            );

          case 'gate_debut':
            // GATE lettering with open book
            return (
              <g>
                <rect
                  x="31"
                  y="27"
                  width="38"
                  height="14.5"
                  rx="3.5"
                  fill="#0B111B"
                  fillOpacity="0.86"
                  stroke={accentFill}
                  strokeWidth="1.4"
                />
                <text
                  x="50"
                  y="37.3"
                  textAnchor="middle"
                  fontSize="9.2"
                  fontWeight="800"
                  fontFamily="monospace"
                  letterSpacing="1"
                  fill={symbolFill}
                >
                  GATE
                </text>
                <path
                  d="M27 48 C34 45 43 45 50 49.5 C57 45 66 45 73 48 V67 C66 64 57 64 50 68.5 C43 64 34 64 27 67 Z"
                  fill={symbolFill}
                  fillOpacity="0.85"
                  stroke={strokeMain}
                  strokeOpacity="0.45"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <line x1="50" y1="49.5" x2="50" y2="68.5" stroke="#0B111B" strokeOpacity="0.5" strokeWidth="1.5" />
                <line x1="33" y1="53.5" x2="44" y2="53.5" stroke={accentFill} strokeWidth="1.4" strokeLinecap="round" />
                <line x1="56" y1="53.5" x2="67" y2="53.5" stroke={accentFill} strokeWidth="1.4" strokeLinecap="round" />
              </g>
            );

          case 'interview_first':
            // Microprocessor chip
            return (
              <g>
                <line x1="40" y1="24" x2="40" y2="32" stroke={symbolFill} strokeWidth="2.4" strokeLinecap="round" />
                <line x1="50" y1="24" x2="50" y2="32" stroke={symbolFill} strokeWidth="2.4" strokeLinecap="round" />
                <line x1="60" y1="24" x2="60" y2="32" stroke={symbolFill} strokeWidth="2.4" strokeLinecap="round" />
                <line x1="40" y1="68" x2="40" y2="76" stroke={symbolFill} strokeWidth="2.4" strokeLinecap="round" />
                <line x1="50" y1="68" x2="50" y2="76" stroke={symbolFill} strokeWidth="2.4" strokeLinecap="round" />
                <line x1="60" y1="68" x2="60" y2="76" stroke={symbolFill} strokeWidth="2.4" strokeLinecap="round" />
                <line x1="24" y1="40" x2="32" y2="40" stroke={symbolFill} strokeWidth="2.4" strokeLinecap="round" />
                <line x1="24" y1="50" x2="32" y2="50" stroke={symbolFill} strokeWidth="2.4" strokeLinecap="round" />
                <line x1="24" y1="60" x2="32" y2="60" stroke={symbolFill} strokeWidth="2.4" strokeLinecap="round" />
                <line x1="68" y1="40" x2="76" y2="40" stroke={symbolFill} strokeWidth="2.4" strokeLinecap="round" />
                <line x1="68" y1="50" x2="76" y2="50" stroke={symbolFill} strokeWidth="2.4" strokeLinecap="round" />
                <line x1="68" y1="60" x2="76" y2="60" stroke={symbolFill} strokeWidth="2.4" strokeLinecap="round" />
                <rect
                  x="32"
                  y="32"
                  width="36"
                  height="36"
                  rx="6"
                  fill="#0A1429"
                  fillOpacity="0.86"
                  stroke={symbolFill}
                  strokeWidth="2.4"
                />
                <rect
                  x="40"
                  y="40"
                  width="20"
                  height="20"
                  rx="3"
                  fill={accentFill}
                  fillOpacity="0.85"
                  stroke="#FFFFFF"
                  strokeOpacity="0.5"
                  strokeWidth="1.1"
                />
                <polygon points="50,44 55,47 55,53 50,56 45,53 45,47" fill={symbolFill} />
              </g>
            );

          case 'community_helper':
            // Justice scales
            return (
              <g>
                <line x1="50" y1="26" x2="50" y2="68" stroke={symbolFill} strokeWidth="3" strokeLinecap="round" />
                <line x1="37" y1="68" x2="63" y2="68" stroke={symbolFill} strokeWidth="3.4" strokeLinecap="round" />
                <circle cx="50" cy="26" r="2.8" fill={accentFill} />
                <line x1="30" y1="35" x2="70" y2="35" stroke={symbolFill} strokeWidth="2.8" strokeLinecap="round" />
                <path
                  d="M30 35 L23 50 H37 Z"
                  fill="none"
                  stroke={symbolFill}
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M22.5 50 C24.5 55.5 35.5 55.5 37.5 50 Z"
                  fill={accentFill}
                />
                <path
                  d="M70 35 L63 50 H77 Z"
                  fill="none"
                  stroke={symbolFill}
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M62.5 50 C64.5 55.5 75.5 55.5 77.5 50 Z"
                  fill={accentFill}
                />
              </g>
            );

          default:
            return (
              <polygon
                points="50,27 68,38 68,62 50,73 32,62 32,38"
                fill={symbolFill}
              />
            );
        }
      })()}
    </g>
  );
};

/**
 * Hexagonal Front Face of the Collectible 3D Medallion.
 * Can also render standalone at micro scales (e.g. inside ProfileCard).
 */
export const MedallionFrontFace = ({
  badgeId,
  metalTheme,
  isUnlocked = true,
  showLockedPadlock = true,
  className = '',
}) => {
  const isDark = useSafeIsDark();
  const uid = useId().replace(/:/g, '');
  const p = resolveMetalPalette(badgeId, metalTheme, isUnlocked);

  const faceCenter = isDark ? p.faceCenter : p.faceCenterLight;
  const faceMid = isDark ? p.faceMid : p.faceMidLight;
  const faceEdge = isDark ? p.faceEdge : p.faceEdgeLight;

  return (
    <div className={`relative w-full h-full ${className}`} data-face="front">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full block"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`rim-${uid}`} x1="12%" y1="4%" x2="88%" y2="96%">
            <stop offset="0%" stopColor={p.rimHighlight} />
            <stop offset="28%" stopColor={p.rimMid} />
            <stop offset="68%" stopColor={p.rimStart} />
            <stop offset="100%" stopColor={p.rimEnd} />
          </linearGradient>

          <linearGradient id={`bevel-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={p.bevelDark} />
            <stop offset="48%" stopColor={p.bevelLight} />
            <stop offset="100%" stopColor={p.bevelDark} />
          </linearGradient>

          <radialGradient id={`well-${uid}`} cx="44%" cy="34%" r="68%">
            <stop offset="0%" stopColor={faceCenter} />
            <stop offset="58%" stopColor={faceMid} />
            <stop offset="100%" stopColor={faceEdge} />
          </radialGradient>

          <linearGradient id={`sheen-${uid}`} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={isDark ? '0.22' : '0.36'} />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
          </linearGradient>

          <linearGradient id={`sym-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={p.symbolStart} />
            <stop offset="100%" stopColor={p.symbolEnd} />
          </linearGradient>

          <linearGradient id={`acc-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={p.symbolAccent} />
            <stop offset="100%" stopColor={p.symbolEnd} />
          </linearGradient>

          <filter id={`emboss-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.4" stdDeviation="1.3" floodColor="#000000" floodOpacity="0.55" />
          </filter>
        </defs>

        {/* Outer forged metallic hexagonal frame */}
        <polygon points={MEDAL_HEX_OUTER} fill={`url(#rim-${uid})`} />

        {/* Chamfered inner step bevel */}
        <polygon points={MEDAL_HEX_BEVEL} fill={`url(#bevel-${uid})`} />

        {/* Recessed coin center well */}
        <polygon points={MEDAL_HEX_INNER} fill={`url(#well-${uid})`} />

        {/* Engraved subtle double ring border inside recessed face */}
        <polygon
          points={MEDAL_HEX_INSET}
          fill="none"
          stroke={p.rimMid}
          strokeWidth="0.65"
          strokeOpacity={isUnlocked ? '0.35' : '0.18'}
        />

        {/* Central embossed achievement symbol */}
        <MedallionSymbol
          badgeId={badgeId}
          symbolGradId={`sym-${uid}`}
          accentGradId={`acc-${uid}`}
          shadowFilterId={`emboss-${uid}`}
          isUnlocked={isUnlocked}
        />

        {/* Metallic specular edge reflection overlay */}
        <polygon
          points={MEDAL_HEX_INNER}
          fill={`url(#sheen-${uid})`}
          pointerEvents="none"
        />
        <polygon
          points={MEDAL_HEX_OUTER}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.6"
          strokeOpacity={isUnlocked ? '0.38' : '0.15'}
        />
      </svg>

      {!isUnlocked && showLockedPadlock && (
        <span
          aria-hidden="true"
          className="absolute right-0.5 bottom-0.5 grid place-items-center w-5 h-5 rounded-full bg-card border border-surface-700 text-surface-400 shadow-sm"
        >
          <Lock className="w-2.5 h-2.5" strokeWidth={2.1} />
        </span>
      )}
    </div>
  );
};

/**
 * Collectible Coin Reverse Face (rotateY(180deg) face on 3D medallion).
 * Features matching hex rim, dark recessed bed, engraved circular/hex patterns,
 * EngineerOS OS monogram emblem, and engraved achievement identifier.
 */
export const MedallionReverseFace = ({
  badgeId,
  metalTheme,
  isUnlocked = true,
  className = '',
}) => {
  const isDark = useSafeIsDark();
  const uid = useId().replace(/:/g, '');
  const meta = getBadgeMeta(badgeId);
  const p = resolveMetalPalette(badgeId, metalTheme, isUnlocked);

  const faceCenter = isDark ? p.faceCenter : p.faceCenterLight;
  const faceEdge = isDark ? p.faceEdge : p.faceEdgeLight;

  const spokes = Array.from({ length: 12 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 12;
    return {
      x2: (50 + 36 * Math.cos(a)).toFixed(1),
      y2: (50 + 36 * Math.sin(a)).toFixed(1),
    };
  });

  const studs = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return {
      cx: (50 + 36 * Math.cos(a)).toFixed(1),
      cy: (50 + 36 * Math.sin(a)).toFixed(1),
    };
  });

  return (
    <div className={`relative w-full h-full ${className}`} data-face="back">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full block"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`bk-rim-${uid}`} x1="88%" y1="4%" x2="12%" y2="96%">
            <stop offset="0%" stopColor={p.rimHighlight} />
            <stop offset="35%" stopColor={p.rimMid} />
            <stop offset="72%" stopColor={p.rimStart} />
            <stop offset="100%" stopColor={p.rimEnd} />
          </linearGradient>

          <radialGradient id={`bk-well-${uid}`} cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor={faceCenter} />
            <stop offset="100%" stopColor={faceEdge} />
          </radialGradient>
        </defs>

        {/* Outer metallic hex border */}
        <polygon points={MEDAL_HEX_OUTER} fill={`url(#bk-rim-${uid})`} />

        {/* Bevel step */}
        <polygon points={MEDAL_HEX_BEVEL} fill={p.bevelDark} />

        {/* Dark recessed reverse coin bed */}
        <polygon points={MEDAL_HEX_INNER} fill={`url(#bk-well-${uid})`} />

        {/* Engraved concentric circular & hex filigree */}
        <polygon
          points={hexRingPoints(37)}
          fill="none"
          stroke={p.rimMid}
          strokeWidth="0.45"
          strokeOpacity="0.28"
        />
        <circle
          cx="50"
          cy="50"
          r="26"
          fill="none"
          stroke={p.rimMid}
          strokeWidth="0.45"
          strokeOpacity="0.24"
        />
        <polygon
          points={hexRingPoints(18)}
          fill="none"
          stroke={p.rimMid}
          strokeWidth="0.55"
          strokeOpacity="0.34"
        />

        {/* Guilloche radial spokes */}
        {spokes.map((s, idx) => (
          <line
            key={idx}
            x1="50"
            y1="50"
            x2={s.x2}
            y2={s.y2}
            stroke={p.rimMid}
            strokeWidth="0.28"
            strokeOpacity="0.16"
          />
        ))}

        {/* 6 Hex corner rivets */}
        {studs.map((st, idx) => (
          <circle
            key={idx}
            cx={st.cx}
            cy={st.cy}
            r="1.3"
            fill={p.rimMid}
            fillOpacity="0.48"
          />
        ))}

        {/* Raised central OS Monogram Seal */}
        <polygon
          points={hexRingPoints(13.5)}
          fill={p.rimStart}
          fillOpacity="0.32"
          stroke={p.rimMid}
          strokeWidth="1"
          strokeOpacity="0.7"
        />
        <text
          x="50"
          y="50.5"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11.5"
          fontWeight="900"
          fontFamily="monospace"
          letterSpacing="-0.5"
          fill={p.rimHighlight}
          opacity={isUnlocked ? '0.92' : '0.45'}
        >
          OS
        </text>

        {/* Engraved Achievement Identifier & Tier code */}
        <line
          x1="34"
          y1="67"
          x2="66"
          y2="67"
          stroke={p.rimMid}
          strokeWidth="0.4"
          strokeOpacity="0.32"
        />
        <text
          x="50"
          y="73.5"
          textAnchor="middle"
          fontSize="5.6"
          fontFamily="monospace"
          fontWeight="700"
          letterSpacing="1.4"
          fill={p.rimHighlight}
          opacity={isUnlocked ? '0.72' : '0.42'}
        >
          {meta.shortCode || 'OS-MEDAL'}
        </text>
        <text
          x="50"
          y="28.5"
          textAnchor="middle"
          fontSize="4.6"
          fontFamily="monospace"
          fontWeight="700"
          letterSpacing="1.6"
          fill={p.rimMid}
          opacity={isUnlocked ? '0.62' : '0.35'}
        >
          ENGINEEROS
        </text>
      </svg>
    </div>
  );
};
