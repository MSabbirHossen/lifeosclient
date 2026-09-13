import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import api from '../utils/api';
import { DateInput } from '../components/DateInput';
import { formatDisplayDate } from '../utils/dateHelpers';
import {
  FileText,
  Download,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const Reports = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Form State
  const [type, setType] = useState('weekly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatDidntGoWell, setWhatDidntGoWell] = useState('');
  const [howToImprove, setHowToImprove] = useState('');
  const [actionItems, setActionItems] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/reviews');
      setReviews(res.data || []);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleCreateReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reports/reviews', {
        type,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        whatWentWell: whatWentWell.trim(),
        whatDidntGoWell: whatDidntGoWell.trim(),
        howToImprove: howToImprove.trim(),
        actionItems: actionItems.trim(),
      });
      setIsModalOpen(false);
      setWhatWentWell('');
      setWhatDidntGoWell('');
      setHowToImprove('');
      setActionItems('');
      fetchReviews();
    } catch (err) {
      console.error('Failed to save review', err);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const res = await api.get('/backup/export');
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Failed to export data', err);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/reports/reviews/${deleteId}`);
      setDeleteId(null);
      fetchReviews();
    } catch (err) {
      console.error('Failed to delete review', err);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Synthesis & Retrospectives"
        title="Weekly & Monthly Reports"
        description="Conduct high-level retrospectives, extract insights, and export comprehensive JSON backups."
        action={
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              icon={Download}
              loading={exportLoading}
              onClick={handleExportData}
            >
              Export JSON Data
            </Button>
            <Button variant="gradient" size="md" icon={Plus} onClick={() => setIsModalOpen(true)}>
              New Retrospective
            </Button>
          </div>
        }
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title="Total Reviews"
          value={reviews.length}
          subtitle="Saved retrospectives"
          icon={FileText}
          color="indigo"
        />
        <StatCard
          title="Weekly Reviews"
          value={reviews.filter((r) => r.type === 'weekly').length}
          subtitle="7-day cycle checks"
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          title="Monthly Reviews"
          value={reviews.filter((r) => r.type === 'monthly').length}
          subtitle="30-day deep dives"
          icon={Layers}
          color="purple"
        />
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary tracking-tight">Retrospective Archive</h2>
          <span className="text-xs font-semibold text-secondary">{reviews.length} reviews</span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No retrospectives recorded yet"
            description="Perform a weekly or monthly review to synthesize progress and identify areas of improvement."
            actionText="Write Retrospective"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {reviews.map((rev) => (
              <Card
                key={rev._id}
                hover
                bottomAction={
                  <div className="flex items-center gap-0.5 bg-surface/90 dark:bg-surface/90 backdrop-blur-xs rounded-xl p-0.5 border border-theme/40 shadow-xs">
                    <button
                      onClick={() => setDeleteId(rev._id)}
                      className="p-1 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                }
              >
                <div className="space-y-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={rev.type === 'monthly' ? 'purple' : 'primary'} size="sm" dot>
                      {rev.type === 'monthly' ? 'Monthly Review' : 'Weekly Review'}
                    </Badge>
                    <span className="text-xs font-bold text-secondary">
                      {rev.startDate ? `${formatDisplayDate(rev.startDate)} — ` : ''}
                      {formatDisplayDate(rev.endDate || rev.createdAt)}
                    </span>
                  </div>

                  {/* Reflection Blocks */}
                  {rev.whatWentWell && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> What Went Well
                      </span>
                      <p className="text-xs text-primary font-medium leading-relaxed bg-subtle p-2.5 rounded-xl border border-theme">
                        {rev.whatWentWell}
                      </p>
                    </div>
                  )}

                  {rev.whatDidntGoWell && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-[var(--color-danger)] flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> What Didn't Go Well
                      </span>
                      <p className="text-xs text-primary font-medium leading-relaxed bg-subtle p-2.5 rounded-xl border border-theme">
                        {rev.whatDidntGoWell}
                      </p>
                    </div>
                  )}

                  {rev.howToImprove && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-accent flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> How to Improve Next Cycle
                      </span>
                      <p className="text-xs text-primary font-medium leading-relaxed bg-subtle p-2.5 rounded-xl border border-theme">
                        {rev.howToImprove}
                      </p>
                    </div>
                  )}

                  {rev.actionItems && (
                    <div className="pt-2 border-t border-subtle">
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">
                        Action Items
                      </span>
                      <p className="text-xs text-secondary font-medium">{rev.actionItems}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Retrospective Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Retrospective Review"
        subtitle="Reflect and extract continuous improvements"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateReview} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Review Cycle
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="select-base"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <DateInput
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
            />

            <DateInput
              label="End Date"
              value={endDate}
              onChange={setEndDate}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5">
              1. What Went Well?
            </label>
            <textarea
              rows={2}
              required
              placeholder="Key achievements, completed habits, good routines..."
              value={whatWentWell}
              onChange={(e) => setWhatWentWell(e.target.value)}
              className="textarea-base"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-danger)] uppercase tracking-wider mb-1.5">
              2. What Didn't Go Well?
            </label>
            <textarea
              rows={2}
              required
              placeholder="Obstacles, missed goals, distractions..."
              value={whatDidntGoWell}
              onChange={(e) => setWhatDidntGoWell(e.target.value)}
              className="textarea-base"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-accent uppercase tracking-wider mb-1.5">
              3. How to Improve?
            </label>
            <textarea
              rows={2}
              required
              placeholder="Concrete adjustments for the next cycle..."
              value={howToImprove}
              onChange={(e) => setHowToImprove(e.target.value)}
              className="textarea-base"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Action Items (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Schedule gym 3x, sleep by 11pm"
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Retrospective
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this retrospective? It will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteReview}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;
