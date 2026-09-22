import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { Sparkles, Shuffle, Smile, Zap, Heart, CheckCircle2, Save, BookOpen } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

const GUIDED_QUESTIONS = [
  { question: "What is one small victory you achieved today that you are proud of?", category: "Gratitude" },
  { question: "What was the most challenging decision you made today and what did it teach you?", category: "Growth" },
  { question: "What are three specific things you are genuinely grateful for right now?", category: "Gratitude" },
  { question: "How did you bring focus and heartfelt presence to your prayers and worship today?", category: "Deen" },
  { question: "What is one disciplined habit or action that propelled your progress today?", category: "Productivity" },
  { question: "Who did you connect with or help today, and how did it impact you?", category: "Relationships" },
  { question: "What is one thing you can do tomorrow to make your life 1% easier or better?", category: "Growth" },
  { question: "What primary intention (Niyyah) do you want to anchor tomorrow around?", category: "Deen" },
  { question: "If you could redo one moment from today with more calm, what would it be?", category: "Mindset" },
  { question: "What drained your energy today, and how can you protect your boundaries tomorrow?", category: "Mindset" },
  { question: "What did you learn today about your own strengths or blind spots?", category: "Growth" },
  { question: "How did you handle unexpected disruptions or stress today?", category: "Discipline" },
  { question: "What is a blessing in your life that you frequently take for granted?", category: "Gratitude" },
  { question: "Which core value did your actions reflect most clearly today?", category: "Mindset" },
  { question: "What physical sensation or emotion did you notice most in your body today?", category: "Mindset" },
  { question: "What is one piece of knowledge, skill, or wisdom you acquired today?", category: "Growth" },
  { question: "In what way did you invest in your long-term health or fitness today?", category: "Productivity" },
  { question: "How did you practice patience or forgiveness with someone today?", category: "Relationships" },
  { question: "What is a Quranic verse or Hadith that resonated with your heart today?", category: "Deen" },
  { question: "What is the single most important task you must complete first tomorrow?", category: "Productivity" },
  { question: "Where did you step out of your comfort zone today?", category: "Growth" },
  { question: "How did you manage your digital distractions and screen time today?", category: "Discipline" },
  { question: "What made you smile or laugh today?", category: "Gratitude" },
  { question: "What is one self-limiting belief you noticed yourself having today, and how can you reframe it?", category: "Mindset" },
  { question: "How did your financial decisions today align with your long-term life vision?", category: "Discipline" },
  { question: "What did you do today simply for the joy and satisfaction of doing it?", category: "Gratitude" },
  { question: "What is one conversation you had today that gave you clarity?", category: "Relationships" },
  { question: "How did you show kindness to yourself during a difficult moment today?", category: "Mindset" },
  { question: "What standard or habit did you hold yourself to even when you did not feel like it?", category: "Discipline" },
  { question: "If today was a chapter in your autobiography, what would its title be?", category: "Growth" },
];

export const GuidedReflectionModal = ({ isOpen, onClose, selectedDate, onSaveSuccess }) => {
  const { t } = useLanguage();

  const MOODS = [
    { label: t('reflection.moodGreat'), emoji: '😊', value: 'great', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-500' },
    { label: t('reflection.moodEnergized'), emoji: '⚡', value: 'energized', color: 'border-amber-500 bg-amber-500/10 text-amber-500' },
    { label: t('reflection.moodPeaceful'), emoji: '🧘', value: 'peaceful', color: 'border-indigo-500 bg-indigo-500/10 text-indigo-500' },
    { label: t('reflection.moodNeutral'), emoji: '😐', value: 'neutral', color: 'border-zinc-500 bg-zinc-500/10 text-zinc-500' },
    { label: t('reflection.moodTired'), emoji: '🥱', value: 'tired', color: 'border-purple-500 bg-purple-500/10 text-purple-500' },
    { label: t('reflection.moodLow'), emoji: '😔', value: 'low', color: 'border-rose-500 bg-rose-500/10 text-rose-500' },
  ];

  const [currentPrompt, setCurrentPrompt] = useState(GUIDED_QUESTIONS[0]);
  const [mood, setMood] = useState('great');
  const [promptAnswer, setPromptAnswer] = useState('');
  const [summary, setSummary] = useState('');
  const [highlights, setHighlights] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [nextDayNotes, setNextDayNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Shuffle random prompt
  const handleShuffle = () => {
    const randomIndex = Math.floor(Math.random() * GUIDED_QUESTIONS.length);
    setCurrentPrompt(GUIDED_QUESTIONS[randomIndex]);
  };

  useEffect(() => {
    if (isOpen) {
      handleShuffle();
      // Fetch existing journal for date
      const fetchJournal = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/journal?date=${selectedDate}`);
          if (res.data) {
            if (res.data.mood) setMood(res.data.mood);
            if (res.data.promptAnswer) setPromptAnswer(res.data.promptAnswer);
            if (res.data.summary) setSummary(res.data.summary);
            if (res.data.highlights) setHighlights(res.data.highlights);
            if (res.data.gratitude) setGratitude(res.data.gratitude);
            if (res.data.nextDayNotes) setNextDayNotes(res.data.nextDayNotes);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      fetchJournal();
    }
  }, [isOpen, selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/journal', {
        date: selectedDate,
        mood,
        promptQuestion: currentPrompt.question,
        promptCategory: currentPrompt.category,
        promptAnswer,
        summary,
        highlights,
        gratitude,
        nextDayNotes,
      });
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save reflection', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('reflection.guidedReflection')} maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-5 pb-1">
        {/* Random Prompt Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-indigo-500/5 border border-indigo-500/25 shadow-xs relative transition-all">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <Badge variant="purple" size="xs">
              <Sparkles className="w-3 h-3 mr-1 text-purple-500" /> {currentPrompt.category} {t('reflection.prompt')}
            </Badge>
            <button
              type="button"
              onClick={handleShuffle}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-secondary hover:text-primary bg-surface/60 hover:bg-surface border border-theme/60 transition-all cursor-pointer active:scale-95 shadow-xs"
              title={t('reflection.shufflePrompt')}
            >
              <Shuffle className="w-3.5 h-3.5 text-accent" /> {t('reflection.shufflePrompt')}
            </button>
          </div>
          
          <h3 className="text-sm sm:text-base font-bold text-primary leading-relaxed">
            "{currentPrompt.question}"
          </h3>
          
          <textarea
            value={promptAnswer}
            onChange={(e) => setPromptAnswer(e.target.value)}
            placeholder={t('reflection.writeReflectionPrompt')}
            rows={3}
            className="textarea-base mt-3 min-h-[80px] text-sm bg-surface/90 placeholder:text-muted"
          />
        </div>

        {/* Mood Selector Strip */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider">
              {t('reflection.mood')}
            </label>
            <span className="text-[11px] font-medium text-secondary capitalize">
              {t('reflection.selected')} <span className="font-bold text-primary">{MOODS.find((m) => m.value === mood)?.label || mood}</span>
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
            {MOODS.map((m) => {
              const isSelected = mood === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`py-2.5 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? `${m.color} border-2 shadow-xs ring-2 ring-accent/20`
                      : 'border-theme bg-subtle/40 text-secondary hover:bg-subtle hover:text-primary hover:border-theme/80'
                  }`}
                >
                  <span className="text-xl leading-none">{m.emoji}</span>
                  <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-secondary'}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Col Grid: Highlights & Gratitude */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>✨</span> {t('reflection.wins')}
            </label>
            <textarea
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder={t('reflection.winsPlaceholder')}
              rows={3}
              className="textarea-base min-h-[80px] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>🙏</span> {t('reflection.gratitude')}
            </label>
            <textarea
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder={t('reflection.gratitudePlaceholder')}
              rows={3}
              className="textarea-base min-h-[80px] text-sm"
            />
          </div>
        </div>

        {/* Next Day Notes */}
        <div>
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span>🎯</span> {t('reflection.tomorrowPlan')}
          </label>
          <input
            type="text"
            value={nextDayNotes}
            onChange={(e) => setNextDayNotes(e.target.value)}
            placeholder={t('reflection.tomorrowPlaceholder')}
            className="input-base text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme/60 mt-2">
          <Button variant="ghost" size="md" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="gradient"
            size="md"
            type="submit"
            icon={Save}
            loading={saving}
          >
            {t('reflection.saveReflection')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GuidedReflectionModal;
