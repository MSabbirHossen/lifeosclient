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

export const MacroBreakdownCard = ({
  summary = {},
  macroTargets = null,
  onOpenCalculator,
  onOpenDocs,
}) => {
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
      title="Macronutrient Budget & Intake Breakdown"
      subtitle="Real-time tracking of macros taken vs. yet to take"
      icon={PieChartIcon}
      badge={
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="ghost"
            size="xs"
            icon={BookOpen}
            onClick={onOpenDocs}
            className="text-secondary hover:text-primary cursor-pointer text-[11px]"
            title="Read Official Macro & Calorie Science Documentation"
          >
            Science Docs
          </Button>
          <Button
            variant="outline"
            size="xs"
            icon={Calculator}
            onClick={onOpenCalculator}
            className="font-bold text-[11px] cursor-pointer"
          >
            Recalculate
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pt-1">

        {/* 3-Macro Detailed Breakdown Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          
          {/* 1. PROTEIN */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                Protein <span className="text-[10px] text-muted font-normal">(4 kcal/g)</span>
              </span>
              <Badge variant="purple" size="xs">
                {progress.percentages.protein}% target
              </Badge>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-primary">
                  {progress.protein.taken} <span className="text-xs font-semibold text-secondary">/ {progress.protein.target}g</span>
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {progress.protein.totalPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-subtle rounded-full overflow-hidden border border-theme mt-1.5 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progress.protein.over > 0 ? 'bg-indigo-400' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                  }`}
                  style={{ width: `${progress.protein.percent}%` }}
                />
              </div>
            </div>

            {/* Yet to take status */}
            <div className="pt-2 border-t border-indigo-500/20 flex items-center justify-between text-[11px]">
              <span className="text-secondary font-medium">Yet to take:</span>
              {progress.protein.remaining > 0 ? (
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                  {progress.protein.remaining}g remaining
                </span>
              ) : (
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Target met
                  {progress.protein.over > 0 && ` (+${progress.protein.over}g)`}
                </span>
              )}
            </div>
          </div>

          {/* 2. CARBOHYDRATES */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                Carbs <span className="text-[10px] text-muted font-normal">(4 kcal/g)</span>
              </span>
              <Badge variant="emerald" size="xs">
                {progress.percentages.carbs}% target
              </Badge>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-primary">
                  {progress.carbs.taken} <span className="text-xs font-semibold text-secondary">/ {progress.carbs.target}g</span>
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {progress.carbs.totalPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-subtle rounded-full overflow-hidden border border-theme mt-1.5 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progress.carbs.over > 0 ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  }`}
                  style={{ width: `${progress.carbs.percent}%` }}
                />
              </div>
            </div>

            {/* Yet to take status */}
            <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px]">
              <span className="text-secondary font-medium">Yet to take:</span>
              {progress.carbs.remaining > 0 ? (
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {progress.carbs.remaining}g remaining
                </span>
              ) : (
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Target met
                  {progress.carbs.over > 0 && ` (+${progress.carbs.over}g)`}
                </span>
              )}
            </div>
          </div>

          {/* 3. DIETARY FATS */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                Fats <span className="text-[10px] text-muted font-normal">(9 kcal/g)</span>
              </span>
              <Badge variant="amber" size="xs">
                {progress.percentages.fat}% target
              </Badge>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-primary">
                  {progress.fat.taken} <span className="text-xs font-semibold text-secondary">/ {progress.fat.target}g</span>
                </span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {progress.fat.totalPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-subtle rounded-full overflow-hidden border border-theme mt-1.5 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progress.fat.over > 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                  style={{ width: `${progress.fat.percent}%` }}
                />
              </div>
            </div>

            {/* Yet to take status */}
            <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px]">
              <span className="text-secondary font-medium">Yet to take:</span>
              {progress.fat.remaining > 0 ? (
                <span className="font-extrabold text-amber-600 dark:text-amber-400">
                  {progress.fat.remaining}g remaining
                </span>
              ) : (
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Target met
                  {progress.fat.over > 0 && ` (+${progress.fat.over}g)`}
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Energy Balance Summary Strip & Documentation Quick Link */}
        <div className="p-3 bg-subtle rounded-xl border border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-primary">
                Daily Energy Balance: <span className="text-indigo-600 dark:text-indigo-400">{progress.calories.taken} kcal taken</span> / <span className="text-secondary">{progress.calories.target} kcal budget</span>
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
            className="text-[11px] text-secondary hover:text-primary flex items-center gap-1 cursor-pointer shrink-0 font-medium group"
          >
            <span>Documentation & References</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </Card>
  );
};

export default MacroBreakdownCard;
