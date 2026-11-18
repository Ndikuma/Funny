import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { ArrowRight, CheckCircle2, RotateCcw, Sparkles, Trophy, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { aiClient, type GeneratedScoreVerdict } from '../services/aiClient';
import { mockApi } from '../services/mockApi';
import type { QuizAttempt } from '../types/vibebattle';
import { ShareSheet } from '../components/common/ShareSheet';
import { SkeletonCard } from '../components/common/SkeletonCard';

export function ResultsPage() {
  const { attemptId = '' } = useParams<{ attemptId: string }>();
  const location = useLocation();
  const stateAttempt = (location.state as { attempt?: QuizAttempt } | null)?.attempt;
  const { user } = useAuth();
  const { t, language } = useI18n();
  const { showToast } = useToast();
  const confettiFiredRef = useRef(false);
  const [aiVerdict, setAiVerdict] = useState<GeneratedScoreVerdict | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: attempt, isLoading } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => mockApi.getAttemptById(attemptId),
    initialData: stateAttempt,
    enabled: Boolean(attemptId),
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard', attempt?.quizShareCode],
    queryFn: () => mockApi.getQuizLeaderboard(attempt!.quizShareCode),
    enabled: Boolean(attempt?.quizShareCode),
  });

  useEffect(() => {
    if (!attempt || confettiFiredRef.current) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (attempt.percentage >= 80 && !prefersReduced) {
      confettiFiredRef.current = true;
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [attempt]);

  if (isLoading && !attempt) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <SkeletonCard />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
            Result not found
          </h1>
          <Link
            to="/explore"
            className="mt-5 inline-flex rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t.play.backExplore}
          </Link>
        </div>
      </div>
    );
  }

  const getScoreMessage = (pct: number) => {
    if (pct === 100) return t.results.msg100;
    if (pct >= 80) return t.results.msg80;
    if (pct >= 50) return t.results.msg50;
    return t.results.msgLow;
  };

  const handleAiVerdict = async () => {
    if (!attempt) return;
    setAiLoading(true);
    try {
      const missedPrompts = attempt.answers
        .filter((a) => !a.isCorrect)
        .map((a) => a.prompt);
      const res = await aiClient.generateScoreVerdict({
        quizTitle: attempt.quizTitle,
        playerNickname: attempt.playerNickname,
        percentage: attempt.percentage,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        language,
        missedPrompts,
      });
      setAiVerdict(res);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Score Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-10 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {attempt.quizTitle}
        </p>

        <div className="mt-4">
          <span className="font-mono-nums font-display text-6xl font-extrabold text-slate-950 sm:text-7xl dark:text-white">
            {attempt.percentage}%
          </span>
        </div>

        <p className="mt-2 font-mono-nums text-sm font-medium text-slate-600 dark:text-slate-300">
          {attempt.score} / {attempt.totalQuestions} {t.results.correctCount}
        </p>

        <h1 className="mt-4 font-display text-2xl font-bold text-rose-600 sm:text-3xl dark:text-rose-400">
          “{getScoreMessage(attempt.percentage)}”
        </h1>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/create"
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
          >
            <span>{t.results.createOwnBtn}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to={`/q/${attempt.quizShareCode}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{t.results.playAgainBtn}</span>
          </Link>
          <button
            type="button"
            disabled={aiLoading}
            onClick={() => void handleAiVerdict()}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
          >
            <Sparkles className="h-4 w-4" />
            <span>{aiLoading ? t.ai.generating : t.ai.verdictBtn}</span>
          </button>
        </div>

        {aiVerdict && (
          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-left dark:border-rose-900/60 dark:bg-rose-950/30">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t.ai.verdictTitle}</span>
            </p>
            <p className="mt-1 font-display text-base font-bold text-slate-950 dark:text-white">
              {aiVerdict.headline}
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              {aiVerdict.commentary}
            </p>
          </div>
        )}
      </section>

      {/* Guest Conversion Banner (Post-game, non-intrusive) */}
      {attempt.isGuest && !user && (
        <section className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="font-display text-lg font-bold">{t.results.guestBannerTitle}</h2>
            <p className="mt-1 text-sm text-slate-300">{t.results.guestBannerDesc}</p>
          </div>
          <Link
            to={`/register?claimAttempt=${attempt.id}&redirect=/dashboard`}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 whitespace-nowrap"
          >
            <span>{t.results.guestClaimBtn}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {/* Share & Leaderboard Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <ShareSheet
            shareCode={attempt.quizShareCode}
            quizTitle={attempt.quizTitle}
            scorePercentage={attempt.percentage}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-950 dark:text-white">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>{t.results.leaderboardHeading}</span>
            </h2>
            <span className="font-mono-nums text-xs text-slate-500 dark:text-slate-400">
              {leaderboard.length} players
            </span>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-3 font-medium">{t.results.rank}</th>
                  <th className="py-2 pr-3 font-medium">{t.results.player}</th>
                  <th className="py-2 pr-3 font-medium text-right">{t.results.score}</th>
                  <th className="py-2 font-medium text-right">{t.results.time}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaderboard.map((entry) => {
                  const isCurrent = entry.attemptId === attempt.id;
                  return (
                    <tr
                      key={entry.attemptId}
                      className={
                        isCurrent ? 'bg-rose-50/70 dark:bg-rose-950/25' : undefined
                      }
                    >
                      <td className="font-mono-nums py-2.5 pr-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        #{entry.rank}
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-slate-900 dark:text-slate-100">
                        {entry.playerNickname}
                      </td>
                      <td className="font-mono-nums py-2.5 pr-3 text-right font-bold text-slate-950 dark:text-white">
                        {entry.percentage}% ({entry.score}/{entry.totalQuestions})
                      </td>
                      <td className="font-mono-nums py-2.5 text-right text-xs text-slate-500 dark:text-slate-400">
                        {entry.durationSeconds}s
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Post-Completion Answer Breakdown */}
      {attempt.answers.length > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
            {t.results.reviewHeading}
          </h2>
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {attempt.answers.map((item, idx) => (
              <div key={item.questionId} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {idx + 1}. {item.prompt}
                  </p>
                  {item.isCorrect ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                      <XCircle className="h-4 w-4" />
                      <span>Missed</span>
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <span>
                    {t.results.yourPick}:{' '}
                    <strong className="text-slate-900 dark:text-slate-200">
                      {item.selectedText}
                    </strong>
                  </span>
                  {!item.isCorrect && (
                    <span>
                      {t.results.correctAnswer}:{' '}
                      <strong className="text-emerald-700 dark:text-emerald-400">
                        {item.correctText}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
