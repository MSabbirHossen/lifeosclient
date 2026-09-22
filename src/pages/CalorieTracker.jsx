import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { DateInput } from '../components/DateInput';
import api from '../utils/api';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import {
  Utensils,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Droplets,
  Flame,
  PieChart as PieChartIcon,
  Sparkles,
  Search,
  Timer,
  Trophy,
  Calculator,
  BookOpen,
  AlertCircle,
  Info,
  CheckCircle2,
  ArrowRight,
  X,
  Zap,
  Dumbbell,
  Scale,
} from 'lucide-react';
import { FastingTimer } from '../components/FastingTimer';
import { getFastingStats, subscribeFastingUpdates } from '../utils/fastingService';
import {
  calculateMacroTargets,
  getSavedMacroSettings,
} from '../utils/calorieCalculator';
import { CalorieCalculatorModal } from '../components/CalorieCalculatorModal';
import { MacroDocumentationModal } from '../components/MacroDocumentationModal';
import { MacroBreakdownCard } from '../components/MacroBreakdownCard';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const MEAL_TYPE_CONFIG = {
  Breakfast: { label: 'Breakfast', icon: '🌅' },
  Lunch: { label: 'Lunch', icon: '☀️' },
  Dinner: { label: 'Dinner', icon: '🌙' },
  Snack: { label: 'Snack', icon: '🍎' },
};

const POPULAR_STAPLES = [
  {
    name: 'Chicken Breast',
    category: 'Protein',
    unitType: 'gram',
    unit: 'gram',
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
    source: 'USDA Verified',
    icon: '🍗',
  },
  {
    name: 'Boiled Egg',
    category: 'Protein',
    unitType: 'piece',
    unit: 'piece',
    caloriesPerPiece: 72,
    proteinPerPiece: 6.3,
    carbsPerPiece: 0.4,
    fatPerPiece: 4.8,
    source: 'USDA Verified',
    icon: '🥚',
  },
  {
    name: 'Brown Rice',
    category: 'Grains',
    unitType: 'gram',
    unit: 'gram',
    caloriesPer100g: 112,
    proteinPer100g: 2.6,
    carbsPer100g: 24,
    fatPer100g: 0.9,
    source: 'USDA Verified',
    icon: '🍚',
  },
  {
    name: 'Banana',
    category: 'Fruits',
    unitType: 'piece',
    unit: 'piece',
    caloriesPerPiece: 105,
    proteinPerPiece: 1.3,
    carbsPerPiece: 27,
    fatPerPiece: 0.3,
    source: 'USDA Verified',
    icon: '🍌',
  },
  {
    name: 'Oatmeal',
    category: 'Grains',
    unitType: 'gram',
    unit: 'gram',
    caloriesPer100g: 389,
    proteinPer100g: 16.9,
    carbsPer100g: 66.3,
    fatPer100g: 6.9,
    source: 'USDA Verified',
    icon: '🥣',
  },
  {
    name: 'Avocado',
    category: 'Healthy Fats',
    unitType: 'piece',
    unit: 'piece',
    caloriesPerPiece: 240,
    proteinPerPiece: 3,
    carbsPerPiece: 12,
    fatPerPiece: 22,
    source: 'USDA Verified',
    icon: '🥑',
  },
];

const UNITS = ['piece', 'gram', 'ml', 'cup', 'bowl', 'tablespoon', 'teaspoon'];
const MACRO_COLORS = ['#6366F1', '#10B981', '#F59E0B']; // Protein (Indigo), Carbs (Emerald), Fat (Amber)

export const CalorieTracker = ({ selectedDate }) => {
  const { t, isRTL } = useLanguage();
  const activeDate = selectedDate || getFormattedDate();

  const [meals, setMeals] = useState([]);
  const [summary, setSummary] = useState({
    caloriesConsumed: 0,
    dailyCalorieGoal: 2000,
    remainingCalories: 2000,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    waterGlasses: 0,
    waterMl: 0,
  });
  const [fastingStats, setFastingStats] = useState(() => getFastingStats());
  const [macroSettings, setMacroSettings] = useState(() => getSavedMacroSettings());
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [frequentFoods, setFrequentFoods] = useState(POPULAR_STAPLES);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMealId, setEditingMealId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form & Autocomplete State
  const [formMealType, setFormMealType] = useState('Breakfast');
  const [formDate, setFormDate] = useState(activeDate);

  // Meal Item inputs
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('piece');
  const [calPerUnit, setCalPerUnit] = useState(100);
  const [proteinPerUnit, setProteinPerUnit] = useState(5);
  const [carbsPerUnit, setCarbsPerUnit] = useState(10);
  const [fatPerUnit, setFatPerUnit] = useState(2);

  // Autocomplete Suggestions
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingSuggestions, setSearchingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchFrequentFoods = useCallback(async () => {
    try {
      const res = await api.get('/food-items/frequent');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setFrequentFoods(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch frequent foods', err);
    }
  }, []);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [mealsRes, summaryRes] = await Promise.all([
        api.get(`/meals?date=${activeDate}`),
        api.get(`/summary?date=${activeDate}`),
      ]);
      setMeals(mealsRes.data || []);
      setSummary(summaryRes.data || {});
      fetchFrequentFoods();
    } catch (err) {
      console.error('Failed to fetch calorie tracker data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [activeDate, fetchFrequentFoods]);

  useEffect(() => {
    fetchData(true);
    fetchFrequentFoods();
  }, [fetchData, fetchFrequentFoods]);

  // Subscribe to live Intermittent Fasting (IF) count and streak updates
  useEffect(() => {
    const unsub = subscribeFastingUpdates((newStats) => {
      setFastingStats(newStats);
    });
    return unsub;
  }, []);

  // Subscribe to live macro settings updates
  useEffect(() => {
    const handleMacroUpdate = (e) => {
      if (e.detail) setMacroSettings(e.detail);
    };
    window.addEventListener('lifeos_macro_updated', handleMacroUpdate);
    return () => window.removeEventListener('lifeos_macro_updated', handleMacroUpdate);
  }, []);

  // Compute live target macros based on daily calorie goal & selected split
  const currentMacroTargets = useMemo(() => {
    return calculateMacroTargets(
      summary.dailyCalorieGoal || 2000,
      macroSettings.presetId || 'balanced',
      macroSettings.customSplits
    );
  }, [summary.dailyCalorieGoal, macroSettings]);

  // Autocomplete Food Item Search
  useEffect(() => {
    if (!itemName.trim() || itemName.length < 2 || selectedFoodItem) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/food-items/search?q=${encodeURIComponent(itemName.trim())}`);
        setSuggestions(res.data || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Failed food item search', err);
      } finally {
        setSearchingSuggestions(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [itemName, selectedFoodItem]);

  const handleSelectFoodItem = (item) => {
    setSelectedFoodItem(item);
    setItemName(item.name);
    const itemUnit = item.unit || item.unitType || 'piece';
    setUnit(itemUnit);

    // Provide empty quantity so placeholder (e.g. 100 or e.g. 1) guides user
    setQuantity('');

    const isGramOrMl = itemUnit === 'gram' || itemUnit === 'g' || itemUnit === 'ml';
    const cal = item.caloriesPerUnit !== undefined
      ? Number(item.caloriesPerUnit)
      : isGramOrMl
        ? Number(item.caloriesPer100g ?? 100)
        : Number(item.caloriesPerPiece ?? 100);

    const p = item.proteinPerUnit !== undefined
      ? Number(item.proteinPerUnit)
      : isGramOrMl
        ? Number(item.proteinPer100g ?? 0)
        : Number(item.proteinPerPiece ?? 0);

    const c = item.carbsPerUnit !== undefined
      ? Number(item.carbsPerUnit)
      : isGramOrMl
        ? Number(item.carbsPer100g ?? 0)
        : Number(item.carbsPerPiece ?? 0);

    const f = item.fatPerUnit !== undefined
      ? Number(item.fatPerUnit)
      : isGramOrMl
        ? Number(item.fatPer100g ?? 0)
        : Number(item.fatPerPiece ?? 0);

    setCalPerUnit(cal);
    setProteinPerUnit(p);
    setCarbsPerUnit(c);
    setFatPerUnit(f);
    setShowSuggestions(false);
  };

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    const isNewGramOrMl = newUnit === 'gram' || newUnit === 'g' || newUnit === 'ml';

    if (selectedFoodItem) {
      if (isNewGramOrMl && selectedFoodItem.caloriesPer100g !== undefined) {
        setCalPerUnit(Number(selectedFoodItem.caloriesPer100g) || 100);
        setProteinPerUnit(Number(selectedFoodItem.proteinPer100g) || 0);
        setCarbsPerUnit(Number(selectedFoodItem.carbsPer100g) || 0);
        setFatPerUnit(Number(selectedFoodItem.fatPer100g) || 0);
      } else if (!isNewGramOrMl && selectedFoodItem.caloriesPerPiece !== undefined) {
        setCalPerUnit(Number(selectedFoodItem.caloriesPerPiece) || 100);
        setProteinPerUnit(Number(selectedFoodItem.proteinPerPiece) || 0);
        setCarbsPerUnit(Number(selectedFoodItem.carbsPerPiece) || 0);
        setFatPerUnit(Number(selectedFoodItem.fatPerPiece) || 0);
      }
    }
  };

  const openCreateModal = (mealType = 'Breakfast') => {
    setEditingMealId(null);
    setFormMealType(mealType);
    setFormDate(activeDate);
    setItemName('');
    setQuantity('');
    setUnit('gram');
    setCalPerUnit('');
    setProteinPerUnit('');
    setCarbsPerUnit('');
    setFatPerUnit('');
    setSelectedFoodItem(null);
    setShowSuggestions(false);
    setIsModalOpen(true);
  };

  const handleEditMeal = (meal) => {
    setEditingMealId(meal._id);
    setFormMealType(meal.mealType || 'Breakfast');
    setFormDate(meal.date || activeDate);
    if (meal.items && meal.items.length > 0) {
      const first = meal.items[0];
      setItemName(first.name || '');
      setQuantity(first.quantity ?? '');
      const u = first.unit || 'gram';
      setUnit(u);
      const isPer100 = u === 'gram' || u === 'g' || u === 'ml';
      const factor = isPer100 ? (first.quantity || 100) / 100 : (first.quantity || 1);
      setCalPerUnit(first.calories ? Math.round(first.calories / factor) : 100);
      setProteinPerUnit(first.protein ? Math.round((first.protein / factor) * 10) / 10 : 0);
      setCarbsPerUnit(first.carbs ? Math.round((first.carbs / factor) * 10) / 10 : 0);
      setFatPerUnit(first.fat ? Math.round((first.fat / factor) * 10) / 10 : 0);
    } else {
      setItemName('');
      setQuantity('');
      setUnit('gram');
      setCalPerUnit('');
      setProteinPerUnit('');
      setCarbsPerUnit('');
      setFatPerUnit('');
    }
    setSelectedFoodItem(null);
    setShowSuggestions(false);
    setIsModalOpen(true);
  };

  // Check if current unit is scaled per 100 units (grams or ml)
  const isPerHundred = unit === 'gram' || unit === 'g' || unit === 'ml';

  // Computed Atwater calories from macros
  const atwaterCalculatedCalories = useMemo(() => {
    const p = Number(proteinPerUnit) || 0;
    const c = Number(carbsPerUnit) || 0;
    const f = Number(fatPerUnit) || 0;
    if (p === 0 && c === 0 && f === 0) return 0;
    return Math.round(p * 4 + c * 4 + f * 9);
  }, [proteinPerUnit, carbsPerUnit, fatPerUnit]);

  // Effective calories per unit (custom or Atwater fallback)
  const effectiveCalPerUnit = useMemo(() => {
    if (calPerUnit !== '' && Number(calPerUnit) >= 0) {
      return Number(calPerUnit);
    }
    return atwaterCalculatedCalories || 0;
  }, [calPerUnit, atwaterCalculatedCalories]);

  // Live computed total calories and macros for current item
  const liveItemCalories = useMemo(() => {
    const q = quantity === '' ? (isPerHundred ? 100 : 1) : Number(quantity) || 0;
    const factor = isPerHundred ? q / 100 : q;
    return Math.round(effectiveCalPerUnit * factor * 10) / 10;
  }, [effectiveCalPerUnit, quantity, isPerHundred]);

  const liveItemProtein = useMemo(() => {
    const q = quantity === '' ? (isPerHundred ? 100 : 1) : Number(quantity) || 0;
    const factor = isPerHundred ? q / 100 : q;
    return Math.round((Number(proteinPerUnit) || 0) * factor * 10) / 10;
  }, [proteinPerUnit, quantity, isPerHundred]);

  const liveItemCarbs = useMemo(() => {
    const q = quantity === '' ? (isPerHundred ? 100 : 1) : Number(quantity) || 0;
    const factor = isPerHundred ? q / 100 : q;
    return Math.round((Number(carbsPerUnit) || 0) * factor * 10) / 10;
  }, [carbsPerUnit, quantity, isPerHundred]);

  const liveItemFat = useMemo(() => {
    const q = quantity === '' ? (isPerHundred ? 100 : 1) : Number(quantity) || 0;
    const factor = isPerHundred ? q / 100 : q;
    return Math.round((Number(fatPerUnit) || 0) * factor * 10) / 10;
  }, [fatPerUnit, quantity, isPerHundred]);

  // Live calculated macro percentage split for the portion
  const portionMacroSplit = useMemo(() => {
    const pCal = liveItemProtein * 4;
    const cCal = liveItemCarbs * 4;
    const fCal = liveItemFat * 9;
    const totalCal = pCal + cCal + fCal;
    if (totalCal <= 0) return { proteinPct: 0, carbsPct: 0, fatPct: 0, totalCal: 0 };
    const pPct = Math.round((pCal / totalCal) * 100);
    const cPct = Math.round((cCal / totalCal) * 100);
    const fPct = Math.max(0, 100 - pPct - cPct);
    return { proteinPct: pPct, carbsPct: cPct, fatPct: fPct, totalCal };
  }, [liveItemProtein, liveItemCarbs, liveItemFat]);

  const quickPortions = useMemo(() => {
    return isPerHundred ? [50, 100, 150, 200, 250, 300] : [0.5, 1, 1.5, 2, 3, 4];
  }, [isPerHundred]);

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    setSaving(true);
    const finalQuantity = quantity === '' ? (isPerHundred ? 100 : 1) : Number(quantity) || 1;
    const payload = {
      date: formDate,
      mealType: formMealType,
      items: [
        {
          name: itemName.trim(),
          quantity: finalQuantity,
          unit,
          caloriesPerUnit: Number(calPerUnit) || 0,
          proteinPerUnit: Number(proteinPerUnit) || 0,
          carbsPerUnit: Number(carbsPerUnit) || 0,
          fatPerUnit: Number(fatPerUnit) || 0,
          calories: liveItemCalories,
          protein: liveItemProtein,
          carbs: liveItemCarbs,
          fat: liveItemFat,
        },
      ],
    };

    try {
      if (editingMealId) {
        const res = await api.put(`/meals/${editingMealId}`, payload);
        setIsModalOpen(false);
        setEditingMealId(null);
        if (res.data) {
          setMeals((prev) =>
            prev.map((m) => (m._id === editingMealId ? res.data : m))
          );
        }
      } else {
        const res = await api.post('/meals', payload);
        setIsModalOpen(false);
        if (res.data) {
          setMeals((prev) => [res.data, ...prev]);
        }
      }
      fetchData(false);
    } catch (err) {
      console.error('Failed to save meal', err);
    } finally {
      setSaving(false);
    }
  };

  // Instant 0ms Optimistic Water Action
  const handleWaterAction = async (delta) => {
    const newGlasses = Math.max(0, (summary.waterGlasses || 0) + delta);
    const newMl = newGlasses * 250;

    // Optimistically update counter immediately
    setSummary((prev) => ({
      ...prev,
      waterGlasses: newGlasses,
      waterMl: newMl,
    }));

    try {
      await api.post('/water', { date: activeDate, increment: delta });
      fetchData(false);
    } catch (err) {
      console.error('Failed to update water', err);
      fetchData(false);
    }
  };

  const handleDeleteMeal = async () => {
    if (!deleteId) return;
    const targetId = deleteId;
    setDeleteId(null);
    setMeals((prev) => prev.filter((m) => m._id !== targetId));

    try {
      await api.delete(`/meals/${targetId}`);
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete meal', err);
      fetchData(false);
    }
  };

  const caloriePercentage = Math.min(
    100,
    Math.round(((summary.caloriesConsumed || 0) / (summary.dailyCalorieGoal || 2000)) * 100)
  );

  const macroData = [
    { name: 'Protein', value: summary.totalProtein || 0 },
    { name: 'Carbs', value: summary.totalCarbs || 0 },
    { name: 'Fat', value: summary.totalFat || 0 },
  ].filter((m) => m.value > 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category={t('categories.nutrition', 'Nutrition & Macros')}
        title={t('calories.title', 'Calorie & Meal Tracker')}
        description={`${t('calories.subtitle', 'Manage caloric intake, macronutrient ratios, and dietary goals with precision')} (${formatDisplayDate(activeDate)})`}
        action={
          <Button variant="gradient" size="md" icon={Plus} onClick={() => openCreateModal('Breakfast')}>
            {t('calories.logMeal', 'Log Meal')}
          </Button>
        }
      />

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
        <StatCard
          title={t('dashboard.caloriesToday', 'Calories Consumed')}
          value={`${summary.caloriesConsumed || 0} kcal`}
          subtitle={`Goal: ${summary.dailyCalorieGoal || 2000} kcal`}
          icon={Flame}
          color="amber"
        />
        <StatCard
          title={t('calories.budgetRemaining', 'Remaining Budget')}
          value={`${summary.remainingCalories || 0} kcal`}
          subtitle="Energy balance"
          icon={Utensils}
          color="indigo"
        />
        <StatCard
          title={t('calories.protein', 'Total Protein')}
          value={`${summary.totalProtein || 0}g`}
          subtitle="Muscle recovery"
          icon={Sparkles}
          color="purple"
        />
        <StatCard
          title={t('dashboard.waterToday', 'Water Hydration')}
          value={`${summary.waterGlasses || 0} Glasses`}
          subtitle={`${summary.waterMl || 0} ml consumed`}
          icon={Droplets}
          color="cyan"
        />
        <StatCard
          title={t('fasting.title', 'IF Completed Fasts')}
          value={`${fastingStats.completedCount} Done`}
          subtitle={`${fastingStats.streak}d streak · ${fastingStats.partialCount} partial · ${fastingStats.earlyEndedCount} <20%`}
          icon={Trophy}
          color="emerald"
        />
      </div>

      {/* Calorie Goal Progress & Hydration Quick Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
        {/* Calorie Progress Card */}
        <Card
          hover
          title="Daily Calorie Budget"
          subtitle="Intake progress against goal"
          icon={Flame}
          className="lg:col-span-2"
          badge={
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant="ghost"
                size="xs"
                icon={BookOpen}
                onClick={() => setShowDocsModal(true)}
                className="text-secondary hover:text-primary text-[11px] cursor-pointer"
                title="Read Calorie & Macro Science Documentation"
              >
                Science Docs
              </Button>
              <Button
                variant="outline"
                size="xs"
                icon={Calculator}
                onClick={() => setShowCalculatorModal(true)}
                className="font-bold text-[11px] cursor-pointer"
                title="Calculate Personal Body Calorie Budget (Mifflin-St Jeor)"
              >
                Calculate Body Budget
              </Button>
            </div>
          }
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-secondary">Progress: {caloriePercentage}%</span>
              <span className="text-primary">{summary.caloriesConsumed || 0} / {summary.dailyCalorieGoal || 2000} kcal</span>
            </div>
            <div className="w-full h-3.5 bg-subtle rounded-full overflow-hidden border border-theme p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${(summary.caloriesConsumed || 0) > (summary.dailyCalorieGoal || 2000)
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                  }`}
                style={{ width: `${caloriePercentage}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Water Hydration Interactive Tracker */}
        <Card hover title="Hydration Counter" subtitle="Track every glass of water" icon={Droplets}>
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-extrabold text-primary tracking-tight">
                  {summary.waterGlasses || 0} <span className="text-xs font-medium text-secondary">Glasses</span>
                </div>
                <span className="text-xs text-secondary font-medium">{summary.waterMl || 0} ml logged</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleWaterAction(-1)}
                  disabled={!summary.waterGlasses || summary.waterGlasses <= 0}
                  className="p-2 rounded-xl bg-subtle text-secondary hover:text-primary hover:bg-surface border border-theme transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Remove 1 Glass"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => handleWaterAction(1)}>
                  +1 Glass
                </Button>
              </div>
            </div>

            {/* Visual Glass Dots */}
            <div className="flex gap-1.5 flex-wrap pt-1">
              {Array.from({ length: Math.max(8, summary.waterGlasses || 0) }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-3.5 h-6 rounded-md border transition-all duration-200 ${idx < (summary.waterGlasses || 0)
                    ? 'bg-cyan-500 border-cyan-400 shadow-sm shadow-cyan-500/25 scale-105'
                    : 'bg-subtle border-theme opacity-40'
                    }`}
                />
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Macronutrient Budget & Intake Breakdown (Taken vs Yet to Take) */}
      <MacroBreakdownCard
        summary={summary}
        macroTargets={currentMacroTargets}
        onOpenCalculator={() => setShowCalculatorModal(true)}
        onOpenDocs={() => setShowDocsModal(true)}
      />

      {/* Dynamic Intermittent Fasting Timer */}
      <FastingTimer />

      {/* Macronutrient Chart & Meal Log Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
        {/* Macro Distribution Donut */}
        <Card hover title="Macronutrient Split" subtitle="Protein, Carbs, and Fat breakdown" icon={PieChartIcon}>
          {macroData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-xs text-secondary italic bg-subtle/50 rounded-xl border border-dashed border-theme mt-2">
              <PieChartIcon className="w-7 h-7 text-muted mb-1 stroke-1" />
              No macronutrients recorded today.
            </div>
          ) : (
            <div className="h-52 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MACRO_COLORS[index % MACRO_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val}g`, 'Amount']}
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Meals List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary tracking-tight">Today's Meals</h2>
            <span className="text-xs font-semibold text-secondary">{meals.length} meals logged</span>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : meals.length === 0 ? (
            <EmptyState
              icon={Utensils}
              title="No meals logged today"
              description="Log your breakfast, lunch, dinner or snack with accurate unit calculations."
              actionText="Log Meal"
              onAction={() => openCreateModal('Breakfast')}
            />
          ) : (
            <div className="space-y-3.5">
              {meals.map((meal) => (
                <Card
                  key={meal._id}
                  hover
                  bottomAction={
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditMeal(meal)}
                        className="p-1.5 rounded-lg bg-surface border border-theme text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/10 shadow-xs transition-all cursor-pointer"
                        title="Edit Meal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(meal._id)}
                        className="p-1.5 rounded-lg bg-surface border border-theme text-secondary hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/10 shadow-xs transition-all cursor-pointer"
                        title="Delete Meal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-3 pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="primary" size="sm" dot>
                        {meal.mealType}
                      </Badge>
                      <span className="text-sm font-extrabold text-primary">
                        {meal.totalCalories} kcal
                      </span>
                    </div>

                    {/* Meal Items List */}
                    <div className="space-y-1.5 pt-1">
                      {meal.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-subtle border border-theme"
                        >
                          <span className="font-bold text-primary">
                            {item.quantity} {item.unit} {item.name}
                          </span>
                          <span className="text-secondary font-semibold">
                            {item.calories} kcal · {item.protein}g P · {item.carbs}g C · {item.fat}g F
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log / Edit Meal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMealId ? t('calories.editMeal') : t('calories.logMeal')}
        subtitle={editingMealId ? t('calories.editMealSubtitle') : t('calories.logMealSubtitle')}
        maxWidth="max-w-5xl"
      >
        <form onSubmit={handleAddMeal} className="space-y-4">
          {/* Top Row: Meal Type Selection Pills & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-8">
              <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1.5">
                {t('calories.mealType')}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {MEAL_TYPES.map((mType) => {
                  const conf = MEAL_TYPE_CONFIG[mType] || { icon: '🍽️', label: mType };
                  const isSelected = formMealType === mType;
                  const localizedLabel =
                    mType === 'Breakfast' ? t('calories.breakfast') :
                      mType === 'Lunch' ? t('calories.lunch') :
                        mType === 'Dinner' ? t('calories.dinner') :
                          mType === 'Snack' ? t('calories.snack') : mType;
                  return (
                    <button
                      type="button"
                      key={mType}
                      onClick={() => setFormMealType(mType)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${isSelected
                        ? 'bg-accent/15 border-accent text-accent shadow-xs ring-1 ring-accent/30'
                        : 'bg-surface hover:bg-subtle border-theme text-secondary hover:text-primary'
                        }`}
                    >
                      <span className="text-sm">{conf.icon}</span>
                      <span className="truncate">{localizedLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-4">
              <DateInput
                label={t('calories.mealDate')}
                value={formDate}
                onChange={setFormDate}
                required
              />
            </div>
          </div>

          {/* Main 2-Column Grid: Left (Food & Portions) | Right (Nutrition & Calculations) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
            {/* Left Column: Food Item Search & Portions */}
            <div className="space-y-3 flex flex-col justify-between">
              {/* Autocomplete Food Search Input & Quick Staples */}
              <div className="space-y-1.5 relative">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider">
                    {t('calories.foodSearch')}
                  </label>
                  {selectedFoodItem && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {selectedFoodItem.source || 'Database'}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-secondary z-10">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={t('calories.searchFoodPlaceholder')}
                    value={itemName}
                    onChange={(e) => {
                      setItemName(e.target.value);
                      setSelectedFoodItem(null);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    className="input-base input-with-icon-left input-with-icon-right text-xs py-2"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  />
                  {itemName && (
                    <button
                      type="button"
                      onClick={() => {
                        setItemName('');
                        setSelectedFoodItem(null);
                        setShowSuggestions(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {searchingSuggestions && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Frequently Added Food / Quick Staples Chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar pt-0.5">
                  <span className="text-[10px] font-bold text-secondary uppercase shrink-0 mr-1 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-accent" /> {t('calories.staples')}
                  </span>
                  {frequentFoods.map((staple) => {
                    const isCurrent =
                      selectedFoodItem?.name === staple.name ||
                      (itemName.trim() && itemName.trim().toLowerCase() === staple.name.toLowerCase());
                    return (
                      <button
                        type="button"
                        key={staple._id || staple.name}
                        onClick={() => handleSelectFoodItem(staple)}
                        className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${isCurrent
                          ? 'bg-accent/15 border-accent text-accent shadow-xs font-bold'
                          : 'bg-subtle/70 hover:bg-subtle border-theme text-secondary hover:text-primary'
                          }`}
                        title={staple.source ? `${staple.name} • ${staple.source}` : staple.name}
                      >
                        <span>{staple.icon || '🍽️'}</span>
                        <span>{staple.name}</span>
                        {staple.timesUsed > 1 && (
                          <span className="text-[9px] px-1 py-0.2 rounded-full bg-accent/20 text-accent font-bold">
                            {staple.timesUsed}x
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-theme rounded-2xl card-shadow z-40 max-h-52 overflow-y-auto divide-y divide-theme/40 shadow-2xl">
                    {suggestions.map((food, idx) => (
                      <div
                        key={food._id || idx}
                        onClick={() => handleSelectFoodItem(food)}
                        className="p-2.5 hover:bg-subtle cursor-pointer flex items-center justify-between text-xs transition-colors group"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-primary group-hover:text-accent transition-colors">{food.name}</span>
                            {food.category && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-subtle text-secondary border border-theme">
                                {food.category}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-secondary font-medium">
                            {food.caloriesPerUnit} kcal / {food.unitType === 'gram' ? '100g' : food.unitType === 'ml' ? '100ml' : food.unitType || 'piece'} · <strong className="text-purple-600 dark:text-purple-400">{food.proteinPerUnit}g P</strong> · <strong className="text-emerald-600 dark:text-emerald-400">{food.carbsPerUnit}g C</strong> · <strong className="text-amber-600 dark:text-amber-400">{food.fatPerUnit}g F</strong>
                          </span>
                        </div>
                        {food.source && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-surface border border-theme text-secondary shrink-0 font-medium">
                            {food.source}
                          </span>
                        )}
                      </div>
                    ))}

                    {itemName.trim().length >= 2 && (
                      <div
                        onClick={() => {
                          setSelectedFoodItem({ name: itemName.trim(), isCustom: true });
                          setShowSuggestions(false);
                        }}
                        className="p-2 bg-accent/5 hover:bg-accent/10 cursor-pointer flex items-center justify-between text-xs text-accent font-bold transition-colors"
                      >
                        <span className="flex items-center gap-1.5 text-xs">
                          <Sparkles className="w-3.5 h-3.5" />
                          {t('calories.setCustomNutrition')} "{itemName}"
                        </span>
                        <Badge variant="primary" size="xs">{t('calories.customItemBadge')}</Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Portion Size & Unit Selection */}
              <div className="p-3 bg-subtle/40 rounded-2xl border border-theme space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
                      {t('calories.quantity')} {isPerHundred ? `(in ${unit}s)` : `(${unit}s)`}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder={isPerHundred ? 'e.g. 100' : 'e.g. 1'}
                      className="input-base text-xs py-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
                      {t('calories.measurementUnit')}
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => handleUnitChange(e.target.value)}
                      className="select-base capitalize text-xs py-1.5"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Portion Stepper Chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                  <span className="text-[10px] font-bold text-secondary uppercase shrink-0 mr-1 flex items-center gap-0.5">
                    <Scale className="w-2.5 h-2.5 text-secondary" /> {t('calories.quickPortion')}
                  </span>
                  {quickPortions.map((qVal) => {
                    const isCurrent = String(quantity) === String(qVal);
                    return (
                      <button
                        type="button"
                        key={qVal}
                        onClick={() => setQuantity(qVal)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${isCurrent
                          ? 'bg-accent border-accent text-white shadow-xs'
                          : 'bg-surface hover:bg-subtle border-theme text-secondary hover:text-primary'
                          }`}
                      >
                        {qVal}{isPerHundred ? (unit === 'ml' ? 'ml' : 'g') : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Nutritional Baseline & Calculated Portion HUD */}
            <div className="space-y-3 flex flex-col justify-between">
              {/* Unit Baseline Values (Micro Macro Cards) */}
              <div className="p-3 bg-subtle/40 rounded-2xl border border-theme space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-accent" />
                    <span className="text-[10px] font-extrabold text-secondary uppercase tracking-wider">
                      {t('calories.nutritionalBaseline')} {isPerHundred ? `(per 100 ${unit})` : `(per 1 ${unit})`}
                    </span>
                  </div>
                  {atwaterCalculatedCalories > 0 && Number(calPerUnit) !== atwaterCalculatedCalories && (
                    <button
                      type="button"
                      onClick={() => setCalPerUnit(atwaterCalculatedCalories)}
                      className="text-[10px] text-accent hover:underline font-bold flex items-center gap-0.5 cursor-pointer bg-accent/10 px-1.5 py-0.5 rounded-md border border-accent/20"
                      title="Auto-calculate calories"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      {atwaterCalculatedCalories} kcal
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {/* Calories */}
                  <div className="p-2 rounded-xl bg-surface border-amber-500/20 shadow-xs flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" /> Cal
                    </span>
                    <input
                      type="number"
                      value={calPerUnit}
                      onChange={(e) => setCalPerUnit(e.target.value)}
                      placeholder={atwaterCalculatedCalories ? `${atwaterCalculatedCalories}` : '100'}
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-1.5 py-1 text-xs font-bold text-primary focus:outline-none focus:border-amber-500 mt-1"
                    />
                  </div>

                  {/* Protein */}
                  <div className="p-2 rounded-xl bg-surface border-indigo-500/20 shadow-xs flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                      <Dumbbell className="w-2.5 h-2.5" /> Prot
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={proteinPerUnit}
                      onChange={(e) => setProteinPerUnit(e.target.value)}
                      placeholder="5"
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-1.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500 mt-1"
                    />
                  </div>

                  {/* Carbs */}
                  <div className="p-2 rounded-xl bg-surface border-emerald-500/20 shadow-xs flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> Carb
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={carbsPerUnit}
                      onChange={(e) => setCarbsPerUnit(e.target.value)}
                      placeholder="10"
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-1.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500 mt-1"
                    />
                  </div>

                  {/* Fat */}
                  <div className="p-2 rounded-xl bg-surface border-amber-500/20 shadow-xs flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      <Droplets className="w-2.5 h-2.5" /> Fat
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={fatPerUnit}
                      onChange={(e) => setFatPerUnit(e.target.value)}
                      placeholder="2"
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-1.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500 mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Live Calculated Portion HUD */}
              <div className="p-3 bg-gradient-to-br from-surface to-subtle rounded-2xl border border-theme shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-accent" />
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                      {t('calories.calculatedPortion')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-extrabold border border-accent/20">
                      {quantity || (isPerHundred ? 100 : 1)} {unit}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-primary tracking-tight">
                      {liveItemCalories}
                    </span>
                    <span className="text-[11px] font-bold text-secondary">{t('common.calories')}</span>
                  </div>
                </div>

                {/* Macro Badges 3-col */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">{t('calories.protein')}</span>
                    <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">{liveItemProtein}g</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">{t('calories.carbs')}</span>
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">{liveItemCarbs}g</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">{t('calories.fat')}</span>
                    <span className="text-xs font-black text-amber-700 dark:text-amber-300">{liveItemFat}g</span>
                  </div>
                </div>

                {/* Macro Distribution Ratio Progress Bar */}
                {portionMacroSplit.totalCal > 0 && (
                  <div className="space-y-1 pt-0.5">
                    <div className="h-1.5 w-full bg-subtle rounded-full overflow-hidden flex shadow-inner">
                      <div
                        style={{ width: `${portionMacroSplit.proteinPct}%` }}
                        className="h-full bg-indigo-500 transition-all duration-300"
                      />
                      <div
                        style={{ width: `${portionMacroSplit.carbsPct}%` }}
                        className="h-full bg-emerald-500 transition-all duration-300"
                      />
                      <div
                        style={{ width: `${portionMacroSplit.fatPct}%` }}
                        className="h-full bg-amber-500 transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-bold text-secondary px-0.5">
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {portionMacroSplit.proteinPct}% {t('calories.protein')}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {portionMacroSplit.carbsPct}% {t('calories.carbs')}
                      </span>
                      <span className="text-amber-600 dark:text-amber-400">
                        {portionMacroSplit.fatPct}% {t('calories.fat')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editingMealId ? t('calories.updateMeal') : t('calories.saveMeal')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('calories.deleteMealTitle')}
        subtitle={t('common.confirmDeleteDesc')}
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-secondary">
            {t('calories.deleteMealDesc')}
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteMeal}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Body Calorie Budget & Macro Calculator Modal */}
      <CalorieCalculatorModal
        isOpen={showCalculatorModal}
        onClose={() => setShowCalculatorModal(false)}
        onApplied={(result) => {
          setSummary((prev) => ({
            ...prev,
            dailyCalorieGoal: result.budgetKcal,
            remainingCalories: Math.max(0, result.budgetKcal - (prev.caloriesConsumed || 0)),
          }));
        }}
        onOpenDocs={() => {
          setShowCalculatorModal(false);
          setShowDocsModal(true);
        }}
      />

      {/* Macronutrient & Calorie Science Documentation Modal */}
      <MacroDocumentationModal
        isOpen={showDocsModal}
        onClose={() => setShowDocsModal(false)}
      />
    </div>
  );
};

export default CalorieTracker;
