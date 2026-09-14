import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { DateInput } from '../components/DateInput';
import api from '../utils/api';
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

const TARGET_COLORS = {
  Muscle: 'indigo',
  Cardio: 'rose',
  Flexibility: 'purple',
  Sports: 'emerald',
};

export const FitnessTracker = ({ selectedDate }) => {
  const currentDate = selectedDate || getFormattedDate();

  const [workouts, setWorkouts] = useState([]);
  const [bodyMetrics, setBodyMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const [wSuggestions, setWSuggestions] = useState([]);
  const [showWSuggestions, setShowWSuggestions] = useState(false);
  const [searchingSuggestions, setSearchingSuggestions] = useState(false);

  // Metric Form State
  const [mDate, setMDate] = useState(currentDate);
  const [mWeight, setMWeight] = useState('');
  const [mWaist, setMWaist] = useState('');
  const [mChest, setMChest] = useState('');
  const [mArm, setMArm] = useState('');
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
      const met = Number(wMet) || (wTarget === 'Cardio' ? 8.0 : 6.0);
      const hours = (Number(wDuration) || 0) / 60;
      return Math.round(met * weightKg * hours);
    } else {
      // Strength sets & reps
      const sets = Number(wSets) || 0;
      const reps = Number(wReps) || 0;
      const liftWeight = Number(wWeight) || 0;
      const weightBonus = liftWeight > 0 ? (liftWeight / 100) * 2 : 0;
      const calPerRep = 0.35 + (weightBonus / Math.max(1, sets * reps));
      const base = sets * reps * calPerRep;
      const bodyFactor = weightKg / 70;
      return Math.max(5, Math.round(base * bodyFactor));
    }
  }, [wTrackingType, wDuration, wMet, wTarget, wSets, wReps, wWeight, latestUserWeight]);

  // Autocomplete Workout Types Search
  useEffect(() => {
    if (!wName.trim() || wName.length < 2) {
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
  }, [wName]);

  const handleSelectWorkoutType = (wt) => {
    setWName(wt.name);
    setWTarget(wt.target || 'Muscle');
    setWTrackingType(wt.trackingType || 'sets_reps');
    if (wt.met) setWMet(wt.met);
    if (wt.defaultSets) setWSets(wt.defaultSets);
    if (wt.defaultReps) setWReps(wt.defaultReps);
    if (wt.defaultWeight) setWWeight(wt.defaultWeight);
    if (wt.caloriesPerSet) setWIdealCalPerSet(wt.caloriesPerSet);
    if (wt.defaultCaloriesPerMinute) setWIdealCalPerMin(wt.defaultCaloriesPerMinute);

    setShowWSuggestions(false);
  };

  const openCreateWorkoutModal = () => {
    setEditingWorkoutId(null);
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
    setWDate(w.date || currentDate);
    setWName(w.name || '');
    setWTrackingType(w.trackingType || 'sets_reps');
    setWSets(w.sets !== undefined ? w.sets : '');
    setWReps(w.reps !== undefined ? w.reps : '');
    setWWeight(w.weight !== undefined && w.weight !== 0 ? w.weight : '');
    setWDuration(w.durationMinutes !== undefined ? w.durationMinutes : '');
    setWCalories(w.caloriesBurned !== undefined ? w.caloriesBurned : '');
    setWTarget(w.target || 'Muscle');
    setWNotes(w.notes || '');
    setIsWorkoutModalOpen(true);
  };

  const openCreateMetricModal = () => {
    setEditingMetricId(null);
    setMDate(currentDate);
    setMWeight('');
    setMWaist('');
    setMChest('');
    setMArm('');
    setMNotes('');
    setIsMetricModalOpen(true);
  };

  const handleEditMetric = (metric) => {
    setEditingMetricId(metric._id);
    setMDate(metric.date || currentDate);
    setMWeight(metric.weightKg !== undefined && metric.weightKg !== null ? metric.weightKg : '');
    setMWaist(metric.waistCm !== undefined && metric.waistCm !== null ? metric.waistCm : '');
    setMChest(metric.chestCm !== undefined && metric.chestCm !== null ? metric.chestCm : '');
    setMArm(metric.armCm !== undefined && metric.armCm !== null ? metric.armCm : '');
    setMNotes(metric.notes || '');
    setIsMetricModalOpen(true);
  };

  const handleWorkoutSubmit = async (e) => {
    e.preventDefault();
    if (!wName.trim()) return;

    const finalCalories = wCalories ? Number(wCalories) : estimatedCalories;

    setSavingWorkout(true);
    try {
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

      if (editingWorkoutId) {
        const res = await api.put(`/workouts/${editingWorkoutId}`, payload);
        setIsWorkoutModalOpen(false);
        setEditingWorkoutId(null);
        if (res.data) {
          setWorkouts((prev) =>
            prev.map((w) => (w._id === editingWorkoutId ? res.data : w))
          );
        }
      } else {
        const res = await api.post('/workouts', payload);
        setIsWorkoutModalOpen(false);
        if (res.data) setWorkouts((prev) => [res.data, ...prev]);
      }
      setWName('');
      setWNotes('');
      setWCalories('');
      fetchData(false);
    } catch (err) {
      console.error('Failed to log workout', err);
    } finally {
      setSavingWorkout(false);
    }
  };

  const handleMetricSubmit = async (e) => {
    e.preventDefault();
    if (!mWeight && !mWaist) return;

    setSavingMetric(true);
    try {
      const payload = {
        date: mDate,
        weightKg: mWeight ? Number(mWeight) : undefined,
        waistCm: mWaist ? Number(mWaist) : undefined,
        chestCm: mChest ? Number(mChest) : undefined,
        armCm: mArm ? Number(mArm) : undefined,
        notes: mNotes.trim(),
      };

      if (editingMetricId) {
        const res = await api.put(`/body-metrics/${editingMetricId}`, payload);
        setIsMetricModalOpen(false);
        setEditingMetricId(null);
        if (res.data) {
          setBodyMetrics((prev) =>
            prev.map((m) => (m._id === editingMetricId ? res.data : m))
          );
        }
      } else {
        const res = await api.post('/body-metrics', payload);
        setIsMetricModalOpen(false);
        if (res.data) setBodyMetrics((prev) => [...prev.filter((m) => m.date !== mDate), res.data]);
      }
      setMWeight('');
      setMWaist('');
      setMChest('');
      setMArm('');
      setMNotes('');
      fetchData(false);
    } catch (err) {
      console.error('Failed to log body metric', err);
    } finally {
      setSavingMetric(false);
    }
  };

  const handleDeleteWorkout = async () => {
    if (!deleteWorkoutId) return;
    const targetId = deleteWorkoutId;
    setDeleteWorkoutId(null);
    setWorkouts((prev) => prev.filter((w) => w._id !== targetId));

    try {
      await api.delete(`/workouts/${targetId}`);
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete workout', err);
      fetchData(false);
    }
  };

  const handleDeleteMetric = async () => {
    if (!deleteMetricId) return;
    const targetId = deleteMetricId;
    setDeleteMetricId(null);
    setBodyMetrics((prev) => prev.filter((m) => m._id !== targetId));

    try {
      await api.delete(`/body-metrics/${targetId}`);
      fetchData(false);
    } catch (err) {
      console.error('Failed to delete body metric', err);
      fetchData(false);
    }
  };

  const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const totalWorkoutMinutes = workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
  const latestWeight = bodyMetrics.slice().reverse().find((m) => m.weightKg)?.weightKg;

  const chartData = bodyMetrics.map((m) => ({
    date: m.date.slice(5),
    weight: m.weightKg,
    waist: m.waistCm,
  }));

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Health & Physicality"
        title="Fitness & Workouts"
        description={`Track strength, cardio, and energy expenditure with real MET-based calorie burn calculations for ${formatDisplayDate(currentDate)}`}
        action={
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              icon={Scale}
              onClick={openCreateMetricModal}
            >
              Measurements
            </Button>
            <Button
              variant="gradient"
              size="md"
              icon={Plus}
              onClick={openCreateWorkoutModal}
            >
              Log Workout
            </Button>
          </div>
        }
      />

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title="Active Energy Burned"
          value={`${totalCaloriesBurned} kcal`}
          subtitle={`${workouts.length} exercises logged`}
          icon={Flame}
          color="rose"
        />
        <StatCard
          title="Exercise Duration"
          value={`${Math.floor(totalWorkoutMinutes / 60)}h ${totalWorkoutMinutes % 60}m`}
          subtitle="Total training time"
          icon={Dumbbell}
          color="indigo"
        />
        <StatCard
          title="Current Weight"
          value={latestWeight ? `${latestWeight} kg` : `${latestUserWeight} kg (est)`}
          subtitle="Used for accurate calorie formula"
          icon={Scale}
          color="emerald"
        />
      </div>

      {/* Workouts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary tracking-tight">Today's Exercises & Workouts</h2>
          <span className="text-xs font-semibold text-secondary">{workouts.length} logged</span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : workouts.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No workouts recorded today"
            description="Log your workout session to calculate calories burned and track physical progress."
            actionText="Log Workout"
            onAction={openCreateWorkoutModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {workouts.map((w) => (
              <Card
                key={w._id}
                hover
                bottomAction={
                  <div className="flex items-center gap-0.5 bg-surface/90 dark:bg-surface/90 backdrop-blur-xs rounded-xl p-0.5 border border-theme/40 shadow-xs">
                    <button
                      onClick={() => handleEditWorkout(w)}
                      className="p-1 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                      title="Edit Workout"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteWorkoutId(w._id)}
                      className="p-1 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
          title="Weight & Waist Progress"
          subtitle="Sparse data line trend"
          icon={LineChartIcon}
          className="lg:col-span-2"
        >
          {chartData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-xs text-secondary italic bg-subtle/50 rounded-xl border border-dashed border-theme mt-2">
              <Scale className="w-8 h-8 text-muted mb-2 stroke-1" />
              No body metric records to plot.
            </div>
          ) : (
            <div className="h-60 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.15} />
                  <XAxis dataKey="date" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name="Weight (kg)"
                    stroke="var(--color-accent)"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="waist"
                    name="Waist (cm)"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card hover title="Measurement Log" subtitle="Recent metrics recorded" icon={Scale}>
          {bodyMetrics.length === 0 ? (
            <p className="text-xs text-secondary italic py-4">No measurements logged yet.</p>
          ) : (
            <div className="space-y-3 mt-2">
              {bodyMetrics
                .slice()
                .reverse()
                .slice(0, 6)
                .map((m, idx) => (
                  <div
                    key={m._id || idx}
                    className="p-3 rounded-xl bg-subtle border border-theme flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs font-bold text-primary block">{formatDisplayDate(m.date)}</span>
                      <span className="text-[11px] text-secondary">
                        {m.waistCm ? `Waist: ${m.waistCm}cm ` : ''}
                        {m.chestCm ? `Chest: ${m.chestCm}cm ` : ''}
                        {m.armCm ? `Arm: ${m.armCm}cm` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.weightKg && (
                        <span className="text-sm font-extrabold text-accent">{m.weightKg} kg</span>
                      )}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleEditMetric(m)}
                          className="p-1 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                          title="Edit Measurement"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteMetricId(m._id)}
                          className="p-1 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Measurement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
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
        title={editingWorkoutId ? 'Edit Workout' : 'Log Exercise / Workout'}
        subtitle={editingWorkoutId ? 'Update exercises, sets, reps, and energy burn' : 'Choose an exercise or search online to calculate calorie burns'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleWorkoutSubmit} className="space-y-4">
          <div className="flex bg-subtle p-1 rounded-xl border border-theme">
            <button
              type="button"
              onClick={() => setWTrackingType('sets_reps')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                wTrackingType === 'sets_reps'
                  ? 'bg-surface text-primary card-shadow'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Sets & Reps (Strength)
            </button>
            <button
              type="button"
              onClick={() => setWTrackingType('duration')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                wTrackingType === 'duration'
                  ? 'bg-surface text-primary card-shadow'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Time & Duration (Cardio/Sports)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateInput
              label="Workout Date"
              value={wDate}
              onChange={setWDate}
              required
            />

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Target Category
              </label>
              <select
                value={wTarget}
                onChange={(e) => setWTarget(e.target.value)}
                className="select-base"
              >
                {TARGET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Exercise Name (Search server suggestions)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Bench Press, Squats, Running, Jump Rope"
                value={wName}
                onChange={(e) => {
                  setWName(e.target.value);
                  setShowWSuggestions(true);
                }}
                onFocus={() => {
                  if (wSuggestions.length > 0) setShowWSuggestions(true);
                }}
                className="input-base pr-8"
              />
              {searchingSuggestions && (
                <div className="absolute right-2.5 top-2.5">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {showWSuggestions && wSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-theme rounded-2xl card-shadow z-30 max-h-56 overflow-y-auto divide-y divide-theme/40 shadow-xl">
                {wSuggestions.map((wt, idx) => (
                  <div
                    key={wt._id || idx}
                    onClick={() => handleSelectWorkoutType(wt)}
                    className="p-3 hover:bg-subtle cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <span className="font-bold text-primary block">{wt.name}</span>
                      <span className="text-[11px] text-secondary">
                        {wt.category || wt.target} {wt.met ? `• MET: ${wt.met}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={TARGET_COLORS[wt.target] || 'neutral'} size="xs">
                        {wt.target || 'Exercise'}
                      </Badge>
                      {wt.source && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-theme text-secondary">
                          {wt.source}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {wTrackingType === 'sets_reps' ? (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Sets
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={wSets}
                  onChange={(e) => setWSets(e.target.value)}
                  placeholder="e.g. 3"
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Reps / Set
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={wReps}
                  onChange={(e) => setWReps(e.target.value)}
                  placeholder="e.g. 10"
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 20"
                  value={wWeight}
                  onChange={(e) => setWWeight(e.target.value)}
                  className="input-base"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                required
                value={wDuration}
                onChange={(e) => setWDuration(e.target.value)}
                placeholder="e.g. 30"
                className="input-base"
              />
            </div>
          )}

          {/* Dynamic Calorie Burn Preview */}
          <div className="p-3.5 bg-subtle rounded-2xl border border-theme space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                Live Calorie Estimation
              </span>
              <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                ~{estimatedCalories} kcal calculated
              </span>
            </div>
            <p className="text-[11px] text-secondary">
              Formula based on MET {wMet || 6.0} and your weight ({latestUserWeight} kg).
            </p>

            <div>
              <label className="block text-[10px] font-bold text-secondary mb-1">
                Custom Calorie Override (Leave blank to use calculated ~{estimatedCalories} kcal)
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

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Good form, increased resistance"
              value={wNotes}
              onChange={(e) => setWNotes(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsWorkoutModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingWorkout}>
              {editingWorkoutId ? 'Update Workout' : 'Save Exercise'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Body Metric Modal */}
      <Modal
        isOpen={isMetricModalOpen}
        onClose={() => setIsMetricModalOpen(false)}
        title={editingMetricId ? 'Edit Body Measurements' : 'Log Weight & Measurements'}
        subtitle={editingMetricId ? 'Update logged physical metrics' : 'Track physical metrics and calculate accurate calorie burns'}
      >
        <form onSubmit={handleMetricSubmit} className="space-y-4">
          <DateInput
            label="Measurement Date"
            value={mDate}
            onChange={setMDate}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 74.5"
                value={mWeight}
                onChange={(e) => setMWeight(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Waist Circumference (cm)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 82"
                value={mWaist}
                onChange={(e) => setMWaist(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Chest (cm, optional)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 102"
                value={mChest}
                onChange={(e) => setMChest(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Arms (cm, optional)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 36"
                value={mArm}
                onChange={(e) => setMArm(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Fasted morning weigh-in"
              value={mNotes}
              onChange={(e) => setMNotes(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsMetricModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingMetric}>
              {editingMetricId ? 'Update Measurements' : 'Save Measurements'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal for Workout */}
      <Modal
        isOpen={!!deleteWorkoutId}
        onClose={() => setDeleteWorkoutId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this workout log? It will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteWorkoutId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteWorkout}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal for Body Metric */}
      <Modal
        isOpen={!!deleteMetricId}
        onClose={() => setDeleteMetricId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this body measurement entry?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteMetricId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteMetric}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FitnessTracker;
