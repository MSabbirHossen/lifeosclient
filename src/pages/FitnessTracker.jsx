import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { LoadingScreen } from '../components/LoadingScreen';
import { Logo } from '../components/Logo';
import { DateInput } from '../components/DateInput';
import api from '../utils/api';
import { notifyCreated, notifyUpdated, notifyDeleted, notifyError, confirmDelete, notifyGuestAction } from '../utils/alerts';
import { useAuth } from '../context/AuthContext';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import {
  Dumbbell,
  Plus,
  Trash2,
  Edit2,
  Flame,
  Activity,
  Scale,
  LineChart as LineChartIcon,
  Zap,
  Check,
  Search,
  CheckCircle2,
  Sparkles,
  X,
  Timer,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

const TARGET_TYPES = ['Muscle', 'Cardio', 'Flexibility', 'Sports'];

const TARGET_CONFIG = {
  Muscle: { label: 'Muscle', icon: '🏋️', color: 'indigo' },
  Cardio: { label: 'Cardio', icon: '🏃', color: 'rose' },
  Flexibility: { label: 'Flexibility', icon: '🧘', color: 'purple' },
  Sports: { label: 'Sports', icon: '⚽', color: 'emerald' },
};

const POPULAR_WORKOUT_STAPLES = [
  {
    name: 'Barbell Bench Press',
    target: 'Muscle',
    trackingType: 'sets_reps',
    defaultSets: 4,
    defaultReps: 10,
    defaultWeight: 60,
    met: 6.0,
    muscle: 'Chest',
    source: 'Verified Routine',
    icon: '🏋️',
  },
  {
    name: 'Barbell Back Squat',
    target: 'Muscle',
    trackingType: 'sets_reps',
    defaultSets: 4,
    defaultReps: 8,
    defaultWeight: 70,
    met: 7.5,
    muscle: 'Quads & Glutes',
    source: 'Verified Routine',
    icon: '🦵',
  },
  {
    name: 'Deadlift (Conventional)',
    target: 'Muscle',
    trackingType: 'sets_reps',
    defaultSets: 4,
    defaultReps: 6,
    defaultWeight: 80,
    met: 8.0,
    muscle: 'Full Posterior Chain',
    source: 'Verified Routine',
    icon: '💪',
  },
  {
    name: 'Outdoor Running',
    target: 'Cardio',
    trackingType: 'duration',
    defaultDuration: 30,
    met: 9.8,
    muscle: 'Cardiovascular',
    source: 'Verified Routine',
    icon: '🏃',
  },
  {
    name: 'Jump Rope (Skipping)',
    target: 'Cardio',
    trackingType: 'duration',
    defaultDuration: 20,
    met: 11.0,
    muscle: 'Full Body & Calves',
    source: 'Verified Routine',
    icon: '🦘',
  },
  {
    name: 'Stationary Cycling',
    target: 'Cardio',
    trackingType: 'duration',
    defaultDuration: 30,
    met: 7.0,
    muscle: 'Quads & Cardio',
    source: 'Verified Routine',
    icon: '🚴',
  },
  {
    name: 'Yoga (Vinyasa Flow)',
    target: 'Flexibility',
    trackingType: 'duration',
    defaultDuration: 45,
    met: 3.5,
    muscle: 'Mobility & Flexibility',
    source: 'Verified Routine',
    icon: '🧘',
  },
];

const TARGET_COLORS = {
  Muscle: 'indigo',
  Cardio: 'rose',
  Flexibility: 'purple',
  Sports: 'emerald',
};

// Metric Configuration with Colors, Units, and Icons
const METRIC_CONFIG = {
  weight: { key: 'weight', label: 'Weight', color: '#6366F1', unitMetric: 'kg', unitImperial: 'lbs', icon: '⚖️' },
  waist: { key: 'waist', label: 'Waist', color: '#10B981', unitMetric: 'cm', unitImperial: 'in', icon: '📏' },
  height: { key: 'height', label: 'Height', color: '#06B6D4', unitMetric: 'cm', unitImperial: 'in', icon: '🧍' },
  bodyFat: { key: 'bodyFat', label: 'Body Fat', color: '#F59E0B', unitMetric: '%', unitImperial: '%', icon: '📊' },
  chest: { key: 'chest', label: 'Chest', color: '#EC4899', unitMetric: 'cm', unitImperial: 'in', icon: '👕' },
  arms: { key: 'arms', label: 'Arms', color: '#8B5CF6', unitMetric: 'cm', unitImperial: 'in', icon: '💪' },
  shoulders: { key: 'shoulders', label: 'Shoulders', color: '#3B82F6', unitMetric: 'cm', unitImperial: 'in', icon: '🏋️' },
  hips: { key: 'hips', label: 'Hips', color: '#14B8A6', unitMetric: 'cm', unitImperial: 'in', icon: '👖' },
  thighs: { key: 'thighs', label: 'Thighs', color: '#F97316', unitMetric: 'cm', unitImperial: 'in', icon: '🦵' },
  calves: { key: 'calves', label: 'Calves', color: '#84CC16', unitMetric: 'cm', unitImperial: 'in', icon: '👟' },
  neck: { key: 'neck', label: 'Neck', color: '#A855F7', unitMetric: 'cm', unitImperial: 'in', icon: '🧣' },
};

// Unit Conversion Constants & Helpers
const KG_TO_LBS = 2.20462;
const CM_TO_IN = 0.393701;
const IN_TO_CM = 2.54;

const kgToLbs = (kg) => (kg !== undefined && kg !== null && kg !== '' ? Number((Number(kg) * KG_TO_LBS).toFixed(1)) : '');
const lbsToKg = (lbs) => (lbs !== undefined && lbs !== null && lbs !== '' ? Number((Number(lbs) / KG_TO_LBS).toFixed(2)) : '');
const cmToIn = (cm) => (cm !== undefined && cm !== null && cm !== '' ? Number((Number(cm) * CM_TO_IN).toFixed(1)) : '');
const inToCm = (inches) => (inches !== undefined && inches !== null && inches !== '' ? Number((Number(inches) * IN_TO_CM).toFixed(1)) : '');

export const FitnessTracker = ({ selectedDate }) => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const currentDate = selectedDate || getFormattedDate();


  const [workouts, setWorkouts] = useState([]);
  const [bodyMetrics, setBodyMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Unit System State ('metric' = kg, cm | 'imperial' = lbs, in)
  const [unitSystem, setUnitSystem] = useState(
    () => localStorage.getItem('lifeos_fitness_unit_system') || 'metric'
  );

  const handleUnitSystemChange = (newUnit) => {
    setUnitSystem(newUnit);
    try {
      localStorage.setItem('lifeos_fitness_unit_system', newUnit);
    } catch (e) {
      console.error(e);
    }
  };

  // Selected graph metric filter ('all' = all active metrics at once, or specific key)
  const [selectedGraphMetric, setSelectedGraphMetric] = useState('all');

  // Modals
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [deleteWorkoutId, setDeleteWorkoutId] = useState(null);
  const [editingMetricId, setEditingMetricId] = useState(null);
  const [deleteMetricId, setDeleteMetricId] = useState(null);

  // Workout Form State
  const [wDate, setWDate] = useState(currentDate);
  const [wName, setWName] = useState('');
  const [wTrackingType, setWTrackingType] = useState('sets_reps'); // 'sets_reps' | 'duration'
  const [wSets, setWSets] = useState('');
  const [wReps, setWReps] = useState('');
  const [wWeight, setWWeight] = useState('');
  const [wDuration, setWDuration] = useState('');
  const [wCalories, setWCalories] = useState('');
  const [wMet, setWMet] = useState(6.0);
  const [wIdealCalPerSet, setWIdealCalPerSet] = useState(8);
  const [wIdealCalPerMin, setWIdealCalPerMin] = useState(6);
  const [wTarget, setWTarget] = useState('Muscle');
  const [wNotes, setWNotes] = useState('');
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [savingMetric, setSavingMetric] = useState(false);

  // Workout Autocomplete Suggestions
  const [selectedWorkoutType, setSelectedWorkoutType] = useState(null);
  const [wSuggestions, setWSuggestions] = useState([]);
  const [showWSuggestions, setShowWSuggestions] = useState(false);
  const [searchingSuggestions, setSearchingSuggestions] = useState(false);

  // Metric Form State (placeholders instead of default values)
  const [mDate, setMDate] = useState(currentDate);
  const [mWeight, setMWeight] = useState('');
  const [mHeight, setMHeight] = useState('');
  const [mWaist, setMWaist] = useState('');
  const [mBodyFat, setMBodyFat] = useState('');
  const [mChest, setMChest] = useState('');
  const [mArm, setMArm] = useState('');
  const [mShoulders, setMShoulders] = useState('');
  const [mHips, setMHips] = useState('');
  const [mThighs, setMThighs] = useState('');
  const [mCalves, setMCalves] = useState('');
  const [mNeck, setMNeck] = useState('');
  const [mNotes, setMNotes] = useState('');

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [workoutsRes, metricsRes] = await Promise.all([
        api.get(`/workouts?date=${currentDate}`),
        api.get('/body-metrics'),
      ]);
      setWorkouts(workoutsRes.data || []);
      setBodyMetrics(metricsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch fitness data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Latest user weight for calorie estimation (defaults to 70kg)
  const latestUserWeight = useMemo(() => {
    const found = bodyMetrics.slice().reverse().find((m) => m.weightKg && m.weightKg > 0);
    return found ? found.weightKg : 70;
  }, [bodyMetrics]);

  // Live calorie calculation formula based on MET, duration/sets, and user weight
  const estimatedCalories = useMemo(() => {
    const weightKg = latestUserWeight;
    if (wTrackingType === 'duration') {
      const met = Number(wMet) || (wTarget === 'Cardio' ? 8.5 : wTarget === 'Sports' ? 7.5 : wTarget === 'Flexibility' ? 3.5 : 6.0);
      const hours = (Number(wDuration) || 0) / 60;
      return Math.round(met * weightKg * hours);
    } else {
      // Strength sets & reps
      const sets = Number(wSets) || 0;
      const reps = Number(wReps) || 0;
      if (sets === 0 || reps === 0) return 0;
      const liftWeight = Number(wWeight) || 0;
      const weightBonus = liftWeight > 0 ? (liftWeight / 100) * 0.2 : 0;
      const calPerRep = 0.8 + weightBonus;
      const bodyFactor = weightKg / 70;
      return Math.max(5, Math.round(sets * reps * calPerRep * bodyFactor));
    }
  }, [wTrackingType, wDuration, wMet, wTarget, wSets, wReps, wWeight, latestUserWeight]);

  // Live BMI & Weight Status Calculation
  const liveBmi = useMemo(() => {
    if (!mWeight || !mHeight) return null;
    const w = parseFloat(mWeight);
    const h = parseFloat(mHeight);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return null;
    const weightKg = unitSystem === 'metric' ? w : w * 0.453592;
    const heightM = unitSystem === 'metric' ? h / 100 : (h * 2.54) / 100;
    if (heightM <= 0) return null;
    const bmiVal = weightKg / (heightM * heightM);
    if (isNaN(bmiVal) || !isFinite(bmiVal)) return null;
    let label = 'Normal';
    let badgeClass = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    if (bmiVal < 18.5) {
      label = 'Underweight';
      badgeClass = 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    } else if (bmiVal >= 25 && bmiVal < 30) {
      label = 'Overweight';
      badgeClass = 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    } else if (bmiVal >= 30) {
      label = 'Obese';
      badgeClass = 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    }
    return {
      bmi: bmiVal.toFixed(1),
      label,
      badgeClass,
    };
  }, [mWeight, mHeight, unitSystem]);

  // Autocomplete Workout Types Search
  useEffect(() => {
    if (!wName.trim() || wName.length < 2 || selectedWorkoutType) {
      setWSuggestions([]);
      setShowWSuggestions(false);
      return;
    }

    setSearchingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/workout-types/search?q=${encodeURIComponent(wName.trim())}`);
        setWSuggestions(res.data || []);
        setShowWSuggestions(true);
      } catch (err) {
        console.error('Failed workout search', err);
      } finally {
        setSearchingSuggestions(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [wName, selectedWorkoutType]);

  const handleSelectWorkoutType = (wt) => {
    setSelectedWorkoutType(wt);
    setWName(wt.name);
    const target = wt.target || 'Muscle';
    setWTarget(target);
    const trackingType = wt.trackingType || (target === 'Cardio' || target === 'Sports' || target === 'Flexibility' ? 'duration' : 'sets_reps');
    setWTrackingType(trackingType);

    if (wt.met) setWMet(wt.met);
    if (wt.caloriesPerSet) setWIdealCalPerSet(wt.caloriesPerSet);
    if (wt.defaultCaloriesPerMinute) setWIdealCalPerMin(wt.defaultCaloriesPerMinute);

    if (trackingType === 'duration') {
      const dur = wt.defaultDuration || 30;
      setWDuration(dur);
      setWSets('');
      setWReps('');
      setWWeight('');
    } else {
      const sets = wt.defaultSets !== undefined && wt.defaultSets !== null ? wt.defaultSets : 3;
      const reps = wt.defaultReps !== undefined && wt.defaultReps !== null ? wt.defaultReps : 10;
      const weight = wt.defaultWeight !== undefined && wt.defaultWeight !== null && wt.defaultWeight !== 0 ? wt.defaultWeight : '';
      setWSets(sets);
      setWReps(reps);
      setWWeight(weight);
      setWDuration('');
    }

    setShowWSuggestions(false);
  };

  const openCreateWorkoutModal = () => {
    setEditingWorkoutId(null);
    setSelectedWorkoutType(null);
    setWDate(currentDate);
    setWName('');
    setWTrackingType('sets_reps');
    setWSets('');
    setWReps('');
    setWWeight('');
    setWDuration('');
    setWCalories('');
    setWTarget('Muscle');
    setWNotes('');
    setIsWorkoutModalOpen(true);
  };

  const handleEditWorkout = (w) => {
    setEditingWorkoutId(w._id);
    setSelectedWorkoutType(null);
    setWDate(w.date || currentDate);
    setWName(w.name || '');
    setWTrackingType(w.trackingType || (w.sets > 0 ? 'sets_reps' : 'duration'));
    setWSets(w.sets !== undefined && w.sets !== null ? w.sets : '');
    setWReps(w.reps !== undefined && w.reps !== null ? w.reps : '');
    setWWeight(w.weight !== undefined && w.weight !== 0 && w.weight !== null ? w.weight : '');
    setWDuration(w.durationMinutes !== undefined && w.durationMinutes !== null ? w.durationMinutes : '');
    setWCalories(w.caloriesBurned !== undefined && w.caloriesBurned !== null ? w.caloriesBurned : '');
    setWTarget(w.target || 'Muscle');
    setWNotes(w.notes || '');
    setIsWorkoutModalOpen(true);
  };

  const openCreateMetricModal = () => {
    setEditingMetricId(null);
    setMDate(currentDate);
    setMWeight('');
    setMHeight('');
    setMWaist('');
    setMBodyFat('');
    setMChest('');
    setMArm('');
    setMShoulders('');
    setMHips('');
    setMThighs('');
    setMCalves('');
    setMNeck('');
    setMNotes('');
    setIsMetricModalOpen(true);
  };

  const handleEditMetric = (metric) => {
    setEditingMetricId(metric._id);
    setMDate(metric.date || currentDate);
    if (unitSystem === 'imperial') {
      setMWeight(metric.weightKg ? kgToLbs(metric.weightKg) : '');
      setMHeight(metric.heightCm ? cmToIn(metric.heightCm) : '');
      setMWaist(metric.waistCm ? cmToIn(metric.waistCm) : '');
      setMBodyFat(metric.bodyFatPercent !== undefined && metric.bodyFatPercent !== null ? metric.bodyFatPercent : '');
      setMChest(metric.chestCm ? cmToIn(metric.chestCm) : '');
      setMArm(metric.armCm ? cmToIn(metric.armCm) : '');
      setMShoulders(metric.shouldersCm ? cmToIn(metric.shouldersCm) : '');
      setMHips(metric.hipsCm ? cmToIn(metric.hipsCm) : '');
      setMThighs(metric.thighsCm ? cmToIn(metric.thighsCm) : '');
      setMCalves(metric.calvesCm ? cmToIn(metric.calvesCm) : '');
      setMNeck(metric.neckCm ? cmToIn(metric.neckCm) : '');
    } else {
      setMWeight(metric.weightKg !== undefined && metric.weightKg !== null ? metric.weightKg : '');
      setMHeight(metric.heightCm !== undefined && metric.heightCm !== null ? metric.heightCm : '');
      setMWaist(metric.waistCm !== undefined && metric.waistCm !== null ? metric.waistCm : '');
      setMBodyFat(metric.bodyFatPercent !== undefined && metric.bodyFatPercent !== null ? metric.bodyFatPercent : '');
      setMChest(metric.chestCm !== undefined && metric.chestCm !== null ? metric.chestCm : '');
      setMArm(metric.armCm !== undefined && metric.armCm !== null ? metric.armCm : '');
      setMShoulders(metric.shouldersCm !== undefined && metric.shouldersCm !== null ? metric.shouldersCm : '');
      setMHips(metric.hipsCm !== undefined && metric.hipsCm !== null ? metric.hipsCm : '');
      setMThighs(metric.thighsCm !== undefined && metric.thighsCm !== null ? metric.thighsCm : '');
      setMCalves(metric.calvesCm !== undefined && metric.calvesCm !== null ? metric.calvesCm : '');
      setMNeck(metric.neckCm !== undefined && metric.neckCm !== null ? metric.neckCm : '');
    }
    setMNotes(metric.notes || '');
    setIsMetricModalOpen(true);
  };

  const handleToggleModalUnit = (targetUnit) => {
    if (targetUnit === unitSystem) return;
    if (targetUnit === 'imperial') {
      // metric -> imperial
      if (mWeight) setMWeight(kgToLbs(mWeight));
      if (mHeight) setMHeight(cmToIn(mHeight));
      if (mWaist) setMWaist(cmToIn(mWaist));
      if (mChest) setMChest(cmToIn(mChest));
      if (mArm) setMArm(cmToIn(mArm));
      if (mShoulders) setMShoulders(cmToIn(mShoulders));
      if (mHips) setMHips(cmToIn(mHips));
      if (mThighs) setMThighs(cmToIn(mThighs));
      if (mCalves) setMCalves(cmToIn(mCalves));
      if (mNeck) setMNeck(cmToIn(mNeck));
    } else {
      // imperial -> metric
      if (mWeight) setMWeight(lbsToKg(mWeight));
      if (mHeight) setMHeight(inToCm(mHeight));
      if (mWaist) setMWaist(inToCm(mWaist));
      if (mChest) setMChest(inToCm(mChest));
      if (mArm) setMArm(inToCm(mArm));
      if (mShoulders) setMShoulders(inToCm(mShoulders));
      if (mHips) setMHips(inToCm(mHips));
      if (mThighs) setMThighs(inToCm(mThighs));
      if (mCalves) setMCalves(inToCm(mCalves));
      if (mNeck) setMNeck(inToCm(mNeck));
    }
    handleUnitSystemChange(targetUnit);
  };

  const handleWorkoutSubmit = async (e) => {
    e.preventDefault();
    if (!wName.trim()) return;

    const finalCalories = wCalories ? Number(wCalories) : estimatedCalories;

    const payload = {
      date: wDate,
      name: wName.trim(),
      trackingType: wTrackingType,
      sets: wSets ? Number(wSets) : 3,
      reps: wReps ? Number(wReps) : 10,
      weight: wWeight ? Number(wWeight) : 0,
      durationMinutes: wDuration ? Number(wDuration) : 30,
      caloriesBurned: finalCalories,
      idealCaloriesPerSet: Number(wIdealCalPerSet),
      idealCaloriesPerMin: Number(wIdealCalPerMin),
      target: wTarget,
      notes: wNotes.trim(),
    };

    if (!user) {
      const mockWorkout = {
        _id: editingWorkoutId || `guest-workout-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      if (editingWorkoutId) {
        setWorkouts((prev) => prev.map((w) => (w._id === editingWorkoutId ? mockWorkout : w)));
        notifyGuestAction('Workout', 'updated');
      } else {
        setWorkouts((prev) => [mockWorkout, ...prev]);
        notifyGuestAction('Workout', 'logged');
      }
      setIsWorkoutModalOpen(false);
      setEditingWorkoutId(null);
      setWName('');
      setWNotes('');
      setWCalories('');
      return;
    }

    setSavingWorkout(true);
    try {
      if (editingWorkoutId) {
        const res = await api.put(`/workouts/${editingWorkoutId}`, payload);
        setIsWorkoutModalOpen(false);
        setEditingWorkoutId(null);
        if (res.data) {
          setWorkouts((prev) =>
            prev.map((w) => (w._id === editingWorkoutId ? res.data : w))
          );
        }
        notifyUpdated('Workout');
      } else {
        const res = await api.post('/workouts', payload);
        setIsWorkoutModalOpen(false);
        if (res.data) setWorkouts((prev) => [res.data, ...prev]);
        notifyCreated('Workout');
      }
      setWName('');
      setWNotes('');
      setWCalories('');
      fetchData(false);
    } catch (err) {
      console.error('Failed to log workout', err);
      notifyError(err, 'Failed to save workout');
    } finally {
      setSavingWorkout(false);
    }
  };

  const handleMetricSubmit = async (e) => {
    e.preventDefault();
    if (
      !mWeight &&
      !mHeight &&
      !mWaist &&
      !mBodyFat &&
      !mChest &&
      !mArm &&
      !mShoulders &&
      !mHips &&
      !mThighs &&
      !mCalves &&
      !mNeck
    ) {
      return;
    }

    const isImp = unitSystem === 'imperial';
    const weightInKg = isImp ? lbsToKg(mWeight) : (mWeight ? Number(mWeight) : undefined);
    const heightInCm = isImp ? inToCm(mHeight) : (mHeight ? Number(mHeight) : undefined);
    const waistInCm = isImp ? inToCm(mWaist) : (mWaist ? Number(mWaist) : undefined);
    const chestInCm = isImp ? inToCm(mChest) : (mChest ? Number(mChest) : undefined);
    const armInCm = isImp ? inToCm(mArm) : (mArm ? Number(mArm) : undefined);
    const shouldersInCm = isImp ? inToCm(mShoulders) : (mShoulders ? Number(mShoulders) : undefined);
    const hipsInCm = isImp ? inToCm(mHips) : (mHips ? Number(mHips) : undefined);
    const thighsInCm = isImp ? inToCm(mThighs) : (mThighs ? Number(mThighs) : undefined);
    const calvesInCm = isImp ? inToCm(mCalves) : (mCalves ? Number(mCalves) : undefined);
    const neckInCm = isImp ? inToCm(mNeck) : (mNeck ? Number(mNeck) : undefined);
    const bodyFatNum = mBodyFat !== '' && mBodyFat !== null && mBodyFat !== undefined ? Number(mBodyFat) : undefined;

    const payload = {
      date: mDate,
      weightKg: weightInKg !== undefined && weightInKg !== '' ? Number(weightInKg) : undefined,
      heightCm: heightInCm !== undefined && heightInCm !== '' ? Number(heightInCm) : undefined,
      waistCm: waistInCm !== undefined && waistInCm !== '' ? Number(waistInCm) : undefined,
      bodyFatPercent: bodyFatNum !== undefined && !isNaN(bodyFatNum) ? Number(bodyFatNum) : undefined,
      chestCm: chestInCm !== undefined && chestInCm !== '' ? Number(chestInCm) : undefined,
      armCm: armInCm !== undefined && armInCm !== '' ? Number(armInCm) : undefined,
      shouldersCm: shouldersInCm !== undefined && shouldersInCm !== '' ? Number(shouldersInCm) : undefined,
      hipsCm: hipsInCm !== undefined && hipsInCm !== '' ? Number(hipsInCm) : undefined,
      thighsCm: thighsInCm !== undefined && thighsInCm !== '' ? Number(thighsInCm) : undefined,
      calvesCm: calvesInCm !== undefined && calvesInCm !== '' ? Number(calvesInCm) : undefined,
      neckCm: neckInCm !== undefined && neckInCm !== '' ? Number(neckInCm) : undefined,
      notes: mNotes.trim(),
    };

    if (!user) {
      const mockMetric = {
        _id: editingMetricId || `guest-metric-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      if (editingMetricId) {
        setBodyMetrics((prev) => prev.map((m) => (m._id === editingMetricId ? mockMetric : m)));
        notifyGuestAction('Body metric', 'updated');
      } else {
        setBodyMetrics((prev) => [...prev.filter((m) => m.date !== mDate), mockMetric]);
        notifyGuestAction('Body metric', 'logged');
      }
      openCreateMetricModal();
      setIsMetricModalOpen(false);
      return;
    }

    setSavingMetric(true);
    try {
      if (editingMetricId) {
        const res = await api.put(`/body-metrics/${editingMetricId}`, payload);
        setIsMetricModalOpen(false);
        setEditingMetricId(null);
        if (res.data) {
          setBodyMetrics((prev) =>
            prev.map((m) => (m._id === editingMetricId ? res.data : m))
          );
        }
        notifyUpdated('Body metric');
      } else {
        const res = await api.post('/body-metrics', payload);
        setIsMetricModalOpen(false);
        if (res.data) setBodyMetrics((prev) => [...prev.filter((m) => m.date !== mDate), res.data]);
        notifyCreated('Body metric');
      }
      openCreateMetricModal();
      setIsMetricModalOpen(false);
      fetchData(false);
    } catch (err) {
      console.error('Failed to log body metric', err);
      notifyError(err, 'Failed to save body metric');
    } finally {
      setSavingMetric(false);
    }
  };

  const handleDeleteWorkout = async (wId) => {
    const targetId = wId || deleteWorkoutId;
    if (!targetId) return;

    const isConfirmed = await confirmDelete('Workout');
    if (!isConfirmed) return;

    setDeleteWorkoutId(null);
    setWorkouts((prev) => prev.filter((w) => w._id !== targetId));

    if (!user) {
      notifyGuestAction('Workout', 'deleted');
      return;
    }

    try {
      await api.delete(`/workouts/${targetId}`);
      notifyDeleted('Workout');
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete workout', err);
      notifyError(err, 'Failed to delete workout');
      fetchData(false);
    }
  };

  const handleDeleteMetric = async (mId) => {
    const targetId = mId || deleteMetricId;
    if (!targetId) return;

    const isConfirmed = await confirmDelete('Body Metric');
    if (!isConfirmed) return;

    setDeleteMetricId(null);
    setBodyMetrics((prev) => prev.filter((m) => m._id !== targetId));

    if (!user) {
      notifyGuestAction('Body metric', 'deleted');
      return;
    }

    try {
      await api.delete(`/body-metrics/${targetId}`);
      notifyDeleted('Body metric');
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete body metric', err);
      notifyError(err, 'Failed to delete body metric');
      fetchData(false);
    }
  };


  const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const totalWorkoutMinutes = workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
  const latestWeight = bodyMetrics.slice().reverse().find((m) => m.weightKg)?.weightKg;

  // Compute full multi-metric chart data
  const chartData = useMemo(() => {
    return bodyMetrics.map((m) => {
      const isImp = unitSystem === 'imperial';
      return {
        date: m.date.slice(5),
        fullDate: m.date,
        weight: m.weightKg !== undefined && m.weightKg !== null ? (isImp ? kgToLbs(m.weightKg) : m.weightKg) : null,
        waist: m.waistCm !== undefined && m.waistCm !== null ? (isImp ? cmToIn(m.waistCm) : m.waistCm) : null,
        height: m.heightCm !== undefined && m.heightCm !== null ? (isImp ? cmToIn(m.heightCm) : m.heightCm) : null,
        bodyFat: m.bodyFatPercent !== undefined && m.bodyFatPercent !== null ? m.bodyFatPercent : null,
        chest: m.chestCm !== undefined && m.chestCm !== null ? (isImp ? cmToIn(m.chestCm) : m.chestCm) : null,
        arms: m.armCm !== undefined && m.armCm !== null ? (isImp ? cmToIn(m.armCm) : m.armCm) : null,
        shoulders: m.shouldersCm !== undefined && m.shouldersCm !== null ? (isImp ? cmToIn(m.shouldersCm) : m.shouldersCm) : null,
        hips: m.hipsCm !== undefined && m.hipsCm !== null ? (isImp ? cmToIn(m.hipsCm) : m.hipsCm) : null,
        thighs: m.thighsCm !== undefined && m.thighsCm !== null ? (isImp ? cmToIn(m.thighsCm) : m.thighsCm) : null,
        calves: m.calvesCm !== undefined && m.calvesCm !== null ? (isImp ? cmToIn(m.calvesCm) : m.calvesCm) : null,
        neck: m.neckCm !== undefined && m.neckCm !== null ? (isImp ? cmToIn(m.neckCm) : m.neckCm) : null,
      };
    });
  }, [bodyMetrics, unitSystem]);

  // Determine active metrics that actually have at least one valid data point across the dataset
  const activeMetrics = useMemo(() => {
    const keys = Object.keys(METRIC_CONFIG);
    return keys.filter((k) =>
      chartData.some((d) => d[k] !== null && d[k] !== undefined && !isNaN(d[k]))
    );
  }, [chartData]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category={t('categories.health', 'Health & Physicality')}
        title={t('fitness.title', 'Fitness & Workouts')}
        description={`${t('fitness.subtitle', 'Track strength, cardio, and energy expenditure with real MET-based calorie burn calculations')} (${formatDisplayDate(currentDate)})`}
        action={
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              icon={Scale}
              onClick={openCreateMetricModal}
            >
              {t('fitness.measurements', 'Measurements')}
            </Button>
            <Button
              variant="gradient"
              size="md"
              icon={Plus}
              onClick={openCreateWorkoutModal}
            >
              {t('fitness.logWorkout', 'Log Workout')}
            </Button>
          </div>
        }
      />

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title={t('fitness.activeEnergyBurned', 'Active Energy Burned')}
          value={`${totalCaloriesBurned} kcal`}
          subtitle={`${workouts.length} exercises logged`}
          icon={Flame}
          color="rose"
        />
        <StatCard
          title={t('fitness.exerciseDuration', 'Exercise Duration')}
          value={`${Math.floor(totalWorkoutMinutes / 60)}h ${totalWorkoutMinutes % 60}m`}
          subtitle="Total training time"
          icon={Dumbbell}
          color="indigo"
        />
        <StatCard
          title={t('fitness.currentWeight', 'Current Weight')}
          value={latestWeight ? `${latestWeight} kg` : `${latestUserWeight} kg (est)`}
          subtitle="Used for accurate calorie formula"
          icon={Scale}
          color="emerald"
        />
      </div>

      {/* Workouts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary tracking-tight">
            {t('fitness.todaysExercises', "Today's Exercises & Workouts")}
          </h2>
          <span className="text-xs font-semibold text-secondary">{workouts.length} logged</span>
        </div>

        {loading ? (
          <LoadingScreen fullScreen={false} message="Loading workouts & metrics..." size="md" />
        ) : workouts.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title={t('fitness.noWorkoutsToday', 'No workouts recorded today')}
            description={t('fitness.noWorkoutsDesc', 'Log your workout session to calculate calories burned and track physical progress.')}
            actionText={t('fitness.logWorkout', 'Log Workout')}
            onAction={openCreateWorkoutModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {workouts.map((w) => (
              <Card
                key={w._id}
                hover
                bottomAction={
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditWorkout(w)}
                      className="p-1.5 rounded-lg bg-surface border border-theme text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/10 shadow-xs transition-all cursor-pointer"
                      title="Edit Workout"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteWorkout(w._id)}
                      className="p-1.5 rounded-lg bg-surface border border-theme text-secondary hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/10 shadow-xs transition-all cursor-pointer"
                      title="Delete Workout"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                }
              >
                <div className="space-y-3 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={TARGET_COLORS[w.target] || 'neutral'} size="sm" dot>
                      {w.target}
                    </Badge>
                    <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                      {w.caloriesBurned} kcal
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-primary tracking-tight">{w.name}</h4>

                  {w.trackingType === 'sets_reps' || w.sets > 0 ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-primary bg-subtle p-2 rounded-xl border border-theme">
                      <Zap className="w-3.5 h-3.5 text-accent" />
                      <span>
                        {w.sets} Sets × {w.reps} Reps {w.weight > 0 ? `@ ${w.weight} kg` : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-secondary font-semibold bg-subtle p-2 rounded-xl border border-theme">
                      <Activity className="w-3.5 h-3.5 text-accent" />
                      <span>Duration: {w.durationMinutes} minutes</span>
                    </div>
                  )}

                  {w.notes && (
                    <p className="text-xs text-secondary font-medium leading-relaxed bg-subtle p-2 rounded-xl border border-theme">
                      {w.notes}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Body Metrics Trend & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
        <Card
          hover
          title="Body Measurements Progress"
          subtitle="Interactive multi-metric trends and sparse data tracking"
          icon={LineChartIcon}
          className="lg:col-span-2"
          badge={
            <div className="flex bg-subtle p-0.5 rounded-xl border border-theme">
              <button
                type="button"
                onClick={() => handleUnitSystemChange('metric')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${unitSystem === 'metric'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-secondary hover:text-primary'
                  }`}
              >
                kg / cm
              </button>
              <button
                type="button"
                onClick={() => handleUnitSystemChange('imperial')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${unitSystem === 'imperial'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-secondary hover:text-primary'
                  }`}
              >
                lbs / in
              </button>
            </div>
          }
        >
          {activeMetrics.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-xs text-secondary italic bg-subtle/50 rounded-2xl border border-dashed border-theme mt-2 p-6 text-center">
              <Scale className="w-10 h-10 text-muted mb-2 stroke-1" />
              <p className="font-bold text-primary text-sm not-italic">No measurements recorded yet</p>
              <p className="text-secondary mt-1 max-w-xs">
                Log your weight, height, waist, or body circumferences to visualize your physical transformation trajectory.
              </p>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={openCreateMetricModal}
                className="mt-4"
              >
                Log First Measurement
              </Button>
            </div>
          ) : (
            <div className="space-y-3 mt-1">
              {/* Interactive Metric Filter Pill Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedGraphMetric('all')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer border ${selectedGraphMetric === 'all'
                    ? 'bg-accent text-white border-accent shadow-xs'
                    : 'bg-subtle text-secondary border-theme hover:text-primary hover:bg-surface'
                    }`}
                >
                  All Data ({activeMetrics.length})
                </button>
                {activeMetrics.map((key) => {
                  const cfg = METRIC_CONFIG[key];
                  const isSelected = selectedGraphMetric === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedGraphMetric(key)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${isSelected
                        ? 'bg-surface text-primary border-accent shadow-xs'
                        : 'bg-subtle text-secondary border-theme hover:text-primary hover:bg-surface'
                        }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Multi-Line Recharts Plot */}
              <div className="h-64 sm:h-72 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.12} />
                    <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const fullDate = payload[0]?.payload?.fullDate || label;
                          return (
                            <div className="bg-surface border border-theme rounded-2xl shadow-xl p-3 text-xs space-y-1.5 min-w-[180px]">
                              <span className="font-bold text-primary block pb-1 border-b border-subtle">
                                {formatDisplayDate(fullDate)}
                              </span>
                              <div className="space-y-1">
                                {payload.map((entry) => {
                                  const cfg = METRIC_CONFIG[entry.dataKey];
                                  if (!cfg || entry.value === null || entry.value === undefined) return null;
                                  const unit = unitSystem === 'imperial' ? cfg.unitImperial : cfg.unitMetric;
                                  return (
                                    <div key={entry.dataKey} className="flex items-center justify-between gap-3">
                                      <span className="flex items-center gap-1.5 font-medium text-secondary">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                                        {cfg.label}:
                                      </span>
                                      <span className="font-extrabold text-primary">
                                        {entry.value} {unit}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      formatter={(val) => <span className="text-xs font-semibold text-primary">{val}</span>}
                    />
                    {activeMetrics.map((key) => {
                      const cfg = METRIC_CONFIG[key];
                      const isVisible = selectedGraphMetric === 'all' || selectedGraphMetric === key;
                      if (!isVisible) return null;
                      const unit = unitSystem === 'imperial' ? cfg.unitImperial : cfg.unitMetric;
                      return (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={`${cfg.label} (${unit})`}
                          stroke={cfg.color}
                          strokeWidth={2.5}
                          dot={{ r: 3.5, strokeWidth: 1 }}
                          activeDot={{ r: 6 }}
                          connectNulls
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>

        {/* Recent Measurement Log History Card */}
        <Card
          hover
          title="Measurement Log"
          subtitle="Recent metrics recorded"
          icon={Scale}
          action={
            <Button variant="ghost" size="xs" icon={Plus} onClick={openCreateMetricModal}>
              Log
            </Button>
          }
        >
          {bodyMetrics.length === 0 ? (
            <p className="text-xs text-secondary italic py-4">No measurements logged yet.</p>
          ) : (
            <div className="space-y-3 mt-1 max-h-[380px] overflow-y-auto pr-1">
              {bodyMetrics
                .slice()
                .reverse()
                .slice(0, 10)
                .map((m, idx) => (
                  <div
                    key={m._id || idx}
                    className="p-3.5 rounded-2xl bg-subtle border border-theme flex flex-col justify-between gap-2.5 transition-all hover:border-theme-strong"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary block">{formatDisplayDate(m.date)}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditMetric(m)}
                          className="p-1.5 rounded-lg bg-surface border border-theme text-secondary hover:text-accent hover:border-accent/40 hover:bg-accent/10 shadow-xs transition-all cursor-pointer"
                          title="Edit Measurement"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMetric(m._id)}
                          className="p-1.5 rounded-lg bg-surface border border-theme text-secondary hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/10 shadow-xs transition-all cursor-pointer"
                          title="Delete Measurement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {m.weightKg && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
                          Weight: {unitSystem === 'metric' ? `${m.weightKg} kg` : `${kgToLbs(m.weightKg)} lbs`}
                        </span>
                      )}
                      {m.heightCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-semibold">
                          Height: {unitSystem === 'metric' ? `${m.heightCm} cm` : `${cmToIn(m.heightCm)} in`}
                        </span>
                      )}
                      {m.waistCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                          Waist: {unitSystem === 'metric' ? `${m.waistCm} cm` : `${cmToIn(m.waistCm)} in`}
                        </span>
                      )}
                      {m.bodyFatPercent !== undefined && m.bodyFatPercent !== null && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
                          BF: {m.bodyFatPercent}%
                        </span>
                      )}
                      {m.chestCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 font-semibold">
                          Chest: {unitSystem === 'metric' ? `${m.chestCm} cm` : `${cmToIn(m.chestCm)} in`}
                        </span>
                      )}
                      {m.armCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-semibold">
                          Arms: {unitSystem === 'metric' ? `${m.armCm} cm` : `${cmToIn(m.armCm)} in`}
                        </span>
                      )}
                      {m.shouldersCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold">
                          Shoulders: {unitSystem === 'metric' ? `${m.shouldersCm} cm` : `${cmToIn(m.shouldersCm)} in`}
                        </span>
                      )}
                      {m.hipsCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-semibold">
                          Hips: {unitSystem === 'metric' ? `${m.hipsCm} cm` : `${cmToIn(m.hipsCm)} in`}
                        </span>
                      )}
                      {m.thighsCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-semibold">
                          Thighs: {unitSystem === 'metric' ? `${m.thighsCm} cm` : `${cmToIn(m.thighsCm)} in`}
                        </span>
                      )}
                      {m.calvesCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-lime-500/10 text-lime-600 dark:text-lime-400 border border-lime-500/20 font-semibold">
                          Calves: {unitSystem === 'metric' ? `${m.calvesCm} cm` : `${cmToIn(m.calvesCm)} in`}
                        </span>
                      )}
                      {m.neckCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 font-semibold">
                          Neck: {unitSystem === 'metric' ? `${m.neckCm} cm` : `${cmToIn(m.neckCm)} in`}
                        </span>
                      )}
                    </div>

                    {m.notes && (
                      <p className="text-[11px] text-secondary italic border-t border-subtle/80 pt-1.5">
                        "{m.notes}"
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* Workout Modal */}
      <Modal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        title={editingWorkoutId ? t('fitness.editWorkout') : t('fitness.logWorkout')}
        subtitle={editingWorkoutId ? t('fitness.editWorkoutSubtitle') : t('fitness.logWorkoutSubtitle')}
        maxWidth="max-w-6xl"
      >
        <form onSubmit={handleWorkoutSubmit} className="space-y-4">
          {/* Top Row: Tracking Type Mode Switcher + Target Category + Workout Date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1.5">
                Tracking Mode
              </label>
              <div className="flex bg-subtle p-1 rounded-xl border border-theme">
                <button
                  type="button"
                  onClick={() => {
                    setWTrackingType('sets_reps');
                    if (wTarget === 'Cardio' || wTarget === 'Flexibility') setWTarget('Muscle');
                    if (!wSets) setWSets(3);
                    if (!wReps) setWReps(10);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${wTrackingType === 'sets_reps'
                    ? 'bg-surface text-primary card-shadow ring-1 ring-accent/20'
                    : 'text-secondary hover:text-primary'
                    }`}
                >
                  <span>🏋️</span> {t('fitness.setsAndReps')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWTrackingType('duration');
                    if (wTarget === 'Muscle') setWTarget('Cardio');
                    if (!wDuration) setWDuration(30);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${wTrackingType === 'duration'
                    ? 'bg-surface text-primary card-shadow ring-1 ring-accent/20'
                    : 'text-secondary hover:text-primary'
                    }`}
                >
                  <span>⏱️</span> {t('fitness.timeAndDuration')}
                </button>
              </div>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1.5">
                {t('fitness.targetCategory')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                {TARGET_TYPES.map((tCat) => {
                  const conf = TARGET_CONFIG[tCat] || { icon: '🎯', label: tCat, color: 'indigo' };
                  const isSelected = wTarget === tCat;
                  return (
                    <button
                      type="button"
                      key={tCat}
                      onClick={() => {
                        setWTarget(tCat);
                        if ((tCat === 'Cardio' || tCat === 'Sports' || tCat === 'Flexibility') && wTrackingType === 'sets_reps') {
                          setWTrackingType('duration');
                          if (!wDuration) setWDuration(30);
                        } else if (tCat === 'Muscle' && wTrackingType === 'duration') {
                          setWTrackingType('sets_reps');
                          if (!wSets) setWSets(3);
                          if (!wReps) setWReps(10);
                        }
                      }}
                      className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl border text-[11px] font-bold transition-all duration-200 cursor-pointer ${isSelected
                        ? 'bg-accent/15 border-accent text-accent shadow-xs ring-1 ring-accent/30'
                        : 'bg-surface hover:bg-subtle border-theme text-secondary hover:text-primary'
                        }`}
                    >
                      <span>{conf.icon}</span>
                      <span className="truncate">{tCat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-3">
              <DateInput
                label={t('fitness.workoutDate')}
                value={wDate}
                onChange={setWDate}
                required
              />
            </div>
          </div>

          {/* Main 2-Column Grid: Left (Exercise & Numeric Inputs) | Right (Estimation & Notes) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
            {/* Left Column: Exercise Search & Sets/Reps/Duration Parameters */}
            <div className="space-y-3 flex flex-col justify-between">
              {/* Autocomplete Exercise Search Input & Quick Staples */}
              <div className="space-y-1.5 relative">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider">
                    {t('fitness.searchServerLib')}
                  </label>
                  {selectedWorkoutType && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {selectedWorkoutType.source || t('fitness.verifiedLibrary')}
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
                    placeholder={t('fitness.searchExercisePlaceholder')}
                    value={wName}
                    onChange={(e) => {
                      setWName(e.target.value);
                      setSelectedWorkoutType(null);
                      setShowWSuggestions(true);
                    }}
                    onFocus={() => {
                      if (wSuggestions.length > 0) setShowWSuggestions(true);
                    }}
                    className="input-base input-with-icon-left input-with-icon-right text-xs py-2"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  />
                  {wName && (
                    <button
                      type="button"
                      onClick={() => {
                        setWName('');
                        setSelectedWorkoutType(null);
                        setShowWSuggestions(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {searchingSuggestions && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Logo size="xs" loading={true} />
                    </div>
                  )}
                </div>

                {/* Popular Staples Quick Chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar pt-0.5">
                  <span className="text-[10px] font-bold text-secondary uppercase shrink-0 mr-1 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-accent" /> {t('calories.staples')}
                  </span>
                  {POPULAR_WORKOUT_STAPLES.map((staple) => {
                    const isCurrent = selectedWorkoutType?.name === staple.name || wName === staple.name;
                    return (
                      <button
                        type="button"
                        key={staple.name}
                        onClick={() => handleSelectWorkoutType(staple)}
                        className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${isCurrent
                          ? 'bg-accent/15 border-accent text-accent shadow-xs font-bold'
                          : 'bg-subtle/70 hover:bg-subtle border-theme text-secondary hover:text-primary'
                          }`}
                      >
                        <span>{staple.icon}</span>
                        <span>{staple.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Suggestions Dropdown */}
                {showWSuggestions && wSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-theme rounded-2xl card-shadow z-40 max-h-52 overflow-y-auto divide-y divide-theme/40 shadow-2xl">
                    {wSuggestions.map((wt, idx) => (
                      <div
                        key={wt._id || idx}
                        onClick={() => handleSelectWorkoutType(wt)}
                        className="p-2.5 hover:bg-subtle cursor-pointer flex items-center justify-between text-xs transition-colors group"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-primary group-hover:text-accent transition-colors">
                              {wt.name}
                            </span>
                            {wt.equipment && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-subtle text-secondary border border-theme">
                                {wt.equipment}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-secondary font-medium">
                            {wt.trackingType === 'duration'
                              ? `⏱️ ${wt.defaultDuration || 30} ${t('common.minutes')}`
                              : `🏋️ ${wt.defaultSets || 3}s × ${wt.defaultReps || 10}r ${wt.defaultWeight ? `@ ${wt.defaultWeight}kg` : ''}`}
                            {wt.met ? ` · MET: ${wt.met}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={TARGET_COLORS[wt.target] || 'neutral'} size="xs">
                            {wt.target || 'Exercise'}
                          </Badge>
                          {wt.source && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface border border-theme text-secondary font-medium">
                              {wt.source}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {wName.trim().length >= 2 && (
                      <div
                        onClick={() => {
                          setSelectedWorkoutType({ name: wName.trim(), isCustom: true });
                          setShowWSuggestions(false);
                        }}
                        className="p-2 bg-accent/5 hover:bg-accent/10 cursor-pointer flex items-center justify-between text-xs text-accent font-bold transition-colors"
                      >
                        <span className="flex items-center gap-1.5 text-xs">
                          <Sparkles className="w-3.5 h-3.5" />
                          {t('fitness.setCustomExercise')} "{wName}"
                        </span>
                        <Badge variant="primary" size="xs">{t('fitness.customBadge')}</Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Exercise Numeric Parameters (Sets & Reps vs Duration) */}
              {wTrackingType === 'sets_reps' ? (
                <div className="p-3 bg-subtle/40 rounded-2xl border border-theme space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-accent" /> {t('fitness.setsAndReps')}
                    </span>
                    {(!wSets || !wReps) && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                        <Info className="w-3 h-3" /> {t('fitness.missingSetsOrReps')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Sets */}
                    <div className="p-2 rounded-xl bg-surface shadow-xs">
                      <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                        {t('fitness.sets')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={wSets}
                        onChange={(e) => setWSets(e.target.value)}
                        placeholder="e.g. 3"
                        className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                      />
                      <div className="flex items-center gap-1 mt-1.5">
                        {[3, 4, 5].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setWSets(s)}
                            className={`flex-1 py-0.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${Number(wSets) === s
                              ? 'bg-accent text-white border-accent'
                              : 'bg-subtle text-secondary hover:text-primary border-theme'
                              }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reps */}
                    <div className="p-2 rounded-xl bg-surface shadow-xs">
                      <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                        {t('fitness.reps')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={wReps}
                        onChange={(e) => setWReps(e.target.value)}
                        placeholder="e.g. 10"
                        className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                      />
                      <div className="flex items-center gap-0.5 mt-1.5">
                        {[8, 10, 12, 15].map((r) => (
                          <button
                            type="button"
                            key={r}
                            onClick={() => setWReps(r)}
                            className={`flex-1 py-0.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${Number(wReps) === r
                              ? 'bg-accent text-white border-accent'
                              : 'bg-subtle text-secondary hover:text-primary border-theme'
                              }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Weight */}
                    <div className="p-2 rounded-xl bg-surface shadow-xs">
                      <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1 truncate">
                        {t('fitness.weight')} ({unitSystem === 'metric' ? 'kg' : 'lbs'})
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="e.g. 20"
                        value={wWeight}
                        onChange={(e) => setWWeight(e.target.value)}
                        className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                      />
                      <div className="flex items-center gap-0.5 mt-1.5">
                        {[0, 20, 40, 60, 80].map((wtVal) => (
                          <button
                            type="button"
                            key={wtVal}
                            onClick={() => setWWeight(wtVal)}
                            className={`flex-1 py-0.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${String(wWeight) === String(wtVal)
                              ? 'bg-accent text-white border-accent'
                              : 'bg-subtle text-secondary hover:text-primary border-theme'
                              }`}
                          >
                            {wtVal === 0 ? 'BW' : wtVal}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-subtle/40 rounded-2xl border border-theme space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-rose-500" /> {t('fitness.timeAndDuration')}
                    </span>
                    {!wDuration && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                        <Info className="w-3 h-3" /> {t('fitness.missingDuration')}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface border border-theme shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">
                        {t('fitness.durationMinutes')}
                      </label>
                      <span className="text-[9px] text-secondary font-semibold">{t('common.minutes')}</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      required
                      value={wDuration}
                      onChange={(e) => setWDuration(e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-rose-500"
                    />

                    <div className="flex items-center gap-1.5 mt-2">
                      {[15, 20, 30, 45, 60].map((d) => (
                        <button
                          type="button"
                          key={d}
                          onClick={() => setWDuration(d)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded border transition-all cursor-pointer ${Number(wDuration) === d
                            ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                            : 'bg-subtle text-secondary hover:text-primary border-theme'
                            }`}
                        >
                          {d}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Live Calorie Estimation & Notes */}
            <div className="space-y-3 flex flex-col justify-between">
              {/* Live Calorie Burn Estimation HUD */}
              <div className="p-3.5 bg-gradient-to-br from-surface to-subtle rounded-2xl border border-theme shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-500" />
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                      {t('fitness.liveCalorieEstimation')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold border border-rose-500/20">
                      {wTrackingType === 'sets_reps'
                        ? `${wSets || 0}s × ${wReps || 0}r ${wWeight ? `@ ${wWeight}kg` : ''}`
                        : `${wDuration || 0} ${t('common.minutes')}`}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                      ~{estimatedCalories}
                    </span>
                    <span className="text-xs font-bold text-secondary">{t('common.calories')}</span>
                  </div>
                </div>

                <p className="text-[11px] text-secondary">
                  Formula based on MET {wMet || 6.0} and your weight ({latestUserWeight} kg).
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-secondary mb-1">
                    {t('fitness.customCalorieOverride')}
                  </label>
                  <input
                    type="number"
                    placeholder={`Auto: ${estimatedCalories} kcal`}
                    value={wCalories}
                    onChange={(e) => setWCalories(e.target.value)}
                    className="input-base text-xs py-1.5"
                  />
                </div>
              </div>

              {/* Notes Input */}
              <div className="p-3 bg-subtle/40 rounded-2xl border border-theme space-y-1">
                <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider">
                  {t('common.notes')} ({t('common.optional')})
                </label>
                <input
                  type="text"
                  placeholder={t('fitness.notesPlaceholder')}
                  value={wNotes}
                  onChange={(e) => setWNotes(e.target.value)}
                  className="input-base text-xs py-2"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsWorkoutModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={savingWorkout}>
              {editingWorkoutId ? t('fitness.updateWorkout') : t('fitness.saveExercise')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Body Metric Modal */}
      <Modal
        isOpen={isMetricModalOpen}
        onClose={() => setIsMetricModalOpen(false)}
        title={
          editingMetricId
            ? t('fitness.editMeasurements', 'Edit Body Measurements')
            : t('fitness.logMeasurements', 'Log Body Measurements')
        }
        subtitle={
          editingMetricId
            ? t('fitness.updateDimensionsDescription', 'Update your recorded body metrics and composition details')
            : t('fitness.logMeasurementsSubtitle', 'Track weight, height, body fat %, and physical dimensions with live multi-metric progress charts')
        }
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleMetricSubmit} className="space-y-3.5">
          {/* Top Bar: Unit Switcher & Date */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 bg-subtle/40 rounded-2xl border border-theme">
            {/* Unit Switcher */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider shrink-0">
                {t('fitness.system', 'System')}:
              </span>
              <div className=" flex bg-surface/80 p-0.5 rounded-xl border border-theme shadow-xs">
                <button
                  type="button"
                  onClick={() => handleToggleModalUnit('metric')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${unitSystem === 'metric'
                    ? 'bg-accent text-accent-contrast card-shadow'
                    : 'text-secondary hover:text-primary'
                    }`}
                >
                  <span>⚖️</span> {t('fitness.metricUnit', 'Metric (kg, cm)')}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleModalUnit('imperial')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${unitSystem === 'imperial'
                    ? 'bg-accent text-accent-contrast card-shadow'
                    : 'text-secondary hover:text-primary'
                    }`}
                >
                  <span>📏</span> {t('fitness.imperialUnit', 'Imperial (lbs, in)')}
                </button>
              </div>
            </div>

            {/* Date Input */}
            <div className="w-full sm:w-56 shrink-0">
              <DateInput
                value={mDate}
                onChange={setMDate}
                required
              />
            </div>
          </div>

          {/* Main 2-Column Grid: Left (Core Vitals + Live BMI HUD + Notes) | Right (Circumferences Matrix) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
            {/* Left Column (5 Cols): Core Vitals & Notes */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-3">
              {/* Core Body Vitals Card */}
              <div className="p-3 bg-subtle/30 rounded-2xl border border-theme space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-1.5 border-b border-theme/60">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-accent" /> {t('fitness.coreBodyVitals', 'Core Body Vitals')}
                  </span>
                  <span className="text-[10px] text-accent font-bold px-1.5 py-0.5 rounded-md bg-accent/10">
                    {t('fitness.primaryEssential', 'Primary')}
                  </span>
                </div>

                {/* Weight Input (Prominent) */}
                <div className="p-2 rounded-xl bg-surface border-theme shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">
                      {t('fitness.weight', 'Weight')} ({unitSystem === 'metric' ? 'kg' : 'lbs'}) *
                    </label>
                    <span className="text-[9px] text-accent font-bold">{t('fitness.primary', 'Primary')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      placeholder={unitSystem === 'metric' ? 'e.g. 74.5' : 'e.g. 164.2'}
                      value={mWeight}
                      onChange={(e) => setMWeight(e.target.value)}
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-2.5 py-1.5 text-sm font-bold text-primary focus:outline-none focus:border-accent"
                      required
                    />
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setMWeight((prev) => (prev ? (Number(prev) + 0.5).toFixed(1) : (unitSystem === 'metric' ? '70.5' : '155.5')))}
                        className="px-2 py-1 text-[10px] font-bold rounded-lg bg-subtle hover:bg-surface border border-theme text-secondary hover:text-primary transition-colors cursor-pointer"
                        title="Add 0.5"
                      >
                        + 0.5
                      </button>
                      <button
                        type="button"
                        onClick={() => setMWeight((prev) => (prev && Number(prev) > 0.5 ? (Number(prev) - 0.5).toFixed(1) : (unitSystem === 'metric' ? '69.5' : '154.5')))}
                        className="px-2 py-1 text-[10px] font-bold rounded-lg bg-subtle hover:bg-surface border border-theme text-secondary hover:text-primary transition-colors cursor-pointer"
                        title="Subtract 0.5"
                      >
                        - 0.5
                      </button>
                    </div>
                  </div>
                </div>

                {/* Height & Body Fat % Row */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Height */}
                  <div className="p-2 rounded-xl bg-surface border-theme shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">
                        {t('fitness.height', 'Height')} ({unitSystem === 'metric' ? 'cm' : 'in'})
                      </label>
                    </div>
                    <input
                      type="number"
                      step="0.5"
                      placeholder={unitSystem === 'metric' ? 'e.g. 178' : 'e.g. 70'}
                      value={mHeight}
                      onChange={(e) => setMHeight(e.target.value)}
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  {/* Body Fat % */}
                  <div className="p-2 rounded-xl bg-surface border-theme shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">
                        {t('fitness.bodyFat', 'Body Fat %')}
                      </label>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="3"
                      max="60"
                      placeholder="e.g. 15.5"
                      value={mBodyFat}
                      onChange={(e) => setMBodyFat(e.target.value)}
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {/* Live BMI & Health Indicator */}
                <div className="p-2 rounded-xl bg-surface border-theme/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="text-[10px] font-bold text-secondary">
                      {liveBmi ? 'Computed BMI:' : 'Composition:'}
                    </span>
                  </div>
                  {liveBmi ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-primary">{liveBmi.bmi}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-1.5 rounded-md border ${liveBmi.badgeClass}`}>
                        {liveBmi.label}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-tertiary">
                      Enter height & weight
                    </span>
                  )}
                </div>
              </div>

              {/* Notes Input */}
              <div className="p-2.5 bg-subtle/30border-theme">
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  {t('common.notes', 'Notes')} ({t('common.optional', 'Optional')})
                </label>
                <input
                  type="text"
                  placeholder={t('fitness.measurementNotesPlaceholder', 'e.g. Morning weigh-in after fasting, post-workout pump')}
                  value={mNotes}
                  onChange={(e) => setMNotes(e.target.value)}
                  className="w-full bg-surface border border-theme rounded-xl px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Right Column (7 Cols): Circumferences Matrix */}
            <div className="md:col-span-7 p-3 bg-subtle/30 rounded-2xl border border-theme flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-theme/60">
                <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" /> {t('fitness.bodyDimensions', 'Body Dimensions')}
                </span>
                <span className="text-[10px] text-secondary font-semibold">
                  Unit: {unitSystem === 'metric' ? 'cm' : 'inches'} (Optional)
                </span>
              </div>

              {/* Upper Body Circumferences */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                    {t('fitness.upperBody', 'Upper Body')}
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {/* Chest */}
                  <div className="col-span-2 p-1.5 rounded-xl bg-surface border-theme shadow-xs">
                    <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-0.5">
                      {t('fitness.chest', 'Chest')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={unitSystem === 'metric' ? 'e.g. 98' : 'e.g. 38.5'}
                      value={mChest}
                      onChange={(e) => setMChest(e.target.value)}
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  {/* Waist */}
                  <div className="col-span-2 p-1.5 rounded-xl bg-surface border-theme shadow-xs">
                    <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-0.5">
                      {t('fitness.waist', 'Waist')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={unitSystem === 'metric' ? 'e.g. 82' : 'e.g. 32.3'}
                      value={mWaist}
                      onChange={(e) => setMWaist(e.target.value)}
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  {/* Arms / Biceps */}
                  <div className="col-span-2 p-1.5 rounded-xl bg-surface border-theme shadow-xs">
                    <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-0.5">
                      {t('fitness.arms', 'Arms')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={unitSystem === 'metric' ? 'e.g. 36' : 'e.g. 14.2'}
                      value={mArm}
                      onChange={(e) => setMArm(e.target.value)}
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  {/* Shoulders */}
                  <div className="col-span-3 p-1.5 rounded-xl bg-surface border-theme shadow-xs">
                    <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-0.5">
                      {t('fitness.shoulders', 'Shoulders')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={unitSystem === 'metric' ? 'e.g. 115' : 'e.g. 45.2'}
                      value={mShoulders}
                      onChange={(e) => setMShoulders(e.target.value)}
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  {/* Neck */}
                  <div className="col-span-3 p-1.5 rounded-xl bg-surface border-theme shadow-xs">
                    <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-0.5">
                      {t('fitness.neck', 'Neck')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={unitSystem === 'metric' ? 'e.g. 38' : 'e.g. 15.0'}
                      value={mNeck}
                      onChange={(e) => setMNeck(e.target.value)}
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Lower Body Circumferences */}
              <div className="space-y-1.5 pt-1 border-t border-theme/40">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                    {t('fitness.lowerBody', 'Lower Body')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {/* Hips */}
                  <div className="p-1.5 rounded-xl bg-surface border-theme shadow-xs">
                    <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-0.5">
                      {t('fitness.hips', 'Hips')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={unitSystem === 'metric' ? 'e.g. 96' : 'e.g. 37.8'}
                      value={mHips}
                      onChange={(e) => setMHips(e.target.value)}
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  {/* Thighs */}
                  <div className="p-1.5 rounded-xl bg-surface border-theme shadow-xs">
                    <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-0.5">
                      {t('fitness.thighs', 'Thighs')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={unitSystem === 'metric' ? 'e.g. 56' : 'e.g. 22.0'}
                      value={mThighs}
                      onChange={(e) => setMThighs(e.target.value)}
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  {/* Calves */}
                  <div className="p-1.5 rounded-xl bg-surface border-theme shadow-xs">
                    <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-0.5">
                      {t('fitness.calves', 'Calves')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={unitSystem === 'metric' ? 'e.g. 37' : 'e.g. 14.5'}
                      value={mCalves}
                      onChange={(e) => setMCalves(e.target.value)}
                      className="w-full bg-subtle/60 border border-theme rounded-lg px-2 py-1.5 text-xs font-bold text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2.5 pt-2.5 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsMetricModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={savingMetric}>
              {editingMetricId ? t('fitness.updateMeasurements', 'Update Measurements') : t('fitness.saveMeasurements', 'Save Measurements')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal for Workout */}
      <Modal
        isOpen={!!deleteWorkoutId}
        onClose={() => setDeleteWorkoutId(null)}
        title={t('common.confirmDeleteTitle')}
        subtitle={t('common.confirmDeleteDesc')}
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            {t('fitness.deleteWorkoutDesc')}
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteWorkoutId(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDeleteWorkout}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal for Body Metric */}
      <Modal
        isOpen={!!deleteMetricId}
        onClose={() => setDeleteMetricId(null)}
        title={t('common.confirmDeleteTitle')}
        subtitle={t('common.confirmDeleteDesc')}
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            {t('fitness.deleteMeasurementDesc')}
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteMetricId(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDeleteMetric}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FitnessTracker;
