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
import { useLanguage } from '../context/LanguageContext';
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
  const { t } = useLanguage();
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
        category={t('categories.analytics')}
        title={t('reports.title')}
        description={t('reports.subtitle')}
        action={
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              icon={Download}
              loading={exportLoading}
              onClick={handleExportData}
            >
              {t('settings.exportData')}
            </Button>
            <Button variant="gradient" size="md" icon={Plus} onClick={() => setIsModalOpen(true)}>
              {t('common.create')} {t('reports.weeklyReport')}
            </Button>
          </div>
        }
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title={t('reports.totalReviews')}
          value={reviews.length}
          subtitle={t('reports.savedRetrospectives')}
          icon={FileText}
          color="indigo"
        />
        <StatCard
          title={t('reports.weeklyReviews')}
          value={reviews.filter((r) => r.type === 'weekly').length}
          subtitle={t('reports.cycleChecks7')}
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          title={t('reports.monthlyReviews')}
          value={reviews.filter((r) => r.type === 'monthly').length}
          subtitle={t('reports.deepDives30')}
          icon={Layers}
          color="purple"
        />
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary tracking-tight">{t('reports.retrospectiveArchive')}</h2>
          <span className="text-xs font-semibold text-secondary">{reviews.length} {t('reports.reviewsCount')}</span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('reports.noReviewsYet')}
            description={t('reports.noReviewsDesc')}
            actionText={t('reports.writeRetrospective')}
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {reviews.map((rev) => (
              <Card
                key={rev._id}
                hover
                bottomAction={
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setDeleteId(rev._id)}
                      className="p-1.5 rounded-lg bg-surface border border-theme text-secondary hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/10 shadow-xs transition-all cursor-pointer"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                }
              >
                <div className="space-y-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={rev.type === 'monthly' ? 'purple' : 'primary'} size="sm" dot>
                      {rev.type === 'monthly' ? t('reports.monthlyReview') : t('reports.weeklyReview')}
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
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('reports.whatWentWellTitle')}
                      </span>
                      <p className="text-xs text-primary font-medium leading-relaxed bg-subtle p-2.5 rounded-xl border border-theme">
                        {rev.whatWentWell}
                      </p>
                    </div>
                  )}

                  {rev.whatDidntGoWell && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-[var(--color-danger)] flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {t('reports.whatDidntGoWellTitle')}
                      </span>
                      <p className="text-xs text-primary font-medium leading-relaxed bg-subtle p-2.5 rounded-xl border border-theme">
                        {rev.whatDidntGoWell}
                      </p>
                    </div>
                  )}

                  {rev.howToImprove && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-accent flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> {t('reports.howToImproveTitle')}
                      </span>
                      <p className="text-xs text-primary font-medium leading-relaxed bg-subtle p-2.5 rounded-xl border border-theme">
                        {rev.howToImprove}
                      </p>
                    </div>
                  )}

                  {rev.actionItems && (
                    <div className="pt-2 border-t border-subtle">
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">
                        {t('reports.actionItems')}
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
        title={t('reports.newReview')}
        subtitle={t('reports.newReviewSubtitle')}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreateReview} className="space-y-4 pb-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Left Column: Cycle, Dates & Wins */}
            <div className="md:col-span-6 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                    {t('reports.reviewCycle')}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="select-base text-xs"
                  >
                    <option value="weekly">{t('reports.weekly')}</option>
                    <option value="monthly">{t('reports.monthly')}</option>
                  </select>
                </div>

                <DateInput
                  label={t('reports.startDate')}
                  value={startDate}
                  onChange={setStartDate}
                />

                <DateInput
                  label={t('reports.endDate')}
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 1. {t('reports.whatWentWell')}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={t('reports.whatWentWellPlaceholder')}
                  value={whatWentWell}
                  onChange={(e) => setWhatWentWell(e.target.value)}
                  className="textarea-base text-xs min-h-[90px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  {t('reports.actionItems')} ({t('common.optional')})
                </label>
                <input
                  type="text"
                  placeholder={t('reports.actionItemsPlaceholder')}
                  value={actionItems}
                  onChange={(e) => setActionItems(e.target.value)}
                  className="input-base text-xs"
                />
              </div>
            </div>

            {/* Right Column: Challenges & Solutions */}
            <div className="md:col-span-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[var(--color-danger)] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> 2. {t('reports.whatDidntGoWell')}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={t('reports.whatDidntGoWellPlaceholder')}
                  value={whatDidntGoWell}
                  onChange={(e) => setWhatDidntGoWell(e.target.value)}
                  className="textarea-base text-xs min-h-[90px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-accent uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 3. {t('reports.howToImprove')}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={t('reports.howToImprovePlaceholder')}
                  value={howToImprove}
                  onChange={(e) => setHowToImprove(e.target.value)}
                  className="textarea-base text-xs min-h-[90px]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle mt-1">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('reports.saveReview')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('common.confirmDeleteTitle')}
        subtitle={t('common.confirmDeleteDesc')}
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            {t('reports.deleteReviewDesc')}
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDeleteReview}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;
