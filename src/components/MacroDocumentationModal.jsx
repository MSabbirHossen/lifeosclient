import React, { useState } from 'react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { Button } from './Button';
import { useLanguage } from '../context/LanguageContext';
import {
  BookOpen,
  ExternalLink,
  Flame,
  Sparkles,
  Scale,
  Zap,
  Heart,
  Dumbbell,
  ShieldCheck,
  TrendingUp,
  Activity,
  CheckCircle2,
  Landmark,
  Microscope,
  HeartPulse,
  GraduationCap,
  ArrowUpRight,
  Info,
  Layers,
  Award,
} from 'lucide-react';
import { DOCUMENTATION_LINKS } from '../utils/calorieCalculator';

const SOURCE_ICONS = {
  Landmark,
  Microscope,
  HeartPulse,
  GraduationCap,
  BookOpen,
  ShieldCheck,
};

const SOURCE_THEMES = {
  blue: {
    gradient: 'from-blue-500/10 via-sky-500/5 to-surface/90',
    border: 'border-blue-500/25 hover:border-blue-500/50',
    iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25',
    badgeVariant: 'primary',
    glow: 'group-hover:shadow-blue-500/10',
    actionBtn: 'group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500',
    accentText: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    gradient: 'from-purple-500/10 via-violet-500/5 to-surface/90',
    border: 'border-purple-500/25 hover:border-purple-500/50',
    iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25',
    badgeVariant: 'purple',
    glow: 'group-hover:shadow-purple-500/10',
    actionBtn: 'group-hover:bg-purple-500 group-hover:text-white group-hover:border-purple-500',
    accentText: 'text-purple-600 dark:text-purple-400',
  },
  rose: {
    gradient: 'from-rose-500/10 via-pink-500/5 to-surface/90',
    border: 'border-rose-500/25 hover:border-rose-500/50',
    iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25',
    badgeVariant: 'danger',
    glow: 'group-hover:shadow-rose-500/10',
    actionBtn: 'group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-500',
    accentText: 'text-rose-600 dark:text-rose-400',
  },
  amber: {
    gradient: 'from-amber-500/10 via-yellow-500/5 to-surface/90',
    border: 'border-amber-500/25 hover:border-amber-500/50',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25',
    badgeVariant: 'warning',
    glow: 'group-hover:shadow-amber-500/10',
    actionBtn: 'group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500',
    accentText: 'text-amber-600 dark:text-amber-400',
  },
};

export const MacroDocumentationModal = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('macros');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('macroCard.scienceDocs')}
      subtitle="Evidence-based nutrition and clinical energy expenditure formulas simplified"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-xs pb-1">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-subtle rounded-2xl border border-theme">
          <button
            type="button"
            onClick={() => setActiveTab('macros')}
            className={`py-2 px-2.5 rounded-xl font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
              activeTab === 'macros'
                ? 'bg-surface text-primary shadow-sm border border-theme font-extrabold'
                : 'text-secondary hover:text-primary hover:bg-surface/50'
            }`}
          >
            <span className="text-sm">🥗</span>
            <span className="truncate">Macronutrients</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`py-2 px-2.5 rounded-xl font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
              activeTab === 'calculator'
                ? 'bg-surface text-primary shadow-sm border border-theme font-extrabold'
                : 'text-secondary hover:text-primary hover:bg-surface/50'
            }`}
          >
            <span className="text-sm">⚡</span>
            <span className="truncate">How Budget Works</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`py-2 px-2.5 rounded-xl font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
              activeTab === 'sources'
                ? 'bg-surface text-primary shadow-sm border border-theme font-extrabold'
                : 'text-secondary hover:text-primary hover:bg-surface/50'
            }`}
          >
            <span className="text-sm">📚</span>
            <span className="truncate">Official Sources</span>
          </button>
        </div>

        {/* Tab 1: Macronutrients & Energy Density */}
        {activeTab === 'macros' && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Quick Rule Header Banner */}
            <div className="p-3.5 bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-pink-500/10 rounded-2xl border border-indigo-500/25 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-primary text-xs sm:text-sm">Standardized Atwater Energy Factors</span>
                    <Badge variant="purple" size="xs">4–4–9 Rule</Badge>
                  </div>
                  <p className="text-[11px] text-secondary mt-0.5 leading-relaxed">
                    Every dietary calorie originates from three core macronutrients with fixed, clinically measured caloric densities per gram.
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Macro Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Protein Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-500/15 via-purple-500/5 to-surface/90 border border-purple-500/30 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 flex flex-col justify-between transition-all duration-300 group">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30 shadow-xs group-hover:scale-105 transition-transform">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-primary text-sm">Protein</span>
                    </div>
                    <Badge variant="purple" size="xs" className="font-bold">4 kcal / g</Badge>
                  </div>

                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-500/20">
                    <span>💪</span> Muscle & Satiety
                  </div>

                  <p className="text-[11px] text-secondary leading-relaxed font-medium">
                    Essential for lean myofibrillar synthesis, immune cellular repair, and highest thermic calorie burn (20–30% TEF).
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-purple-500/20 bg-surface/50 rounded-xl p-2.5">
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold block mb-1.5 uppercase tracking-wider">
                    🥩 Rich Sources:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {['🍗 Chicken', '🐟 Salmon', '🥚 Eggs', '🌱 Tofu', '🥣 Greek Yogurt'].map((food) => (
                      <span
                        key={food}
                        className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[9px] font-semibold border border-purple-500/15 hover:bg-purple-500/20 transition-colors"
                      >
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Carbs Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-surface/90 border border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between transition-all duration-300 group">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-xs group-hover:scale-105 transition-transform">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-primary text-sm">Carbs</span>
                    </div>
                    <Badge variant="success" size="xs" className="font-bold">4 kcal / g</Badge>
                  </div>

                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                    <span>⚡</span> Glycogen & Focus
                  </div>

                  <p className="text-[11px] text-secondary leading-relaxed font-medium">
                    Primary fast-oxidizing substrate powering brain glucose demands, central nervous system, and explosive training.
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-emerald-500/20 bg-surface/50 rounded-xl p-2.5">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold block mb-1.5 uppercase tracking-wider">
                    🌾 Rich Sources:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {['🍚 Rice', '🌾 Oats', '🥔 Sweet Potato', '🍌 Fruit', '🍞 Whole Grains'].map((food) => (
                      <span
                        key={food}
                        className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[9px] font-semibold border border-emerald-500/15 hover:bg-emerald-500/20 transition-colors"
                      >
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fats Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-surface/90 border border-amber-500/30 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between transition-all duration-300 group">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-xs group-hover:scale-105 transition-transform">
                        <Heart className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-primary text-sm">Fats</span>
                    </div>
                    <Badge variant="warning" size="xs" className="font-bold">9 kcal / g</Badge>
                  </div>

                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-500/20">
                    <span>🛡️</span> Hormones & Cells
                  </div>

                  <p className="text-[11px] text-secondary leading-relaxed font-medium">
                    Critical for steroid hormone production (testosterone/estrogen), lipid barriers, and fat-soluble vitamin uptake (A, D, E, K).
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-amber-500/20 bg-surface/50 rounded-xl p-2.5">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold block mb-1.5 uppercase tracking-wider">
                    🥑 Rich Sources:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {['🥑 Avocado', '🫒 Olive Oil', '🥜 Almonds', '🌰 Chia Seeds', '🐟 Mackerel'].map((food) => (
                      <span
                        key={food}
                        className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[9px] font-semibold border border-amber-500/15 hover:bg-amber-500/20 transition-colors"
                      >
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Calculation Formula Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-surface via-subtle/80 to-surface border border-theme/80 text-center space-y-2 shadow-xs">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs text-primary font-extrabold tracking-wide uppercase">
                  Universal Caloric Math Equation
                </span>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-mono font-bold text-primary py-1">
                <span className="px-3 py-1.5 rounded-xl bg-surface border border-theme shadow-xs text-primary">
                  Total Calories
                </span>
                <span className="text-accent text-sm font-black">=</span>
                <span className="px-2.5 py-1.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 shadow-xs">
                  (Protein g × 4)
                </span>
                <span className="text-secondary font-bold">+</span>
                <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 shadow-xs">
                  (Carbs g × 4)
                </span>
                <span className="text-secondary font-bold">+</span>
                <span className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 shadow-xs">
                  (Fat g × 9)
                </span>
              </div>

              <span className="text-[10px] text-muted block font-medium">
                Thermic Effect of Food (TEF): Protein 20–30% • Carbs 5–10% • Dietary Fats 0–3%
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: How Budget & TDEE is Calculated */}
        {activeTab === 'calculator' && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Step 1: BMR */}
            <div className="p-4 rounded-2xl bg-surface border border-indigo-500/20 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-xs font-extrabold shadow-xs shadow-indigo-500/30">
                    1
                  </div>
                  <span className="font-bold text-primary text-xs sm:text-sm">
                    Basal Metabolic Rate (BMR)
                  </span>
                </div>
                <Badge variant="purple" size="xs">Mifflin-St Jeor Clinical Formula</Badge>
              </div>
              <p className="text-[11px] text-secondary leading-relaxed">
                The minimum baseline energy required at total rest to sustain vital life (brain function, breathing, organ operation, and cellular turnover).
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-surface border border-indigo-500/20 font-mono text-indigo-600 dark:text-indigo-400 space-y-0.5">
                  <div className="flex items-center justify-between font-bold mb-0.5 font-sans">
                    <span className="text-primary text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <span>👨</span> Men's Formula
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-mono">+5 base</span>
                  </div>
                  <div className="text-[10px]">10 × kg + 6.25 × cm - 5 × age + 5</div>
                </div>

                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-surface border border-purple-500/20 font-mono text-purple-600 dark:text-purple-400 space-y-0.5">
                  <div className="flex items-center justify-between font-bold mb-0.5 font-sans">
                    <span className="text-primary text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <span>👩</span> Women's Formula
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 font-mono">-161 base</span>
                  </div>
                  <div className="text-[10px]">10 × kg + 6.25 × cm - 5 × age - 161</div>
                </div>
              </div>
            </div>

            {/* Step 2: TDEE */}
            <div className="p-4 rounded-2xl bg-surface border border-emerald-500/20 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-extrabold shadow-xs shadow-emerald-500/30">
                    2
                  </div>
                  <span className="font-bold text-primary text-xs sm:text-sm">
                    Total Daily Energy Expenditure (TDEE)
                  </span>
                </div>
                <Badge variant="success" size="xs">TDEE = BMR × Activity Factor</Badge>
              </div>
              <p className="text-[11px] text-secondary leading-relaxed">
                Total calories burned across a 24-hour window incorporating your daily physical movement, steps (NEAT), workouts, and digestion.
              </p>
              
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="p-2.5 rounded-xl bg-surface border border-theme text-center space-y-0.5 hover:border-secondary/40 transition-colors">
                  <div className="flex items-center justify-center gap-1 font-bold text-primary">
                    <span>🪑</span> Sedentary
                  </div>
                  <Badge variant="neutral" size="xs">× 1.20</Badge>
                  <span className="text-secondary text-[9px] block pt-0.5">Desk job, minimal exercise</span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/25 text-center space-y-0.5 hover:border-emerald-500/40 transition-colors">
                  <div className="flex items-center justify-center gap-1 font-bold text-primary">
                    <span>🏃</span> Moderate
                  </div>
                  <Badge variant="success" size="xs">× 1.55</Badge>
                  <span className="text-secondary text-[9px] block pt-0.5">3–5 training sessions/wk</span>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/25 text-center space-y-0.5 hover:border-indigo-500/40 transition-colors">
                  <div className="flex items-center justify-center gap-1 font-bold text-primary">
                    <span>⚡</span> Athlete
                  </div>
                  <Badge variant="primary" size="xs">× 1.90</Badge>
                  <span className="text-secondary text-[9px] block pt-0.5">High intensity 2x/day</span>
                </div>
              </div>
            </div>

            {/* Step 3: Goals */}
            <div className="p-4 rounded-2xl bg-surface border border-amber-500/20 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-extrabold shadow-xs shadow-amber-500/30">
                    3
                  </div>
                  <span className="font-bold text-primary text-xs sm:text-sm">
                    Target Goal Calibration
                  </span>
                </div>
                <Badge variant="warning" size="xs">Caloric Deficit vs Surplus</Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                {/* Fat Loss */}
                <div className="p-3 rounded-xl bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-surface border border-rose-500/25 space-y-1 hover:border-rose-500/45 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <span>🔥</span> Fat Loss
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono">-10% to -20%</span>
                  </div>
                  <p className="text-secondary text-[10px] leading-relaxed">
                    ~250–500 kcal deficit targeting body fat oxidation while preserving metabolic rate.
                  </p>
                </div>

                {/* Maintenance */}
                <div className="p-3 rounded-xl bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-surface border border-emerald-500/25 space-y-1 hover:border-emerald-500/45 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span>⚖️</span> Maintain
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono">±0% (TDEE)</span>
                  </div>
                  <p className="text-secondary text-[10px] leading-relaxed">
                    Energy balance matching exact TDEE for body weight and hormonal stabilization.
                  </p>
                </div>

                {/* Muscle Gain */}
                <div className="p-3 rounded-xl bg-gradient-to-b from-indigo-500/10 via-indigo-500/5 to-surface border border-indigo-500/25 space-y-1 hover:border-indigo-500/45 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <span>💪</span> Hypertrophy
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-mono">+10% to +20%</span>
                  </div>
                  <p className="text-secondary text-[10px] leading-relaxed">
                    ~250–500 kcal surplus to optimize substrate for lean myofibrillar hypertrophy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Official Scientific Sources */}
        {activeTab === 'sources' && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-subtle border border-theme text-secondary text-[11px]">
              <Info className="w-4 h-4 text-accent shrink-0" />
              <span>
                Life OS relies strictly on peer-reviewed clinical research and official public health institutions:
              </span>
            </div>

            <div className="space-y-2.5">
              {DOCUMENTATION_LINKS.map((doc) => {
                const IconComponent = SOURCE_ICONS[doc.icon] || BookOpen;
                const theme = SOURCE_THEMES[doc.theme] || SOURCE_THEMES.blue;

                return (
                  <a
                    key={doc.id || doc.url}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative p-3.5 rounded-2xl bg-surface border ${theme.border} bg-gradient-to-r ${theme.gradient} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${theme.glow} flex items-center justify-between gap-3 text-left cursor-pointer`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Icon Container */}
                      <div className={`w-9 h-9 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105`}>
                        <IconComponent className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`font-bold text-primary text-xs sm:text-sm ${theme.accentText} transition-colors`}>
                            {doc.title}
                          </span>
                          <Badge variant={doc.badgeVariant || theme.badgeVariant} size="xs">
                            {doc.badge}
                          </Badge>
                        </div>

                        <p className="text-[11px] text-secondary leading-relaxed">
                          {doc.summary}
                        </p>

                        <div className="flex items-center gap-1.5 text-[10px] text-muted font-medium pt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                          <span>{doc.organization}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 flex items-center">
                      <div className={`w-8 h-8 rounded-xl bg-surface border border-theme text-secondary flex items-center justify-center transition-all duration-200 ${theme.actionBtn}`}>
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-theme mt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Clinical Standards: Mifflin-St Jeor & USDA AMDR</span>
          </div>
          <Button variant="primary" size="sm" onClick={onClose} className="px-5">
            Got It
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MacroDocumentationModal;

