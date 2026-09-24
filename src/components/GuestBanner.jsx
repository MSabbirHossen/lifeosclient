import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, X, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const GuestBanner = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('lifeos_guest_banner_dismissed') === 'true';
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('lifeos_guest_banner_dismissed', 'true');
    } catch (e) {}
  };

  return (
    <div className="relative overflow-hidden mb-5 rounded-2xl bg-gradient-to-r from-[#003459]/90 via-[#007EA7]/80 to-[#00A8E8]/90 text-white p-3.5 sm:p-4 shadow-lg border border-cyan-400/30 backdrop-blur-md animate-fade-in">
      {/* Subtle background glow element */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md text-cyan-100 border border-white/25">
                Preview Mode
              </span>
              <p className="text-xs sm:text-sm font-bold text-white leading-snug">
                You are currently exploring Life OS without an account.
              </p>
            </div>
            <p className="text-[11px] sm:text-xs text-cyan-100 mt-0.5 font-medium leading-normal">
              Any data or changes you input will not be saved. Sign in or create a free account to store and sync your progress.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end pt-1 sm:pt-0">
          <button
            onClick={() => navigate('/login')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#003459] font-extrabold text-xs hover:bg-cyan-50 hover:shadow-md transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <span>Sign In to Save</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl hover:bg-white/15 text-cyan-100 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Dismiss preview notice for this session"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestBanner;
