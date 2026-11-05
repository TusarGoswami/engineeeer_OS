import { useRef, useEffect } from 'react';

/**
 * BongoCatCoder Component
 *
 * A production-grade animated SVG mascot depicting Bongo Cat coding on a laptop.
 * Layer hierarchy:
 * 1. Background & floor ambient glow
 * 2. Floating developer tokens & sparkles
 * 3. Desk platform
 * 4. BACK LAYER: Cat character (ears, full head, face, eyes, cheeks, mouth, neck, shoulders)
 * 5. FRONT LAYER: Laptop (screen, code terminal, keyboard, trackpad, base)
 * 6. MIDDLE / FOREGROUND LAYER: Paws (emerging around screen, typing on keyboard)
 * 7. Desk accessories: Coffee mug with EngineerOS logo & rising steam
 */
export const BongoCatCoder = ({ className = '' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Scoped mascot animation lifecycle
    return () => {
      // Cleanup on unmount
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative flex h-full w-full max-h-full max-w-full items-center justify-center select-none pointer-events-none ${className}`}
      aria-label="EngineerOS animated Bongo Cat coder mascot"
      role="img"
    >
      {/* Ambient background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background:
            'radial-gradient(circle at 50% 60%, rgba(255, 101, 0, 0.12) 0%, rgba(255, 101, 0, 0.03) 45%, transparent 70%)',
        }}
      />

      <svg
        viewBox="0 0 540 385"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block h-full w-full max-h-full max-w-full drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
      >
        <defs>
          {/* Ambient desk glow gradient */}
          <radialGradient id="bongoAmbientGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF6500" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#FF6500" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#FF6500" stopOpacity="0" />
          </radialGradient>

          {/* Cat body gradient */}
          <linearGradient id="catBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF7ED" />
            <stop offset="70%" stopColor="#FED7AA" />
            <stop offset="100%" stopColor="#FDBA74" />
          </linearGradient>

          {/* Cat head gradient */}
          <radialGradient id="catHeadGrad" cx="50%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#FED7AA" />
            <stop offset="100%" stopColor="#FDBA74" />
          </radialGradient>

          {/* Laptop display subtle glow */}
          <linearGradient id="screenGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FF6500" stopOpacity="0.05" />
          </linearGradient>

          {/* Desk surface gradient */}
          <linearGradient id="deskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#181D26" />
            <stop offset="100%" stopColor="#0F1218" />
          </linearGradient>

          {/* Floating badge gradient */}
          <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1B202B" />
            <stop offset="100%" stopColor="#12161F" />
          </linearGradient>
        </defs>

        <style>
          {`
            @keyframes bongoPawLeft {
              0%, 100% {
                transform: translateY(0px) rotate(0deg);
              }
              50% {
                transform: translateY(8px) rotate(-3.5deg);
              }
            }

            @keyframes bongoPawRight {
              0%, 100% {
                transform: translateY(8px) rotate(3.5deg);
              }
              50% {
                transform: translateY(0px) rotate(0deg);
              }
            }

            @keyframes bongoHeadIdle {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(1.5px);
              }
            }

            @keyframes bongoBlinkCaret {
              0%, 48% { opacity: 1; }
              50%, 100% { opacity: 0; }
            }

            @keyframes bongoFloatA {
              0%, 100% {
                transform: translateY(0px) rotate(0deg);
              }
              50% {
                transform: translateY(-8px) rotate(-2deg);
              }
            }

            @keyframes bongoFloatB {
              0%, 100% {
                transform: translateY(0px) rotate(0deg);
              }
              50% {
                transform: translateY(-9px) rotate(2.5deg);
              }
            }

            @keyframes bongoFloatC {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-6px);
              }
            }

            @keyframes bongoSparklePulse {
              0%, 100% {
                opacity: 0.25;
                transform: scale(0.85);
              }
              50% {
                opacity: 0.95;
                transform: scale(1.15);
              }
            }

            @keyframes bongoSteamRise {
              0% {
                opacity: 0;
                transform: translateY(2px) scaleX(0.9);
              }
              50% {
                opacity: 0.45;
              }
              100% {
                opacity: 0;
                transform: translateY(-8px) scaleX(1.1);
              }
            }

            .bongo-paw-left-anim {
              animation: bongoPawLeft 0.26s cubic-bezier(0.4, 0, 0.2, 1) infinite;
              transform-origin: 170px 275px;
            }

            .bongo-paw-right-anim {
              animation: bongoPawRight 0.26s cubic-bezier(0.4, 0, 0.2, 1) infinite;
              transform-origin: 370px 275px;
            }

            .bongo-head-anim {
              animation: bongoHeadIdle 3.2s ease-in-out infinite;
              transform-origin: 270px 135px;
            }

            .bongo-caret-anim {
              animation: bongoBlinkCaret 0.95s infinite;
            }

            .bongo-float-1 {
              animation: bongoFloatA 4.2s ease-in-out infinite;
              transform-origin: 77px 119px;
            }

            .bongo-float-2 {
              animation: bongoFloatB 4.8s ease-in-out infinite 0.5s;
              transform-origin: 466px 115px;
            }

            .bongo-float-3 {
              animation: bongoFloatC 3.8s ease-in-out infinite 1.2s;
              transform-origin: 458px 211px;
            }

            .bongo-sparkle-1 {
              animation: bongoSparklePulse 2.4s ease-in-out infinite;
              transform-origin: 120px 55px;
            }

            .bongo-sparkle-2 {
              animation: bongoSparklePulse 2.8s ease-in-out infinite 0.7s;
              transform-origin: 425px 52px;
            }

            .bongo-sparkle-3 {
              animation: bongoSparklePulse 3.1s ease-in-out infinite 1.4s;
              transform-origin: 270px 26px;
            }

            .bongo-steam-anim {
              animation: bongoSteamRise 2.5s ease-out infinite;
              transform-origin: 98px 275px;
            }

            @media (prefers-reduced-motion: reduce) {
              .bongo-paw-left-anim,
              .bongo-paw-right-anim,
              .bongo-head-anim,
              .bongo-caret-anim,
              .bongo-float-1,
              .bongo-float-2,
              .bongo-float-3,
              .bongo-sparkle-1,
              .bongo-sparkle-2,
              .bongo-sparkle-3,
              .bongo-steam-anim {
                animation: none !important;
              }
            }
          `}
        </style>

        {/* ── 1. Floor Ambient Glow ─────────────────────────────────── */}
        <ellipse cx="270" cy="360" rx="215" ry="18" fill="url(#bongoAmbientGlow)" />

        {/* ── 2. Floating Developer Tokens & Sparkles ──────────────── */}
        {/* Token 1: { } Curly Braces */}
        <g className="bongo-float-1">
          <rect
            x="56"
            y="100"
            width="42"
            height="38"
            rx="10"
            fill="url(#badgeGrad)"
            stroke="#292E38"
            strokeWidth="1.2"
          />
          <text
            x="77"
            y="125"
            fontSize="18"
            fontFamily="monospace"
            fontWeight="bold"
            fill="#FF6500"
            textAnchor="middle"
          >
            {'{ }'}
          </text>
        </g>

        {/* Token 2: </> Code Tag */}
        <g className="bongo-float-2">
          <rect
            x="442"
            y="96"
            width="48"
            height="38"
            rx="10"
            fill="url(#badgeGrad)"
            stroke="#292E38"
            strokeWidth="1.2"
          />
          <text
            x="466"
            y="120"
            fontSize="14"
            fontFamily="monospace"
            fontWeight="bold"
            fill="#38BDF8"
            textAnchor="middle"
          >
            {'</>'}
          </text>
        </g>

        {/* Token 3: 01 Binary Pill */}
        <g className="bongo-float-3">
          <rect
            x="440"
            y="200"
            width="36"
            height="22"
            rx="7"
            fill="url(#badgeGrad)"
            stroke="#292E38"
            strokeWidth="1.2"
          />
          <text
            x="458"
            y="215"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            fill="#A1A1AA"
            textAnchor="middle"
          >
            01
          </text>
        </g>

        {/* Subtle twinkling stars */}
        <path
          className="bongo-sparkle-1"
          d="M 120 55 Q 120 63 128 63 Q 120 63 120 71 Q 120 63 112 63 Q 120 63 120 55 Z"
          fill="#FFB15C"
        />
        <path
          className="bongo-sparkle-2"
          d="M 425 52 Q 425 60 433 60 Q 425 60 425 68 Q 425 60 417 60 Q 425 60 425 52 Z"
          fill="#38BDF8"
        />
        <path
          className="bongo-sparkle-3"
          d="M 270 26 Q 270 31 275 31 Q 270 31 270 36 Q 270 31 265 31 Q 270 31 270 26 Z"
          fill="#FF6500"
        />

        {/* ── 3. Desk Platform Surface ─────────────────────────────── */}
        <g id="desk-platform">
          <polygon
            points="20,366 520,366 476,322 64,322"
            fill="url(#deskGrad)"
            stroke="#292E38"
            strokeWidth="1.5"
          />
          {/* Desk front highlight chamfer */}
          <line
            x1="20"
            y1="366"
            x2="520"
            y2="366"
            stroke="#374151"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* ── 4. BACK LAYER: CAT CHARACTER (Fully visible behind laptop) ── */}
        <g id="cat-character" className="bongo-head-anim">
          {/* Cat Torso / Shoulders (visible flanking the laptop screen) */}
          <path
            d="M 148 306 C 140 238, 182 186, 270 186 C 358 186, 400 238, 392 306 Z"
            fill="url(#catBodyGrad)"
            stroke="#D97706"
            strokeWidth="1.5"
          />

          {/* Left Ear */}
          <path
            d="M 202 122 Q 180 52 218 64 Q 238 80 238 114 Z"
            fill="url(#catHeadGrad)"
            stroke="#D97706"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Left Inner Ear (Pink) */}
          <path
            d="M 208 112 Q 194 70 218 78 Q 230 89 230 106 Z"
            fill="#FDA4AF"
            opacity="0.85"
          />

          {/* Right Ear */}
          <path
            d="M 338 122 Q 360 52 322 64 Q 302 80 302 114 Z"
            fill="url(#catHeadGrad)"
            stroke="#D97706"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Right Inner Ear (Pink) */}
          <path
            d="M 332 112 Q 346 70 322 78 Q 310 89 310 106 Z"
            fill="#FDA4AF"
            opacity="0.85"
          />

          {/* Cat Head (Chubby, completely above laptop screen) */}
          <ellipse
            cx="270"
            cy="135"
            rx="82"
            ry="64"
            fill="url(#catHeadGrad)"
            stroke="#D97706"
            strokeWidth="1.5"
          />

          {/* Rosy Cheeks */}
          <ellipse cx="224" cy="152" rx="11" ry="6.5" fill="#FDA4AF" opacity="0.55" />
          <ellipse cx="316" cy="152" rx="11" ry="6.5" fill="#FDA4AF" opacity="0.55" />

          {/* Left Focused Coder Eye (Happy curved arc) */}
          <path
            d="M 228 136 Q 240 127 252 136"
            stroke="#181D26"
            strokeWidth="3.4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Right Focused Coder Eye (Happy curved arc) */}
          <path
            d="M 288 136 Q 300 127 312 136"
            stroke="#181D26"
            strokeWidth="3.4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Little Pink Triangle Nose */}
          <polygon points="266,148 274,148 270,153" fill="#FB7185" />

          {/* Iconic Cat ω Mouth */}
          <path
            d="M 261 155 Q 265.5 160 270 155 Q 274.5 160 279 155"
            stroke="#181D26"
            strokeWidth="2.3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Whiskers */}
          <line
            x1="180"
            y1="145"
            x2="210"
            y2="147"
            stroke="#D97706"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.5"
          />
          <line
            x1="179"
            y1="155"
            x2="210"
            y2="153"
            stroke="#D97706"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.5"
          />
          <line
            x1="330"
            y1="147"
            x2="360"
            y2="145"
            stroke="#D97706"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.5"
          />
          <line
            x1="330"
            y1="153"
            x2="361"
            y2="155"
            stroke="#D97706"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.5"
          />
        </g>

        {/* ── 5. FRONT LAYER: LAPTOP (Screen and Base) ──────────────── */}
        {/* Laptop Display (Open Screen in front of lower body) */}
        <g id="laptop-screen">
          {/* Outer Slate Frame (Top at y=208, well below cat's chin at y=199) */}
          <rect
            x="166"
            y="208"
            width="208"
            height="90"
            rx="8"
            fill="#151922"
            stroke="#292E38"
            strokeWidth="1.8"
          />

          {/* Inner Display Area */}
          <rect
            x="174"
            y="216"
            width="192"
            height="74"
            rx="5"
            fill="#090C12"
            stroke="#1E232F"
            strokeWidth="1"
          />

          {/* Ambient Terminal Colorwash */}
          <rect
            x="174"
            y="216"
            width="192"
            height="74"
            rx="5"
            fill="url(#screenGlowGrad)"
          />

          {/* Title Bar Window Controls */}
          <circle cx="184" cy="223" r="2.4" fill="#EF4444" />
          <circle cx="191" cy="223" r="2.4" fill="#F59E0B" />
          <circle cx="198" cy="223" r="2.4" fill="#10B981" />

          {/* IDE Active File Tab */}
          <rect x="208" y="219" width="54" height="8.5" rx="2.5" fill="#151922" />
          <text
            x="235"
            y="225.5"
            fontSize="6"
            fontFamily="monospace"
            fill="#D4D4D8"
            textAnchor="middle"
          >
            main.ts
          </text>
          <circle cx="214" cy="223" r="1.2" fill="#FF6500" />

          {/* Code Lines inside Terminal */}
          <text
            x="180"
            y="238"
            fontSize="6.5"
            fontFamily="monospace"
            fill="#475569"
            textAnchor="start"
          >
            1
          </text>
          <text x="189" y="238" fontSize="6.5" fontFamily="monospace" textAnchor="start">
            <tspan fill="#38BDF8">const</tspan> <tspan fill="#F4F4F5">dev</tspan> ={' '}
            <tspan fill="#FF6500">useEngineerOS</tspan>();
          </text>

          <text
            x="180"
            y="249"
            fontSize="6.5"
            fontFamily="monospace"
            fill="#475569"
            textAnchor="start"
          >
            2
          </text>
          <text x="189" y="249" fontSize="6.5" fontFamily="monospace" textAnchor="start">
            <tspan fill="#38BDF8">await</tspan> <tspan fill="#FFB15C">dev</tspan>.
            <tspan fill="#34D399">masterSkills</tspan>();
          </text>

          <text
            x="180"
            y="260"
            fontSize="6.5"
            fontFamily="monospace"
            fill="#475569"
            textAnchor="start"
          >
            3
          </text>
          <text x="189" y="260" fontSize="6.5" fontFamily="monospace" textAnchor="start">
            <tspan fill="#A1A1AA">{'// Status: 100% Ready'}</tspan>
          </text>

          <text
            x="180"
            y="271"
            fontSize="6.5"
            fontFamily="monospace"
            fill="#475569"
            textAnchor="start"
          >
            4
          </text>
          <text x="189" y="271" fontSize="6.5" fontFamily="monospace" textAnchor="start">
            <tspan fill="#FF6500">return</tspan> <tspan fill="#38BDF8">launchCode</tspan>();
          </text>

          {/* Blinking Caret on Active Code Line */}
          <rect
            className="bongo-caret-anim"
            x="272"
            y="264"
            width="2.2"
            height="8"
            rx="0.5"
            fill="#FF6500"
          />

          {/* Mini Live Status Pill */}
          <rect
            x="308"
            y="273"
            width="50"
            height="11"
            rx="3.5"
            fill="#121620"
            stroke="#202634"
            strokeWidth="0.8"
          />
          <circle cx="315" cy="278.5" r="2" fill="#10B981" />
          <text
            x="320"
            y="280.5"
            fontSize="5"
            fontFamily="monospace"
            fontWeight="bold"
            fill="#10B981"
          >
            CONNECTED
          </text>
        </g>

        {/* Laptop Keyboard & Base */}
        <g id="laptop-base">
          {/* Base Chassis */}
          <polygon
            points="136,338 404,338 384,295 156,295"
            fill="#1A1F29"
            stroke="#292E38"
            strokeWidth="1.5"
          />

          {/* Keyboard Well */}
          <polygon
            points="152,331 388,331 372,298 168,298"
            fill="#0E1118"
            stroke="#242B38"
            strokeWidth="1"
          />

          {/* Keyboard Chiclet Keys */}
          {/* Row 1 */}
          <rect x="174" y="300" width="13" height="4" rx="1" fill="#202633" />
          <rect x="190" y="300" width="13" height="4" rx="1" fill="#202633" />
          <rect x="206" y="300" width="13" height="4" rx="1" fill="#202633" />
          <rect x="222" y="300" width="13" height="4" rx="1" fill="#202633" />
          <rect x="238" y="300" width="13" height="4" rx="1" fill="#202633" />
          <rect x="254" y="300" width="13" height="4" rx="1" fill="#202633" />
          <rect x="270" y="300" width="13" height="4" rx="1" fill="#202633" />
          <rect x="286" y="300" width="13" height="4" rx="1" fill="#202633" />
          <rect x="302" y="300" width="13" height="4" rx="1" fill="#202633" />
          <rect x="318" y="300" width="13" height="4" rx="1" fill="#202633" />
          <rect x="334" y="300" width="13" height="4" rx="1" fill="#202633" />
          <rect x="350" y="300" width="13" height="4" rx="1" fill="#202633" />

          {/* Row 2 */}
          <rect x="170" y="306" width="15" height="4.5" rx="1" fill="#202633" />
          <rect x="188" y="306" width="14" height="4.5" rx="1" fill="#202633" />
          <rect x="205" y="306" width="14" height="4.5" rx="1" fill="#202633" />
          <rect x="222" y="306" width="14" height="4.5" rx="1" fill="#202633" />
          <rect x="239" y="306" width="14" height="4.5" rx="1" fill="#202633" />
          <rect x="256" y="306" width="14" height="4.5" rx="1" fill="#202633" />
          <rect x="273" y="306" width="14" height="4.5" rx="1" fill="#202633" />
          <rect x="290" y="306" width="14" height="4.5" rx="1" fill="#202633" />
          <rect x="307" y="306" width="14" height="4.5" rx="1" fill="#202633" />
          <rect x="324" y="306" width="14" height="4.5" rx="1" fill="#202633" />
          <rect x="341" y="306" width="14" height="4.5" rx="1" fill="#202633" />
          <rect x="358" y="306" width="15" height="4.5" rx="1" fill="#202633" />

          {/* Row 3 (Spacebar row) */}
          <rect x="166" y="313" width="18" height="5" rx="1" fill="#202633" />
          <rect x="187" y="313" width="14" height="5" rx="1" fill="#202633" />
          <rect x="204" y="313" width="14" height="5" rx="1" fill="#202633" />
          {/* Spacebar */}
          <rect x="221" y="313" width="86" height="5" rx="1.5" fill="#262D3C" />
          <rect x="310" y="313" width="14" height="5" rx="1" fill="#202633" />
          <rect x="327" y="313" width="14" height="5" rx="1" fill="#202633" />
          <rect x="344" y="313" width="18" height="5" rx="1" fill="#202633" />

          {/* Trackpad */}
          <rect
            x="245"
            y="323"
            width="50"
            height="3.5"
            rx="1.5"
            fill="#232936"
            stroke="#2E3646"
            strokeWidth="0.8"
          />

          {/* Orange Front Lip Accent */}
          <line
            x1="248"
            y1="338"
            x2="292"
            y2="338"
            stroke="#FF6500"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* ── 6. MIDDLE/FOREGROUND LAYER: PAWS (Interacting with Keyboard) ── */}
        {/* Left Paw (emerges from around left side of laptop screen, taps on keyboard) */}
        <g className="bongo-paw-left-anim">
          <path
            d="M 168 274 C 158 290, 174 316, 206 316 C 220 316, 226 305, 218 292 C 210 279, 190 270, 168 274 Z"
            fill="url(#catHeadGrad)"
            stroke="#D97706"
            strokeWidth="1.5"
          />
          {/* Pink toe pads / beans */}
          <circle cx="210" cy="310" r="3" fill="#FDA4AF" opacity="0.85" />
          <circle cx="202" cy="312" r="2.5" fill="#FDA4AF" opacity="0.85" />
          <circle cx="217" cy="305" r="2.5" fill="#FDA4AF" opacity="0.85" />
        </g>

        {/* Right Paw (emerges from around right side of laptop screen, taps on keyboard) */}
        <g className="bongo-paw-right-anim">
          <path
            d="M 372 274 C 382 290, 366 316, 334 316 C 320 316, 314 305, 322 292 C 330 279, 350 270, 372 274 Z"
            fill="url(#catHeadGrad)"
            stroke="#D97706"
            strokeWidth="1.5"
          />
          {/* Pink toe pads / beans */}
          <circle cx="330" cy="310" r="3" fill="#FDA4AF" opacity="0.85" />
          <circle cx="338" cy="312" r="2.5" fill="#FDA4AF" opacity="0.85" />
          <circle cx="323" cy="305" r="2.5" fill="#FDA4AF" opacity="0.85" />
        </g>

        {/* ── 7. Desk Accessories: Coffee Mug in Foreground ────────── */}
        <g id="desk-accessories">
          {/* Mug shadow */}
          <ellipse cx="98" cy="328" rx="14" ry="4" fill="#0A0C10" opacity="0.6" />
          {/* Mug handle */}
          <path
            d="M 87 306 C 76 306, 76 324, 87 324"
            stroke="#292E38"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Mug body */}
          <rect
            x="88"
            y="298"
            width="24"
            height="29"
            rx="4"
            fill="#181D26"
            stroke="#292E38"
            strokeWidth="1.5"
          />
          {/* Orange EngineerOS badge on mug */}
          <rect x="94" y="307" width="12" height="12" rx="3" fill="#FF6500" />
          <text
            x="100"
            y="316"
            fontSize="7"
            fontFamily="system-ui, sans-serif"
            fontWeight="bold"
            fill="white"
            textAnchor="middle"
          >
            OS
          </text>
          {/* Steam swirl */}
          <path
            className="bongo-steam-anim"
            d="M 100 293 Q 96 285 101 277 Q 106 269 100 261"
            stroke="#A1A1AA"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
};

export default BongoCatCoder;
