import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import {
  Calculator,
  Flame,
  Scale,
  Sparkles,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Activity,
  Heart,
} from 'lucide-react';
import {
  ACTIVITY_MULTIPLIERS,
  GOAL_OFFSETS,
  MACRO_SPLIT_PRESETS,
  calculateBMR,
  calculateCalorieBudget,
  calculateMacroTargets,
  getSavedMacroSettings,
  saveMacroSettings,
} from '../utils/calorieCalculator';
import api from '../utils/api';

export const CalorieCalculatorModal = ({
  isOpen,
  onClose,
  onApplied,
  onOpenDocs,
  currentWeight = 70,
}) => {
  const [savedSettings] = useState(() => getSavedMacroSettings());

  const [gender, setGender] = useState(savedSettings?.bodyProfile?.gender || 'male');
  const [weightKg, setWeightKg] = useState(currentWeight || savedSettings?.bodyProfile?.weightKg || 70);
  const [heightCm, setHeightCm] = useState(savedSettings?.bodyProfile?.heightCm || 175);
  const [age, setAge] = useState(savedSettings?.bodyProfile?.age || 26);
  const [activityLevel, setActivityLevel] = useState(savedSettings?.bodyProfile?.activityLevel || 'moderate');
  const [goal, setGoal] = useState(savedSettings?.bodyProfile?.goal || 'maintain');
  const [macroPreset, setMacroPreset] = useState(savedSettings?.presetId || 'balanced');
  const [saving, setSaving] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Sync weight if parent passes a fresh currentWeight
  useEffect(() => {
    if (currentWeight && currentWeight > 0) {
      setWeightKg(currentWeight);
    }
  }, [currentWeight]);

  // Live Calculations
  const bmr = calculateBMR({ gender, weightKg, heightCm, age });
  const budgetResult = calculateCalorieBudget({
    gender,
    weightKg,
    heightCm,
    age,
    activityLevel,
    goal,
  });

  const macroTargets = calculateMacroTargets(budgetResult.budgetKcal, macroPreset);

  const handleApply = async () => {
    setSaving(true);
    setAppliedSuccess(false);
    try {
      // 1. Update user profile on backend
      await api.put('/auth/profile', {
        dailyCalorieGoal: budgetResult.budgetKcal,
      });

      // 2. Persist full macro settings locally
      const newSettings = {
        presetId: macroPreset,
        bodyProfile: {
          gender,
          weightKg: Number(weightKg) || 70,
          heightCm: Number(heightCm) || 175,
          age: Number(age) || 26,
          activityLevel,
          goal,
        },
      };
      saveMacroSettings(newSettings);

      setAppliedSuccess(true);
      if (onApplied) {
        onApplied({
          budgetKcal: budgetResult.budgetKcal,
          macroTargets,
          bmr,
          tdee: budgetResult.tdee,
        });
      }

      setTimeout(() => {
        setAppliedSuccess(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to update calorie goal on backend', err);
      // Fallback: still save locally
      saveMacroSettings({
        presetId: macroPreset,
        bodyProfile: { gender, weightKg, heightCm, age, activityLevel, goal },
      });
      if (onApplied) {
        onApplied({ budgetKcal: budgetResult.budgetKcal, macroTargets, bmr, tdee: budgetResult.tdee });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Body Calorie & Macro Budget Calculator"
      subtitle="Clinical Mifflin-St Jeor TDEE & Macronutrient Allocation Engine"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 text-xs">
        
        {/* Step 1: Body Metrics Grid */}
        <div className="p-3.5 bg-subtle rounded-2xl border border-theme space-y-3">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-indigo-500" /> 1. Enter Your Body Metrics
          </span>

          {/* Gender Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer text-center ${
                gender === 'male'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                  : 'bg-surface hover:bg-subtle text-secondary border-theme'
              }`}
            >
              Male (♂)
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer text-center ${
                gender === 'female'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-600/20'
                  : 'bg-surface hover:bg-subtle text-secondary border-theme'
              }`}
            >
              Female (♀)
            </button>
          </div>

          {/* Age, Height, Weight inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-secondary mb-1 block">Age (years)</label>
              <input
                type="number"
                min="12"
                max="100"
                value={age}
                onChange={(e) => setAge(Math.max(12, Number(e.target.value) || 25))}
                className="input-base w-full py-1.5 font-bold text-primary text-center"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-secondary mb-1 block">Height (cm)</label>
              <input
                type="number"
                min="100"
                max="250"
                value={heightCm}
                onChange={(e) => setHeightCm(Math.max(100, Number(e.target.value) || 175))}
                className="input-base w-full py-1.5 font-bold text-primary text-center"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-secondary mb-1 block">Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                min="30"
                max="300"
                value={weightKg}
                onChange={(e) => setWeightKg(Math.max(30, Number(e.target.value) || 70))}
                className="input-base w-full py-1.5 font-bold text-primary text-center"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Activity Level & Goal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Activity Level */}
          <div className="p-3.5 bg-subtle rounded-2xl border border-theme space-y-2">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" /> 2. Daily Activity Level
            </span>
            <div className="space-y-1.5">
              {ACTIVITY_MULTIPLIERS.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setActivityLevel(act.id)}
                  className={`w-full p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    activityLevel === act.id
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-primary font-bold'
                      : 'bg-surface hover:bg-subtle text-secondary border-theme'
                  }`}
                >
                  <div>
                    <span className="block text-xs">{act.label}</span>
                    <span className="text-[10px] text-muted block">{act.desc}</span>
                  </div>
                  <Badge variant={activityLevel === act.id ? 'emerald' : 'neutral'} size="xs">
                    ×{act.multiplier}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Goal Setting */}
          <div className="p-3.5 bg-subtle rounded-2xl border border-theme space-y-2">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-500" /> 3. Physiological Goal
            </span>
            <div className="space-y-1.5">
              {GOAL_OFFSETS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={`w-full p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    goal === g.id
                      ? 'bg-amber-500/10 border-amber-500/30 text-primary font-bold'
                      : 'bg-surface hover:bg-subtle text-secondary border-theme'
                  }`}
                >
                  <div>
                    <span className="block text-xs">{g.label}</span>
                    <span className="text-[10px] text-muted block">{g.desc}</span>
                  </div>
                  <Badge variant={goal === g.id ? 'amber' : 'neutral'} size="xs">
                    {g.offsetPercent > 0 ? `+${g.offsetPercent * 100}%` : g.offsetPercent < 0 ? `${g.offsetPercent * 100}%` : '±0%'}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: Macro Distribution Preset */}
        <div className="p-3.5 bg-subtle rounded-2xl border border-theme space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-500" /> 4. Macronutrient Distribution
            </span>
            {onOpenDocs && (
              <button
                type="button"
                onClick={onOpenDocs}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <BookOpen className="w-3 h-3" /> Read Science Documentation
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {MACRO_SPLIT_PRESETS.slice(0, 3).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setMacroPreset(preset.id)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  macroPreset === preset.id
                    ? 'bg-purple-500/10 border-purple-500/30 text-primary'
                    : 'bg-surface hover:bg-subtle text-secondary border-theme'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-xs">{preset.label.split(' (')[0]}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono mt-1">
                  <span className="text-indigo-500 font-bold">{preset.proteinPercent}P</span> /
                  <span className="text-emerald-500 font-bold">{preset.carbsPercent}C</span> /
                  <span className="text-amber-500 font-bold">{preset.fatPercent}F</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Calculation Results Card */}
        <div className="p-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent rounded-2xl border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Calculated Daily Calorie Budget
              </span>
              <div className="text-3xl font-black text-primary tracking-tight mt-0.5">
                {budgetResult.budgetKcal} <span className="text-sm font-semibold text-secondary">kcal / day</span>
              </div>
            </div>
            <div className="text-right text-[11px] text-secondary space-y-0.5">
              <div>BMR (At Rest): <strong className="text-primary">{bmr} kcal</strong></div>
              <div>TDEE (Burned): <strong className="text-primary">{budgetResult.tdee} kcal</strong></div>
            </div>
          </div>

          {/* Macro Gram Targets */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-theme">
            {/* Protein Target */}
            <div className="p-2.5 bg-surface/80 rounded-xl border border-indigo-500/20 text-center">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                Protein ({macroTargets.percentages.protein}%)
              </span>
              <span className="text-lg font-black text-primary block mt-0.5">
                {macroTargets.targetGrams.protein}g
              </span>
              <span className="text-[10px] text-secondary">{macroTargets.targetCalories.protein} kcal</span>
            </div>

            {/* Carbs Target */}
            <div className="p-2.5 bg-surface/80 rounded-xl border border-emerald-500/20 text-center">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Carbs ({macroTargets.percentages.carbs}%)
              </span>
              <span className="text-lg font-black text-primary block mt-0.5">
                {macroTargets.targetGrams.carbs}g
              </span>
              <span className="text-[10px] text-secondary">{macroTargets.targetCalories.carbs} kcal</span>
            </div>

            {/* Fat Target */}
            <div className="p-2.5 bg-surface/80 rounded-xl border border-amber-500/20 text-center">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Fat ({macroTargets.percentages.fat}%)
              </span>
              <span className="text-lg font-black text-primary block mt-0.5">
                {macroTargets.targetGrams.fat}g
              </span>
              <span className="text-[10px] text-secondary">{macroTargets.targetCalories.fat} kcal</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="gradient"
            size="md"
            icon={appliedSuccess ? CheckCircle2 : ArrowRight}
            loading={saving}
            onClick={handleApply}
            className="font-bold px-6"
          >
            {appliedSuccess ? 'Applied to Profile!' : 'Apply to My Calorie Budget'}
          </Button>
        </div>

      </div>
    </Modal>
  );
};

export default CalorieCalculatorModal;
