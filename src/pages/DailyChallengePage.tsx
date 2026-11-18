import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Flame, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { aiClient } from '../services/aiClient';
import { mockApi } from '../services/mockApi';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

export function DailyChallengePage() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedByChallenge, setSelectedByChallenge] = useState<Record<string, number>>({});
  const [guestCompleted, setGuestCompleted] = useState<
    Record<string, { isCorrect: boolean; selectedIndex: number }>
  >({});
  const [aiLoading, setAiLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['daily-hub', user?.id],
    queryFn: () => mockApi.getDailyChallengeHub(),
  });

  const handleSubmit = async (challengeId: string) => {
    const selectedIndex = selectedByChallenge[challengeId];
    if (selectedIndex === undefined) {
      showToast('Select an option first.', 'error');
      return;
    }
    try {
      const res = await mockApi.submitDailyChallenge({ challengeId, selectedIndex });
      if (!user) {
        setGuestCompleted((prev) => ({
          ...prev,
          [challengeId]: { isCorrect: res.participation.isCorrect, selectedIndex },
        }));
      }
      await queryClient.invalidateQueries({ queryKey: ['daily-hub'] });
      showToast(
        res.participation.isCorrect
          ? `Correct! +${res.participation.xpAwarded} XP`
          : `Completed! +${res.participation.xpAwarded} XP`,
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    }
  };

  const handleGenerateAiDaily = async () => {
    setAiLoading(true);
    try {
      const generated = await aiClient.generateDailyChallenge({ language });
      await mockApi.addAiDailyChallenge({
        type: generated.type === 'riddle' || generated.type === 'sentence' ? generated.type : 'mini_quiz',
        title: generated.title,
        prompt: generated.prompt,
        options: generated.options.slice(0, 4),
        correctIndex: Math.min(3, Math.max(0, Number(generated.correctIndex) || 0)),
        funFact: generated.funFact,
      });
      await queryClient.invalidateQueries({ queryKey: ['daily-hub'] });
      showToast('Fresh AI Daily Challenge added!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t.modes.dailyTitle}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 sm:text-base dark:text-slate-300">
            {t.modes.dailySubtitle}
          </p>
        </div>

        <button
          type="button"
          disabled={aiLoading}
          onClick={() => void handleGenerateAiDaily()}
          className="inline-flex items-center gap-1.5 self-start rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 whitespace-nowrap"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{aiLoading ? t.ai.generating : t.ai.dailyGenerateBtn}</span>
        </button>
      </div>

      {data?.gamification && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">Current Streak</p>
            <p className="font-mono-nums mt-1 flex items-center gap-1.5 text-2xl font-bold text-slate-950 dark:text-white">
              <Flame className="h-5 w-5 text-amber-500" />
              <span>{data.gamification.currentStreak}d</span>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total XP</p>
            <p className="font-mono-nums mt-1 text-2xl font-bold text-slate-950 dark:text-white">
              {data.gamification.xp}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">Level</p>
            <p className="font-mono-nums mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
              Lv. {data.gamification.level}
            </p>
          </div>
        </div>
      )}

      {isLoading || !data ? (
        <SkeletonLoader variant="quiz-card" count={2} className="mt-8" />
      ) : (
        <div className="mt-8 space-y-6">
          {data.challenges.map((challenge) => {
            const participation = data.participations.find(
              (p) => p.challengeId === challenge.id
            );
            const guestState = guestCompleted[challenge.id];
            const completed = Boolean(participation || guestState);
            const chosenIndex =
              participation?.selectedIndex ??
              guestState?.selectedIndex ??
              selectedByChallenge[challenge.id];

            return (
              <article
                key={challenge.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="capitalize">
                    {challenge.type.replace('_', ' ')} · {challenge.dateKey}
                  </span>
                  <span className="font-mono-nums font-semibold text-amber-600 dark:text-amber-400">
                    +{challenge.xpReward} XP
                  </span>
                </div>

                <h2 className="mt-2 font-display text-xl font-bold text-slate-950 dark:text-white">
                  {challenge.title}
                </h2>
                <p className="mt-2 text-base text-slate-700 dark:text-slate-300">
                  {challenge.prompt}
                </p>

                <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {challenge.options.map((opt, idx) => {
                    const isPicked = chosenIndex === idx;
                    const isAnswer = completed && idx === challenge.correctIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={completed}
                        onClick={() =>
                          setSelectedByChallenge((prev) => ({
                            ...prev,
                            [challenge.id]: idx,
                          }))
                        }
                        className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                          isAnswer
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100'
                            : isPicked
                              ? 'border-rose-600 bg-rose-50 text-rose-950 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-100'
                              : 'border-slate-200 text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {completed ? (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{challenge.funFact}</span>
                  </div>
                ) : (
                  <div className="mt-5 flex items-center justify-between">
                    {!user ? (
                      <Link
                        to="/login?redirect=/daily"
                        className="text-xs font-medium text-slate-500 hover:underline dark:text-slate-400"
                      >
                        Sign in to save your streak & XP
                      </Link>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => void handleSubmit(challenge.id)}
                      className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      Submit Answer
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
