import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { RotateCcw, Sparkles, Check, Heart, Plus } from 'lucide-react';

const DHIKR_PRESETS = [
  { text: 'SubhanAllah', arabic: 'سُبْحَانَ اللَّهِ', meaning: 'Glory be to Allah', target: 33 },
  { text: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', meaning: 'Praise be to Allah', target: 33 },
  { text: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', meaning: 'Allah is the Greatest', target: 34 },
  { text: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', meaning: 'I seek forgiveness from Allah', target: 100 },
  { text: 'La ilaha illallah', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', meaning: 'There is no god but Allah', target: 100 },
  { text: 'Salawat on Prophet ﷺ', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', meaning: 'Peace & blessings upon Muhammad', target: 100 },
];

export const AdhkarCounter = () => {
  const [selectedDhikr, setSelectedDhikr] = useState(DHIKR_PRESETS[0]);
  const [count, setCount] = useState(0);
  const [totalLaps, setTotalLaps] = useState(0);
  const [isTapping, setIsTapping] = useState(false);

  const handleIncrement = () => {
    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 150);

    const nextCount = count + 1;
    if (nextCount >= selectedDhikr.target) {
      setCount(0);
      setTotalLaps((prev) => prev + 1);
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
    setTotalLaps(0);
  };

  const progressPercent = Math.round((count / selectedDhikr.target) * 100);

  return (
    <Card
      hover
      title="Digital Tasbih & Adhkar"
      subtitle="Interactive remembrance counter & target tracking"
      icon={Sparkles}
      badge={<Badge variant="success" size="xs">Deen</Badge>}
    >
      <div className="space-y-4 pt-1">
        {/* Dhikr Selector Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {DHIKR_PRESETS.map((d, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectDhikr(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                selectedDhikr.text === d.text
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-sm'
                  : 'bg-subtle text-secondary border-theme hover:text-primary hover:bg-subtle/80'
              }`}
            >
              {d.text}
            </button>
          ))}
        </div>

        {/* Selected Dhikr Display */}
        <div className="text-center p-3.5 bg-subtle rounded-2xl border border-theme">
          <p className="text-xl font-bold font-serif text-primary leading-relaxed">
            {selectedDhikr.arabic}
          </p>
          <p className="text-xs font-semibold text-secondary mt-1">
            {selectedDhikr.meaning}
          </p>
        </div>

        {/* Big Interactive Tap Counter */}
        <div className="flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={handleIncrement}
            className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-150 cursor-pointer shadow-lg active:scale-95 ${
              isTapping
                ? 'scale-105 border-emerald-400 bg-emerald-500/20 shadow-emerald-500/30'
                : 'border-emerald-500/40 bg-surface hover:border-emerald-500 hover:bg-emerald-500/5'
            }`}
          >
            <span className="text-4xl font-black text-primary tracking-tight">
              {count}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 uppercase tracking-wider">
              / {selectedDhikr.target}
            </span>
            <span className="text-[9px] font-medium text-secondary mt-1">Tap to Count</span>
          </button>
        </div>

        {/* Progress & Laps Summary */}
        <div className="flex items-center justify-between px-2 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="xs">
              Laps: {totalLaps}
            </Badge>
            <span className="text-secondary font-semibold">
              Total: {totalLaps * selectedDhikr.target + count}
            </span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="Reset counter"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>
    </Card>
  );
};

export default AdhkarCounter;
