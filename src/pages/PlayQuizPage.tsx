import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Flag, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { QUIZ_THEMES } from '../data/seedData';
import { mockApi } from '../services/mockApi';
import type { AttemptAnswerInput } from '../types/vibebattle';
import { AvatarBadge } from '../components/common/AvatarBadge';
import { SkeletonCard } from '../components/common/SkeletonCard';

export function PlayQuizPage() {
  const { code = '' } = useParams<{ code: string }>();
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<'intro' | 'playing' | 'submitting'>('intro');
  const [nickname, setNickname] = useState(user?.displayName ?? '');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AttemptAnswerInput[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Offensive content');
  const [reportDetails, setReportDetails] = useState('');
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (user?.displayName && !nickname) {
      setNickname(user.displayName);
    }
  }, [user, nickname]);

  const {
    data: quiz,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['playable-quiz', code],
    queryFn: () => mockApi.getQuizByShareCode(code),
    enabled: Boolean(code),
    retry: false,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard', code],
    queryFn: () => mockApi.getQuizLeaderboard(code),
    enabled: Boolean(code),
  });

  const activeQuestion = quiz?.questions[currentIndex];

  const handleAdvance = async () => {
    if (!quiz || !activeQuestion || !selectedOptionId) return;
    const nextAnswers = [
      ...answers.filter((a) => a.questionId !== activeQuestion.id),
      { questionId: activeQuestion.id, selectedOptionId },
    ];
    setAnswers(nextAnswers);

    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId('');
      return;
    }

    setPhase('submitting');
    try {
      const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
      const attempt = await mockApi.submitQuizAttempt({
        shareCode: quiz.shareCode,
        playerNickname: nickname,
        durationSeconds,
        answers: nextAnswers,
      });
      await queryClient.invalidateQueries({ queryKey: ['leaderboard', quiz.shareCode] });
      await queryClient.invalidateQueries({ queryKey: ['public-quizzes'] });
      navigate(`/results/${attempt.id}`, { state: { attempt } });
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
      setPhase('playing');
    }
  };

  // Keyboard shortcuts during gameplay (1-4 to pick, Enter to continue)
  useEffect(() => {
    if (phase !== 'playing' || !activeQuestion) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '4') {
        const idx = Number(e.key) - 1;
        const opt = activeQuestion.options[idx];
        if (opt) setSelectedOptionId(opt.id);
      } else if (e.key === 'Enter' && selectedOptionId) {
        e.preventDefault();
        void handleAdvance();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      showToast(t.play.nicknameLabel, 'error');
      return;
    }
    startedAtRef.current = Date.now();
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOptionId('');
    setPhase('playing');
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;
    try {
      await mockApi.submitReport({
        quizId: quiz.id,
        reason: reportReason,
        details: reportDetails,
      });
      setReportOpen(false);
      setReportDetails('');
      showToast(t.play.reportThanks, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !quiz) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
            {t.play.notFoundTitle}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {t.play.notFoundDesc}
          </p>
          <Link
            to="/explore"
            className="mt-6 inline-flex items-center rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
          >
            {t.play.backExplore}
          </Link>
        </div>
      </div>
    );
  }

  const themeStyle = QUIZ_THEMES.find((th) => th.id === quiz.theme) ?? QUIZ_THEMES[0];

  if (phase === 'intro') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className={`border-b px-6 py-6 sm:px-8 ${themeStyle.softBg} ${themeStyle.border}`}>
            <p className={`text-xs font-semibold capitalize ${themeStyle.accentText}`}>
              {quiz.category} · {quiz.questionCount} {t.explore.questionsLabel} · {quiz.playCount}{' '}
              {t.explore.playsLabel}
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white text-balance">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                {quiz.description}
              </p>
            )}

            <div className="mt-5 flex items-center gap-3">
              <AvatarBadge
                name={quiz.creatorLabel ?? 'A'}
                avatarId={quiz.creatorAvatarId}
                size="sm"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {quiz.creatorLabel
                  ? `${t.play.createdBy} ${quiz.creatorLabel}`
                  : t.play.hiddenCreator}
              </span>
            </div>
          </div>

          <form onSubmit={handleStart} className="p-6 sm:p-8">
            <label
              htmlFor="player-nickname"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {t.play.nicknameLabel}
            </label>
            <input
              id="player-nickname"
              type="text"
              required
              maxLength={32}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t.play.nicknamePlaceholder}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />

            <button
              type="submit"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
            >
              <span>{t.play.startBtn}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Top Leaderboard Preview */}
          <div className="border-t border-slate-200 px-6 py-5 sm:px-8 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>{t.play.topScoresHeading}</span>
              </h2>
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400"
              >
                <Flag className="h-3.5 w-3.5" />
                <span>{t.play.reportLink}</span>
              </button>
            </div>

            {leaderboard.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {t.play.noAttemptsYet}
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {leaderboard.slice(0, 3).map((entry) => (
                  <li
                    key={entry.attemptId}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      <span className="font-mono-nums mr-2 text-xs text-slate-400">
                        #{entry.rank}
                      </span>
                      {entry.playerNickname}
                    </span>
                    <span className="font-mono-nums font-bold text-slate-950 dark:text-white">
                      {entry.percentage}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Report Modal */}
        {reportOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          >
            <form
              onSubmit={handleReportSubmit}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <h2
                id="report-modal-title"
                className="font-display text-lg font-bold text-slate-950 dark:text-white"
              >
                {t.play.reportTitle}
              </h2>
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.play.reportReason}
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="Offensive content">Offensive or harassing content</option>
                  <option value="Spam">Spam / misleading link</option>
                  <option value="Personal info">Private personal information</option>
                </select>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.play.reportDetails}
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  {t.play.reportCancel}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  {t.play.reportSubmit}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  const progressPct = Math.round(((currentIndex + 1) / quiz.questions.length) * 100);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="mb-5 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
        <span>
          {t.play.questionOf} {currentIndex + 1} {t.play.of} {quiz.questions.length}
        </span>
        <span className="font-mono-nums">{progressPct}%</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full transition-transform duration-200 ${themeStyle.accentBg}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        {activeQuestion && (
          <motion.div
            key={activeQuestion.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="font-display text-xl font-bold text-slate-950 sm:text-2xl dark:text-white">
              {activeQuestion.prompt}
            </h2>

            <div className="mt-6 space-y-3">
              {activeQuestion.options.map((opt, idx) => {
                const isSelected = selectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedOptionId(opt.id)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors ${
                      isSelected
                        ? 'border-rose-600 bg-rose-50 text-rose-950 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-100'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <span
                      className={`font-mono-nums flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        isSelected
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.play.keyboardTip}
              </p>

              <button
                type="button"
                disabled={!selectedOptionId || phase === 'submitting'}
                onClick={() => void handleAdvance()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-45 whitespace-nowrap"
              >
                <span>
                  {currentIndex + 1 < quiz.questions.length
                    ? t.play.nextBtn
                    : t.play.finishBtn}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
