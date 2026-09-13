import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  Compass,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Edit2,
  Trash2,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import api from '../utils/api';
import { DateInput } from '../components/DateInput';

const ALL_PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'];

export const QadaMatrix = () => {
  const [qadaData, setQadaData] = useState([]);
  const [vows, setVows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Batch edit modal
  const [editPrayer, setEditPrayer] = useState(null);
  const [totalOwedInput, setTotalOwedInput] = useState(0);
  const [totalCompletedInput, setTotalCompletedInput] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);

  // New/Edit Vow modal
  const [isVowModalOpen, setIsVowModalOpen] = useState(false);
  const [editingVowId, setEditingVowId] = useState(null);
  const [vowDescription, setVowDescription] = useState('');
  const [vowTargetDate, setVowTargetDate] = useState('');
  const [vowRelatedSalah, setVowRelatedSalah] = useState('All');
  const [vowNotes, setVowNotes] = useState('');
  const [savingVow, setSavingVow] = useState(false);

  const fetchQadaData = useCallback(async () => {
    try {
      const [qadaRes, vowsRes] = await Promise.all([
        api.get('/islamic/qada'),
        api.get('/islamic/vows'),
      ]);
      setQadaData(qadaRes.data || []);
      setVows(vowsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch Qada data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQadaData();
  }, [fetchQadaData]);

  const handleStep = async (prayerName, increment) => {
    // Optimistic UI update
    setQadaData((prev) =>
      prev.map((item) => {
        if (item.prayerName === prayerName) {
          const nextCompleted = Math.max(0, (item.totalCompleted || 0) + increment);
          return { ...item, totalCompleted: nextCompleted };
        }
        return item;
      })
    );

    try {
      await api.post('/islamic/qada', {
        prayerName,
        incrementCompleted: increment,
      });
    } catch (err) {
      console.error('Failed to update Qada step', err);
      fetchQadaData(); // Revert on failure
    }
  };

  const handleOpenEdit = (record) => {
    setEditPrayer(record.prayerName);
    setTotalOwedInput(record.totalOwed || 0);
    setTotalCompletedInput(record.totalCompleted || 0);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await api.post('/islamic/qada', {
        prayerName: editPrayer,
        totalOwed: Number(totalOwedInput),
        setCompleted: Number(totalCompletedInput),
      });
      setEditPrayer(null);
      fetchQadaData();
    } catch (err) {
      console.error('Failed to save Qada baseline', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditVow = (vow) => {
    setEditingVowId(vow._id);
    setVowDescription(vow.title || vow.description || '');
    setVowTargetDate(vow.targetDate || '');
    setVowRelatedSalah(vow.relatedSalah || 'All');
    setVowNotes(vow.notes || '');
    setIsVowModalOpen(true);
  };

  const handleSaveVow = async (e) => {
    e.preventDefault();
    if (!vowDescription.trim()) return;
    setSavingVow(true);
    try {
      const payload = {
        title: vowDescription.trim(),
        description: vowDescription.trim(),
        targetDate: vowTargetDate,
        relatedSalah: vowRelatedSalah,
        notes: vowNotes,
      };

      if (editingVowId) {
        const res = await api.put(`/islamic/vows/${editingVowId}`, payload);
        if (res.data) {
          setVows((prev) => prev.map((v) => (v._id === editingVowId ? res.data : v)));
        }
      } else {
        const res = await api.post('/islamic/vows', payload);
        if (res.data) {
          setVows((prev) => [res.data, ...prev]);
        }
      }
      setVowDescription('');
      setVowTargetDate('');
      setVowNotes('');
      setEditingVowId(null);
      setIsVowModalOpen(false);
      fetchQadaData();
    } catch (err) {
      console.error('Failed to save spiritual vow', err);
    } finally {
      setSavingVow(false);
    }
  };

  const handleToggleVow = async (vowId, currentStatus) => {
    const isCompleted = currentStatus === 'Active';
    // Optimistic update
    setVows((prev) =>
      prev.map((v) => (v._id === vowId ? { ...v, status: isCompleted ? 'Completed' : 'Active' } : v))
    );
    try {
      await api.put(`/islamic/vows/${vowId}`, { isCompleted });
    } catch (err) {
      console.error('Failed to toggle vow', err);
      fetchQadaData();
    }
  };

  const handleDeleteVow = async (vowId) => {
    setVows((prev) => prev.filter((v) => v._id !== vowId));
    try {
      await api.delete(`/islamic/vows/${vowId}`);
    } catch (err) {
      console.error('Failed to delete vow', err);
      fetchQadaData();
    }
  };

  // Aggregated stats
  const totalOwedAll = qadaData.reduce((sum, item) => sum + (item.totalOwed || 0), 0);
  const totalCompletedAll = qadaData.reduce((sum, item) => sum + (item.totalCompleted || 0), 0);
  const totalRemainingAll = Math.max(0, totalOwedAll - totalCompletedAll);
  const overallProgressPercent = totalOwedAll > 0 ? Math.round((totalCompletedAll / totalOwedAll) * 100) : 100;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-secondary">Loading Qada Matrix...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Spiritual Accountability"
        title="Qada Salah Matrix & Niyyah Tracker"
        description="Comprehensive debt tracker for missed prayers (including Witr) and spiritual promises"
        action={
            <Button
              variant="gradient"
              size="md"
              icon={Plus}
              onClick={() => {
                setEditingVowId(null);
                setVowDescription('');
                setVowTargetDate('');
                setVowRelatedSalah('All');
                setVowNotes('');
                setIsVowModalOpen(true);
              }}
            >
              New Spiritual Vow
            </Button>
        }
      />

      {/* Top Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Qada Owed"
          value={totalOwedAll}
          subtitle="Lifetime missed prayers logged"
          icon={AlertCircle}
          color="rose"
        />
        <StatCard
          title="Prayers Made Up"
          value={totalCompletedAll}
          subtitle="Completed Qada prayers"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Remaining Debt"
          value={totalRemainingAll}
          subtitle="Remaining to fulfill"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Fulfillment Progress"
          value={`${overallProgressPercent}%`}
          subtitle="Overall make-up trajectory"
          icon={Compass}
          color="indigo"
        />
      </div>

      {/* Main Matrix Table Card */}
      <Card
        hover
        title="Interactive Qada Salah Matrix"
        subtitle="Track and make up each individual prayer step-by-step"
        icon={Compass}
        badge={<Badge variant="success" size="xs">Live Matrix</Badge>}
      >
        <div className="overflow-x-auto touch-scroll-x mt-3">
          <table className="w-full min-w-[650px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-theme text-secondary uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3 px-4">Prayer</th>
                <th className="py-3 px-4 text-center">Total Owed</th>
                <th className="py-3 px-4 text-center">Completed</th>
                <th className="py-3 px-4 text-center">Remaining</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4 text-center">Quick Make-Up (+/-)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {ALL_PRAYERS.map((prayer) => {
                const record = qadaData.find((q) => q.prayerName === prayer) || {
                  prayerName: prayer,
                  totalOwed: 0,
                  totalCompleted: 0,
                };
                const remaining = Math.max(0, record.totalOwed - record.totalCompleted);
                const percent =
                  record.totalOwed > 0
                    ? Math.min(100, Math.round((record.totalCompleted / record.totalOwed) * 100))
                    : 100;

                return (
                  <tr key={prayer} className="hover:bg-subtle/50 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-primary flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      {prayer}
                      {prayer === 'Witr' && (
                        <Badge variant="purple" size="xs">Wajib</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-secondary">
                      {record.totalOwed}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {record.totalCompleted}
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-[var(--color-danger)]">
                      {remaining}
                    </td>
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-subtle rounded-full overflow-hidden border border-theme">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-secondary w-8 text-right">
                          {percent}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStep(prayer, -1)}
                          disabled={record.totalCompleted <= 0}
                          className="p-1.5 rounded-lg bg-subtle text-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-30 cursor-pointer"
                          title="Decrease completed count"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStep(prayer, 1)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all text-xs font-black flex items-center gap-1 cursor-pointer"
                          title="Make up 1 prayer"
                        >
                          <Plus className="w-3.5 h-3.5" /> +1 Make-up
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(record)}
                        className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-subtle transition-colors cursor-pointer"
                        title="Edit Baseline Owed / Completed"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Spiritual Vows & Niyyah Tracker */}
      <Card
        hover
        title="Spiritual Vows & Niyyah Commitments (Nazr)"
        subtitle="Manage spiritual promises and solemn resolutions"
        icon={ShieldCheck}
        badge={<Badge variant="purple" size="xs">Vows</Badge>}
        action={
          <Button variant="ghost" size="xs" onClick={() => setIsVowModalOpen(true)}>
            + Add Vow
          </Button>
        }
      >
        {vows.length === 0 ? (
          <div className="py-8 text-center text-xs text-secondary italic bg-subtle/50 rounded-xl border border-dashed border-theme mt-2">
            No active spiritual vows recorded.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {vows.map((vow) => {
              const isDone = vow.status === 'Completed';
              return (
                <div
                  key={vow._id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    isDone
                      ? 'bg-subtle/40 border-theme opacity-75'
                      : 'bg-surface border-theme card-shadow'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleVow(vow._id, vow.status)}
                      className={`mt-0.5 p-1 rounded-lg border transition-colors cursor-pointer ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-theme text-transparent hover:border-emerald-500'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          isDone ? 'line-through text-secondary' : 'text-primary'
                        }`}
                      >
                        {vow.title}
                      </p>
                      {vow.targetDate && (
                        <p className="text-[11px] text-secondary flex items-center gap-1 mt-1 font-medium">
                          <Calendar className="w-3 h-3 text-accent" /> Target: {vow.targetDate}
                        </p>
                      )}
                      {vow.notes && (
                        <p className="text-xs text-secondary italic mt-1.5">
                          "{vow.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEditVow(vow)}
                      className="p-1.5 text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors cursor-pointer"
                      title="Edit vow"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVow(vow._id)}
                      className="p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete vow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Edit Baseline Modal */}
      {editPrayer && (
        <Modal
          isOpen={true}
          onClose={() => setEditPrayer(null)}
          title={`Edit ${editPrayer} Qada Baseline`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Total Owed (Lifetime Missed)
              </label>
              <input
                type="number"
                min="0"
                value={totalOwedInput}
                onChange={(e) => setTotalOwedInput(e.target.value)}
                className="input-base"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Total Already Completed (Made-up)
              </label>
              <input
                type="number"
                min="0"
                value={totalCompletedInput}
                onChange={(e) => setTotalCompletedInput(e.target.value)}
                className="input-base"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-theme">
              <Button variant="ghost" size="md" type="button" onClick={() => setEditPrayer(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" loading={savingEdit}>
                Save Baseline
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* New / Edit Vow Modal */}
      <Modal
        isOpen={isVowModalOpen}
        onClose={() => {
          setIsVowModalOpen(false);
          setEditingVowId(null);
        }}
        title={editingVowId ? 'Edit Spiritual Vow (Nazr / Niyyah)' : 'Record New Spiritual Vow (Nazr / Niyyah)'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveVow} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">
              Vow Description / Resolution *
            </label>
            <input
              type="text"
              value={vowDescription}
              onChange={(e) => setVowDescription(e.target.value)}
              placeholder="e.g. Pray 2 Rakat Nafl every night, complete 100 Qada Fajr"
              className="input-base"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DateInput
              label="Target Date"
              value={vowTargetDate}
              onChange={setVowTargetDate}
            />
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                Related Salah
              </label>
              <select
                value={vowRelatedSalah}
                onChange={(e) => setVowRelatedSalah(e.target.value)}
                className="select-base"
              >
                <option value="All">All Prayers</option>
                {ALL_PRAYERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">
              Personal Notes / Intention
            </label>
            <textarea
              value={vowNotes}
              onChange={(e) => setVowNotes(e.target.value)}
              placeholder="Specific conditions or spiritual motivation..."
              className="textarea-base min-h-[60px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-theme">
            <Button
              variant="ghost"
              size="md"
              type="button"
              onClick={() => {
                setIsVowModalOpen(false);
                setEditingVowId(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="gradient" size="md" type="submit" loading={savingVow}>
              {editingVowId ? 'Update Vow' : 'Record Vow'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QadaMatrix;
