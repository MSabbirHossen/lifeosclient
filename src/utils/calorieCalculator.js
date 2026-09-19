// Calorie Budget & Macronutrient Calculation Engine
// Based on the clinically validated Mifflin-St Jeor Equation & USDA AMDR guidelines

const STORAGE_KEY = 'lifeos_macro_settings';

export const ACTIVITY_MULTIPLIERS = [
  { id: 'sedentary', label: 'Sedentary', multiplier: 1.2, desc: 'Desk job, little to no exercise' },
  { id: 'light', label: 'Lightly Active', multiplier: 1.375, desc: 'Light exercise / sports 1–3 days/wk' },
  { id: 'moderate', label: 'Moderately Active', multiplier: 1.55, desc: 'Moderate exercise 3–5 days/wk' },
  { id: 'heavy', label: 'Very Active', multiplier: 1.725, desc: 'Hard exercise 6–7 days/wk' },
  { id: 'athlete', label: 'Extremely Active', multiplier: 1.9, desc: 'Heavy physical training / dual sessions' },
];

export const GOAL_OFFSETS = [
  { id: 'cut_aggressive', label: 'Aggressive Fat Loss (-20%)', offsetPercent: -0.20, desc: '~500 kcal deficit for rapid weight loss' },
  { id: 'cut_moderate', label: 'Moderate Fat Loss (-10%)', offsetPercent: -0.10, desc: '~250 kcal deficit for sustainable fat loss' },
  { id: 'maintain', label: 'Weight Maintenance', offsetPercent: 0, desc: 'Maintain current body weight & vitality' },
  { id: 'bulk_lean', label: 'Lean Muscle Gain (+10%)', offsetPercent: 0.10, desc: '~250 kcal surplus with minimal fat gain' },
  { id: 'bulk_aggressive', label: 'Aggressive Bulking (+20%)', offsetPercent: 0.20, desc: '~500 kcal surplus for maximum muscle growth' },
];

export const MACRO_SPLIT_PRESETS = [
  {
    id: 'balanced',
    label: 'Balanced Athletic (30P / 40C / 30F)',
    proteinPercent: 30,
    carbsPercent: 40,
    fatPercent: 30,
    desc: 'Standard athletic split for daily performance & vitality',
  },
  {
    id: 'high_protein',
    label: 'High Protein / Lean Muscle (40P / 35C / 25F)',
    proteinPercent: 40,
    carbsPercent: 35,
    fatPercent: 25,
    desc: 'Optimal for muscle preservation, fat loss satiety, & hypertrophy',
  },
  {
    id: 'low_carb',
    label: 'Low Carb / High Fat (35P / 20C / 45F)',
    proteinPercent: 35,
    carbsPercent: 20,
    fatPercent: 45,
    desc: 'Insulin sensitivity focus & metabolic flexibility',
  },
  {
    id: 'keto',
    label: 'Ketogenic Adaptation (25P / 5C / 70F)',
    proteinPercent: 25,
    carbsPercent: 5,
    fatPercent: 70,
    desc: 'Deep nutritional ketosis with very low carbohydrate intake',
  },
  {
    id: 'endurance',
    label: 'High Carb / Endurance (20P / 55C / 25F)',
    proteinPercent: 20,
    carbsPercent: 55,
    fatPercent: 25,
    desc: 'Glycogen loading for marathon, cycling, and intense cardio',
  },
  {
    id: 'custom',
    label: 'Custom Macro Distribution',
    proteinPercent: 30,
    carbsPercent: 40,
    fatPercent: 30,
    desc: 'User-tailored percentage distribution',
  },
];

export const DOCUMENTATION_LINKS = [
  {
    title: 'USDA Dietary Guidelines for Americans',
    organization: 'USDA & U.S. Dept of Health and Human Services (HHS)',
    url: 'https://www.dietaryguidelines.gov/resources/2020-2025-dietary-guidelines-online-materials',
    summary: 'Official Acceptable Macronutrient Distribution Ranges (AMDR): Protein 10–35%, Carbs 45–65%, Fat 20–35%.',
    badge: 'Government Standard',
  },
  {
    title: 'Mifflin-St Jeor BMR & Energy Expenditure Study',
    organization: 'National Library of Medicine (NIH / NCBI)',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK279077/',
    summary: 'The clinical standard formula for estimating Basal Metabolic Rate (BMR) with the highest predictive accuracy.',
    badge: 'Clinical Evidence',
  },
  {
    title: 'Mayo Clinic: Carbohydrates, Protein & Fat Guidelines',
    organization: 'Mayo Clinic Health Information',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/carbohydrates/art-20045705',
    summary: 'Scientific guidance on energy breakdown, daily caloric allowances, and balancing macronutrient ratios.',
    badge: 'Medical Guidance',
  },
  {
    title: 'Precision Nutrition: Macronutrient Calculator & Guide',
    organization: 'Precision Nutrition Institute',
    url: 'https://www.precisionnutrition.com/macro-calculator',
    summary: 'Comprehensive methodology for translating body metrics into protein, carb, and fat targets based on goals.',
    badge: 'Sports Nutrition',
  },
];

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 */
export const calculateBMR = ({ gender = 'male', weightKg = 70, heightCm = 175, age = 25 }) => {
  const w = Number(weightKg) || 70;
  const h = Number(heightCm) || 175;
  const a = Number(age) || 25;

  if (gender === 'female') {
    // 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
    return Math.round(10 * w + 6.25 * h - 5 * a - 161);
  }
  // Male: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
  return Math.round(10 * w + 6.25 * h - 5 * a + 5);
};

/**
 * Calculate Total Daily Energy Expenditure (TDEE) and target Calorie Budget
 */
export const calculateCalorieBudget = ({
  gender = 'male',
  weightKg = 70,
  heightCm = 175,
  age = 25,
  activityLevel = 'moderate',
  goal = 'maintain',
}) => {
  const bmr = calculateBMR({ gender, weightKg, heightCm, age });
  const activity = ACTIVITY_MULTIPLIERS.find((a) => a.id === activityLevel) || ACTIVITY_MULTIPLIERS[2];
  const tdee = Math.round(bmr * activity.multiplier);

  const goalSetting = GOAL_OFFSETS.find((g) => g.id === goal) || GOAL_OFFSETS[2];
  const budgetKcal = Math.max(1200, Math.round(tdee * (1 + goalSetting.offsetPercent)));

  return {
    bmr,
    tdee,
    budgetKcal,
    activityLabel: activity.label,
    goalLabel: goalSetting.label,
  };
};

/**
 * Break down a calorie budget into Protein, Carbs, and Fat target grams.
 * Conversions: Protein = 4 kcal/g, Carbs = 4 kcal/g, Fat = 9 kcal/g
 */
export const calculateMacroTargets = (budgetKcal = 2000, presetId = 'balanced', customSplits = null) => {
  const budget = Math.max(800, Number(budgetKcal) || 2000);
  let pPercent = 30;
  let cPercent = 40;
  let fPercent = 30;

  if (presetId === 'custom' && customSplits) {
    pPercent = Number(customSplits.proteinPercent) || 30;
    cPercent = Number(customSplits.carbsPercent) || 40;
    fPercent = Number(customSplits.fatPercent) || 30;
  } else {
    const preset = MACRO_SPLIT_PRESETS.find((p) => p.id === presetId) || MACRO_SPLIT_PRESETS[0];
    pPercent = preset.proteinPercent;
    cPercent = preset.carbsPercent;
    fPercent = preset.fatPercent;
  }

  // Grams calculation
  const targetProteinGrams = Math.round((budget * (pPercent / 100)) / 4);
  const targetCarbsGrams = Math.round((budget * (cPercent / 100)) / 4);
  const targetFatGrams = Math.round((budget * (fPercent / 100)) / 9);

  return {
    budgetKcal: budget,
    presetId,
    percentages: {
      protein: pPercent,
      carbs: cPercent,
      fat: fPercent,
    },
    targetGrams: {
      protein: targetProteinGrams,
      carbs: targetCarbsGrams,
      fat: targetFatGrams,
    },
    targetCalories: {
      protein: targetProteinGrams * 4,
      carbs: targetCarbsGrams * 4,
      fat: targetFatGrams * 9,
    },
  };
};

/**
 * Compute the "Taken vs. Yet to Take (Remaining)" breakdown for each macro and calories.
 */
export const computeMacroProgress = ({
  caloriesConsumed = 0,
  calorieBudget = 2000,
  proteinTaken = 0,
  carbsTaken = 0,
  fatTaken = 0,
  macroTargets = null,
}) => {
  const targets = macroTargets || calculateMacroTargets(calorieBudget);

  const calcNutrient = (taken, target, kcalPerGram) => {
    const takenNum = Math.max(0, Math.round((Number(taken) || 0) * 10) / 10);
    const targetNum = Math.max(1, Number(target) || 100);
    const remaining = Math.max(0, Math.round((targetNum - takenNum) * 10) / 10);
    const over = Math.max(0, Math.round((takenNum - targetNum) * 10) / 10);
    const percent = Math.min(100, Math.round((takenNum / targetNum) * 100));
    const totalPercent = Math.round((takenNum / targetNum) * 100);

    return {
      taken: takenNum,
      target: targetNum,
      remaining, // "yet to take"
      over,
      isMet: takenNum >= targetNum,
      percent,
      totalPercent,
      caloriesTaken: Math.round(takenNum * kcalPerGram),
      caloriesTarget: Math.round(targetNum * kcalPerGram),
      caloriesRemaining: Math.round(remaining * kcalPerGram),
    };
  };

  const protein = calcNutrient(proteinTaken, targets.targetGrams.protein, 4);
  const carbs = calcNutrient(carbsTaken, targets.targetGrams.carbs, 4);
  const fat = calcNutrient(fatTaken, targets.targetGrams.fat, 9);

  const calConsumed = Math.max(0, Number(caloriesConsumed) || 0);
  const calBudget = Math.max(1, Number(calorieBudget) || targets.budgetKcal);
  const calRemaining = Math.max(0, calBudget - calConsumed);
  const calOver = Math.max(0, calConsumed - calBudget);
  const calPercent = Math.min(100, Math.round((calConsumed / calBudget) * 100));

  return {
    calories: {
      taken: calConsumed,
      target: calBudget,
      remaining: calRemaining, // "yet to take"
      over: calOver,
      percent: calPercent,
      isMet: calConsumed >= calBudget,
    },
    protein,
    carbs,
    fat,
    percentages: targets.percentages,
  };
};

/**
 * Storage helpers for user's macro preferences
 */
export const getSavedMacroSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    presetId: 'balanced',
    customSplits: { proteinPercent: 30, carbsPercent: 40, fatPercent: 30 },
    bodyProfile: {
      gender: 'male',
      weightKg: 70,
      heightCm: 175,
      age: 26,
      activityLevel: 'moderate',
      goal: 'maintain',
    },
  };
};

export const saveMacroSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('lifeos_macro_updated', { detail: settings }));
  } catch (e) {
    console.error('Failed to save macro settings', e);
  }
};
