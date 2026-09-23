import React from 'react';
import { Logo } from './Logo';

/**
 * Premium Life OS Loading Screen & Page Loader
 * 
 * @param {Object} props
 * @param {boolean} [props.fullScreen=true] - When true, takes up entire viewport; when false, fills parent container
 * @param {string} [props.message='Loading Life OS...'] - Primary message text
 * @param {string} [props.subMessage] - Secondary hint or motivational text
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='lg'] - Logo size
 * @param {string} [props.className=''] - Extra classes
 */
export const LoadingScreen = ({
  fullScreen = true,
  message = 'Loading Life OS...',
  subMessage,
  size = 'lg',
  className = '',
}) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 min-h-screen bg-bg/95 backdrop-blur-md flex items-center justify-center'
    : 'w-full py-16 flex items-center justify-center';

  return (
    <div className={`${containerClasses} ${className}`} role="status" aria-live="polite">
      {/* Background ambient lighting */}
      <div className="absolute w-72 h-72 rounded-full bg-[#007EA7]/10 blur-3xl pointer-events-none" />
      <div className="absolute w-60 h-60 rounded-full bg-[#003459]/10 blur-3xl pointer-events-none translate-x-12 translate-y-12" />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm">
        {/* Animated Brand Logo with Loading Halo & Pulse */}
        <div className="mb-6 relative">
          <Logo size={size} loading={true} animated={true} />
        </div>

        {/* Primary Loading Message */}
        <h3 className="text-sm sm:text-base font-bold text-primary tracking-tight mb-1 flex items-center gap-1.5">
          <span>{message}</span>
        </h3>

        {/* Shimmering Progress Bar */}
        <div className="w-36 h-1 bg-subtle rounded-full overflow-hidden my-2.5 border border-theme/40 relative">
          <div className="h-full bg-gradient-to-r from-[#003459] via-[#007EA7] to-[#00A8E8] rounded-full w-1/2 animate-[shimmer_1.5s_infinite_linear]" 
               style={{
                 animation: 'indeterminateProgress 1.4s ease-in-out infinite'
               }}
          />
        </div>

        {/* Sub-message or Hint */}
        {subMessage && (
          <p className="text-xs text-secondary font-medium mt-1 animate-pulse">
            {subMessage}
          </p>
        )}
      </div>

      <style>{`
        @keyframes indeterminateProgress {
          0% {
            transform: translateX(-100%) scaleX(0.4);
          }
          50% {
            transform: translateX(50%) scaleX(0.8);
          }
          100% {
            transform: translateX(200%) scaleX(0.4);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
