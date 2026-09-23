import React, { useState } from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { RotateCcw, Sparkles, Award } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AdhkarCounter = () => {
  const { t } = useLanguage();

  const DHIKR_PRESETS = [
    { id: 'subhanAllah', text: t('adhkar.subhanAllah', 'SubhanAllah'), arabic: 'سُبْحَانَ اللَّهِ', meaning: t('adhkar.subhanAllahMeaning', 'Glory be to Allah'), target: 33 },
    { id: 'alhamdulillah', text: t('adhkar.alhamdulillah', 'Alhamdulillah'), arabic: 'الْحَمْدُ لِلَّهِ', meaning: t('adhkar.alhamdulillahMeaning', 'Praise be to Allah'), target: 33 },
    { id: 'allahuAkbar', text: t('adhkar.allahuAkbar', 'Allahu Akbar'), arabic: 'اللَّهُ أَكْبَرُ', meaning: t('adhkar.allahuAkbarMeaning', 'Allah is the Greatest'), target: 34 },
    { id: 'astaghfirullah', text: t('adhkar.astaghfirullah', 'Astaghfirullah'), arabic: 'أَسْتَغْفِرُ اللَّهَ', meaning: t('adhkar.astaghfirullahMeaning', 'I seek forgiveness from Allah'), target: 100 },
    { id: 'laIlahaIllallah', text: t('adhkar.laIlahaIllallah', 'La ilaha illallah'), arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', meaning: t('adhkar.laIlahaIllallahMeaning', 'There is no god but Allah'), target: 100 },
    { id: 'salawat', text: t('adhkar.salawat', 'Salawat ﷺ'), arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', meaning: t('adhkar.salawatMeaning', 'Peace & blessings upon Muhammad ﷺ'), target: 100 },
  ];

  const [selectedDhikr, setSelectedDhikr] = useState(DHIKR_PRESETS[0]);
  const [count, setCount] = useState(0);
  const [totalLaps, setTotalLaps] = useState(0);
  const [isTapping, setIsTapping] = useState(false);
  const [justCompletedLap, setJustCompletedLap] = useState(false);

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(count / selectedDhikr.target, 1);
  const strokeDashoffset = circumference - progress * circumference;

  const handleIncrement = () => {
    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 140);

    const nextCount = count + 1;
    if (nextCount >= selectedDhikr.target) {
      setCount(0);
      setTotalLaps((prev) => prev + 1);
      setJustCompletedLap(true);
      setTimeout(() => setJustCompletedLap(false), 1500);
    } else {
      setCount(nextCount);
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (count > 0) {
      setCount((prev) => prev - 1);
    }
  };

  const handleAddTen = (e) => {
    e.stopPropagation();
    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 140);
    const nextCount = count + 10;
    if (nextCount >= selectedDhikr.target) {
      const extra = nextCount - selectedDhikr.target;
      setCount(extra);
      setTotalLaps((prev) => prev + 1);
      setJustCompletedLap(true);
      setTimeout(() => setJustCompletedLap(false), 1500);
    } else {
      setCount(nextCount);
    }
  };

  const handleReset = () => {
    setCount(0);
    setTotalLaps(0);
  };

  const handleSelectDhikr = (d) => {
    setSelectedDhikr(d);
    setCount(0);
  };

  return (
    <Card
      hover
      title={t('adhkar.title', 'Adhkar & Tasbih Counter')}
      subtitle={t('adhkar.subtitle', 'Digital remembrance counter with authentic targets.')}
      icon={Sparkles}
      badge={<Badge variant="success" size="xs">Deen</Badge>}
    >
      <div className="flex flex-col space-y-3.5 pt-1">
        {/* Dhikr Presets Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DHIKR_PRESETS.map((d) => {
            const isSelected = selectedDhikr.id === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => handleSelectDhikr(d)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-500/15 text-emerald-950 dark:text-emerald-300 border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/30 font-black'
                    : 'bg-subtle text-primary border-theme hover:bg-surface hover:border-theme-strong font-bold'
                }`}
              >
                <span className="truncate">{d.text}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 font-bold ${
                    isSelected
                      ? 'bg-emerald-500/25 text-emerald-950 dark:text-emerald-300'
                      : 'bg-surface border border-theme text-secondary font-bold'
                  }`}
                >
                  {d.target}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Dhikr Display Card */}
        <div className="text-center py-2.5 px-3 bg-gradient-to-b from-subtle/80 to-subtle rounded-2xl border border-theme/80 relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-50 pointer-events-none" />
          <p className="text-xl sm:text-2xl font-bold font-serif text-primary tracking-wide leading-relaxed drop-shadow-xs">
            {selectedDhikr.arabic}
          </p>
          <p className="text-xs font-semibold text-secondary mt-0.5 max-w-md mx-auto truncate">
            {selectedDhikr.meaning}
          </p>
        </div>

        {/* Big Interactive Circular Tasbih Counter */}
        <div className="flex flex-col items-center justify-center my-0.5 relative">
          <div
            onClick={handleIncrement}
            className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center cursor-pointer select-none transition-transform duration-150 active:scale-95 group ${
              isTapping ? 'scale-105' : ''
            }`}
          >
            {/* SVG Ring Progress */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-subtle stroke-current"
                strokeWidth="9"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-emerald-600 dark:text-emerald-400 stroke-current transition-all duration-200 ease-out"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                fill="transparent"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-2.5 rounded-full bg-surface/95 border border-theme/50 flex flex-col items-center justify-center shadow-inner group-hover:border-emerald-500/30 transition-all">
              {justCompletedLap ? (
                <div className="flex flex-col items-center animate-bounce">
                  <Award className="w-6 h-6 text-emerald-600 mb-0.5" />
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                    Set Done! 🎉
                  </span>
                </div>
              ) : (
                <>
                  <span className="text-3xl sm:text-4xl font-black text-primary tracking-tight">
                    {count}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 tracking-wider">
                      / {selectedDhikr.target}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-secondary mt-0.5 uppercase tracking-wider">
                    {t('adhkar.tapToCount', 'Tap anywhere')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Step Controls */}
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={count === 0}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-subtle text-secondary border border-theme hover:text-primary hover:bg-surface disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              title="Undo 1"
            >
              -1
            </button>
            <button
              type="button"
              onClick={handleIncrement}
              className="px-3.5 py-1 rounded-lg text-xs font-black bg-emerald-500/15 text-emerald-950 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 transition-all cursor-pointer shadow-xs"
            >
              +1 Tap
            </button>
            <button
              type="button"
              onClick={handleAddTen}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-subtle text-secondary border border-theme hover:text-primary hover:bg-surface transition-all cursor-pointer"
              title="Add 10"
            >
              +10
            </button>
          </div>
        </div>

        {/* Progress & Laps Summary Footer */}
        <div className="flex items-center justify-between px-1 pt-2 border-t border-subtle/80 text-xs">
          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="xs">
              {t('adhkar.laps', 'Laps')}: <strong className="ml-1 text-primary">{totalLaps}</strong>
            </Badge>
            <span className="text-secondary font-medium text-xs">
              {t('common.total', 'Total')}: <strong className="text-primary">{totalLaps * selectedDhikr.target + count}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="Reset counter"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {t('adhkar.reset', 'Reset')}
          </button>
        </div>
      </div>
    </Card>
  );
};

export default AdhkarCounter;
