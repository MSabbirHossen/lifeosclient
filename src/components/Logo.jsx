import React from 'react';

/**
 * Modern Life OS Brand Logo
 * 
 * @param {Object} props
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'2xl'|number} [props.size='md'] - Predefined or custom pixel size
 * @param {'default'|'glow'|'minimal'|'monochrome'} [props.variant='default']
 * @param {boolean} [props.animated=false] - Enables subtle ambient breathing
 * @param {boolean} [props.loading=false] - Enables active loading state with rotating halo & energy pulses
 * @param {boolean} [props.showText=false] - Displays brand name alongside the logo
 * @param {string} [props.subtitle] - Optional subtitle text when showText is true
 * @param {string} [props.className=''] - Additional container classes
 */
export const Logo = ({
  size = 'md',
  variant = 'default',
  animated = false,
  loading = false,
  showText = false,
  subtitle,
  className = '',
}) => {
  // Size mapping
  const sizeMap = {
    xs: 20,
    sm: 28,
    md: 38,
    lg: 48,
    xl: 64,
    '2xl': 88,
  };

  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 38;

  const uniqueId = React.useId().replace(/:/g, '_');
  const bgGradId = `lifeos-bg-${uniqueId}`;
  const coreGradId = `lifeos-core-${uniqueId}`;
  const accentGradId = `lifeos-accent-${uniqueId}`;
  const glowFilterId = `lifeos-glow-${uniqueId}`;
  const ringGradId = `lifeos-ring-${uniqueId}`;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: pixelSize, height: pixelSize }}
      >
        {/* Active Loading Outer Rotating Halo & Ambient Glow */}
        {(loading || variant === 'glow') && (
          <div
            className={`absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#003459] via-[#007EA7] to-[#00A8E8] opacity-40 blur-lg ${
              loading ? 'animate-pulse' : ''
            }`}
            aria-hidden="true"
          />
        )}

        {/* Loading Spinner Aura Ring */}
        {loading && (
          <div
            className="absolute -inset-1.5 rounded-2xl border-2 border-[#007EA7]/20 border-t-[#00A8E8] border-r-[#007EA7] animate-spin"
            style={{ animationDuration: '1.2s' }}
            aria-hidden="true"
          />
        )}

        {/* SVG Monogram Emblem */}
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full relative z-10 transition-transform duration-300 ${
            animated || loading ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''
          }`}
        >
          <defs>
            {/* Core Brand Gradient: Deep Space Blue -> Cerulean -> Fresh Sky */}
            <linearGradient id={coreGradId} x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#003459" />
              <stop offset="50%" stopColor="#007EA7" />
              <stop offset="100%" stopColor="#00A8E8" />
            </linearGradient>

            {/* Glowing Accent Gradient */}
            <linearGradient id={accentGradId} x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00A8E8" />
              <stop offset="100%" stopColor="#32CCFF" />
            </linearGradient>

            {/* Orbit Ring Gradient */}
            <linearGradient id={ringGradId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#003459" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#007EA7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00A8E8" stopOpacity="0.5" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id={glowFilterId} x="4" y="4" width="56" height="56" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Base Squircle Container */}
          {variant !== 'minimal' && (
            <rect
              x="2"
              y="2"
              width="60"
              height="60"
              rx="16"
              className="fill-slate-900/90 dark:fill-zinc-900/95 stroke-slate-800 dark:stroke-zinc-800"
              strokeWidth="1.5"
            />
          )}

          {/* Ambient Orbital Ring Track (The "O") */}
          <circle
            cx="32"
            cy="32"
            r="19"
            stroke={`url(#${ringGradId})`}
            strokeWidth="3.5"
            strokeDasharray="6 4"
            className={loading ? 'animate-[spin_6s_linear_infinite] origin-center' : ''}
          />

          {/* Stylized 'L' & Nucleus Geometry */}
          <g filter={variant === 'glow' || loading ? `url(#${glowFilterId})` : undefined}>
            {/* Modern Geometric 'L' Stem */}
            <path
              d="M23 18C23 16.3431 24.3431 15 26 15H27.5C29.1569 15 30.5 16.3431 30.5 18V33.5C30.5 34.6046 31.3954 35.5 32.5 35.5H44C45.6569 35.5 47 36.8431 47 38.5V40C47 41.6569 45.6569 43 44 43H26C24.3431 43 23 41.6569 23 40V18Z"
              fill={`url(#${coreGradId})`}
            />

            {/* Orbit Satellite Energy Node */}
            <circle
              cx="43"
              cy="21"
              r="4.5"
              fill={`url(#${accentGradId})`}
              className={loading ? 'animate-ping origin-center' : ''}
              style={{ animationDuration: '2s' }}
            />

            {/* Central Sparkle / Nucleus Core */}
            <circle cx="32" cy="32" r="3" fill="#FFFFFF" />
            <circle cx="32" cy="32" r="5" fill="#00A8E8" fillOpacity="0.5" />
          </g>
        </svg>
      </div>

      {/* Optional Brand Typography */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-[#003459] via-[#007EA7] to-[#00A8E8] dark:from-[#32CCFF] dark:via-[#76DDFF] dark:to-[#BEEFFF] bg-clip-text text-transparent">
              Life OS
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] text-secondary font-semibold uppercase tracking-wider mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
