import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import {
  PieChart as PieChartIcon,
  Calculator,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { computeMacroProgress } from '../utils/calorieCalculator';
import { useLanguage } from '../context/LanguageContext';

export const MacroBreakdownCard = ({
  summary = {},
  macroTargets = null,
  onOpenCalculator,
  onOpenDocs,
}) => {
  const { t } = useLanguage();
  const progress = computeMacroProgress({
    caloriesConsumed: summary.caloriesConsumed || 0,
    calorieBudget: summary.dailyCalorieGoal || 2000,
    proteinTaken: summary.totalProtein || 0,
    carbsTaken: summary.totalCarbs || 0,
    fatTaken: summary.totalFat || 0,
    macroTargets,
  });

  return (
    <Card
      hover
      title={t('macroCard.title')}
      subtitle={t('macroCard.subtitle')}
      icon={PieChartIcon}
      action={
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="ghost"
            size="xs"
            icon={BookOpen}
            onClick={onOpenDocs}
            className="text-secondary hover:text-primary cursor-pointer text-[11px]"
            title="Read Official Macro & Calorie Science Documentation"
          >
            {t('macroCard.scienceDocs')}
          </Button>
          <Button
            variant="outline"
            size="xs"
            icon={Calculator}
            onClick={onOpenCalculator}
            className="font-bold text-[11px] cursor-pointer"
          >
            {t('macroCard.recalculate')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pt-1">

        {/* 3-Macro Detailed Breakdown Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          
          {/* 1. PROTEIN */}
          <div className="p-4 rounded-2xl bg-[#007EA7]/5 dark:bg-[#007EA7]/15 border border-[#007EA7]/25 dark:border-[#007EA7]/40 hover:border-[#007EA7]/50 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#007EA7] shrink-0 shadow-xs" />
                <span className="text-xs font-bold text-[#003459] dark:text-[#76DDFF] uppercase tracking-wider truncate">
                  Protein
                </span>
                <span className="text-[10px] text-secondary font-medium shrink-0">
                  (4 kcal/g)
                </span>
              </div>
              <Badge variant="cerulean" size="xs">
                {progress.percentages.protein}% target
              </Badge>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
                    {progress.protein.taken}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-secondary">
                    / {progress.protein.target}g
                  </span>
                </div>
                <span className="text-xs font-extrabold text-[#003459] dark:text-[#76DDFF] bg-[#007EA7]/15 px-2 py-0.5 rounded-lg border border-[#007EA7]/30">
                  {progress.protein.totalPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-subtle rounded-full overflow-hidden border border-theme mt-2 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progress.protein.over > 0 ? 'bg-[#00A8E8]' : 'bg-gradient-to-r from-[#003459] to-[#007EA7]'
                  }`}
                  style={{ width: `${progress.protein.percent}%` }}
                />
              </div>
            </div>

            {/* Yet to take status */}
            <div className="pt-2.5 border-t border-[#007EA7]/20 flex items-center justify-between text-[11px] sm:text-xs">
              <span className="text-secondary font-medium">Yet to take:</span>
              {progress.protein.remaining > 0 ? (
                <span className="font-extrabold text-[#007EA7] dark:text-[#76DDFF]">
                  {progress.protein.remaining}g remaining
                </span>
              ) : (
                <span className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Target met
                  {progress.protein.over > 0 && ` (+${progress.protein.over}g)`}
                </span>
              )}
            </div>
          </div>

          {/* 2. CARBOHYDRATES */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/25 dark:border-emerald-500/40 hover:border-emerald-500/50 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider truncate">
                  Carbs
                </span>
                <span className="text-[10px] text-secondary font-medium shrink-0">
                  (4 kcal/g)
                </span>
              </div>
              <Badge variant="emerald" size="xs">
                {progress.percentages.carbs}% target
              </Badge>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
                    {progress.carbs.taken}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-secondary">
                    / {progress.carbs.target}g
                  </span>
                </div>
                <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                  {progress.carbs.totalPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-subtle rounded-full overflow-hidden border border-theme mt-2 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progress.carbs.over > 0 ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-600 to-teal-500'
                  }`}
                  style={{ width: `${progress.carbs.percent}%` }}
                />
              </div>
            </div>

            {/* Yet to take status */}
            <div className="pt-2.5 border-t border-emerald-500/20 flex items-center justify-between text-[11px] sm:text-xs">
              <span className="text-secondary font-medium">Yet to take:</span>
              {progress.carbs.remaining > 0 ? (
                <span className="font-extrabold text-emerald-800 dark:text-emerald-300">
                  {progress.carbs.remaining}g remaining
                </span>
              ) : (
                <span className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Target met
                  {progress.carbs.over > 0 && ` (+${progress.carbs.over}g)`}
                </span>
              )}
            </div>
          </div>

          {/* 3. DIETARY FATS */}
          <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/25 dark:border-amber-500/40 hover:border-amber-500/50 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-xs" />
                <span className="text-xs font-bold text-amber-950 dark:text-amber-300 uppercase tracking-wider truncate">
                  Fats
                </span>
                <span className="text-[10px] text-secondary font-medium shrink-0">
                  (9 kcal/g)
                </span>
              </div>
              <Badge variant="amber" size="xs">
                {progress.percentages.fat}% target
              </Badge>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
                    {progress.fat.taken}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-secondary">
                    / {progress.fat.target}g
                  </span>
                </div>
                <span className="text-xs font-extrabold text-amber-950 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/30">
                  {progress.fat.totalPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-subtle rounded-full overflow-hidden border border-theme mt-2 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progress.fat.over > 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                  style={{ width: `${progress.fat.percent}%` }}
                />
              </div>
            </div>

            {/* Yet to take status */}
            <div className="pt-2.5 border-t border-amber-500/20 flex items-center justify-between text-[11px] sm:text-xs">
              <span className="text-secondary font-medium">Yet to take:</span>
              {progress.fat.remaining > 0 ? (
                <span className="font-extrabold text-amber-900 dark:text-amber-300">
                  {progress.fat.remaining}g remaining
                </span>
              ) : (
                <span className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Target met
                  {progress.fat.over > 0 && ` (+${progress.fat.over}g)`}
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Energy Balance Summary Strip & Documentation Quick Link */}
        <div className="p-3.5 bg-subtle/90 dark:bg-subtle/50 rounded-2xl border border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-primary">
                Daily Energy Balance: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{progress.calories.taken} kcal taken</span> <span className="text-secondary font-normal">/ {progress.calories.target} kcal budget</span>
              </div>
              <span className="text-[11px] text-secondary">
                {progress.calories.remaining > 0
                  ? `${progress.calories.remaining} kcal remaining yet to consume today`
                  : `Calorie budget reached (${progress.calories.over} kcal over)`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenDocs}
            className="text-xs text-secondary hover:text-accent flex items-center gap-1.5 cursor-pointer shrink-0 font-semibold group transition-colors px-2 py-1 rounded-lg hover:bg-accent/10"
          >
            <span>Documentation & References</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </Card>
  );
};

export default MacroBreakdownCard;
