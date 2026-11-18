import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Award, Bell, CheckCircle2, Plus, Trophy, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { mockApi } from '../services/mockApi';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

export function DashboardPage() {
  const { user, verifyEmail } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary', user?.id],
    queryFn: () => mockApi.getDashboardSummary(),
    enabled: Boolean(user),
  });

  const { data: dailyHub } = useQuery({
    queryKey: ['daily-challenge-hub', user?.id],
    queryFn: () => mockApi.getDailyChallengeHub(),
    enabled: Boolean(user),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => mockApi.listNotifications(),
    enabled: Boolean(user),
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
            {t.auth.loginTitle}
          </h1>
          <Link
            to="/login?redirect=/dashboard"
            className="mt-5 inline-flex rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t.nav.signIn}
          </Link>
        </div>
      </div>
    );
  }

  const handleVerify = async () => {
    try {
      await verifyEmail();
      showToast(t.dashboard.verifiedMsg, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t.dashboard.title}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 sm:text-base dark:text-slate-300">
            {t.dashboard.subtitle}
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>{t.dashboard.quickCreate}</span>
        </Link>
      </div>

      {!user.emailVerified && (
        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center dark:border-amber-900/60 dark:bg-amber-950/30">
          <p className="text-sm text-amber-950 dark:text-amber-200">
            {t.dashboard.verifyBanner}
          </p>
          <button
            type="button"
            onClick={() => void handleVerify()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 whitespace-nowrap"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{t.dashboard.verifyBtn}</span>
          </button>
        </div>
      )}

      {isLoading || !summary ? (
        <div className="mt-8 space-y-8">
          <SkeletonLoader variant="stat-card" count={4} label={t.common.loading} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                  {t.dashboard.myQuizzesHeading}
                </h2>
              </div>
              <SkeletonLoader variant="quiz-list" count={4} className="mt-2" label={t.common.loading} />
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                  {t.dashboard.recentAttemptsHeading}
                </h2>
              </div>
              <SkeletonLoader variant="quiz-list" count={4} className="mt-2" label={t.common.loading} />
            </section>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Metrics */}
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.dashboard.statQuizzes}
              </p>
              <p className="font-mono-nums mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                {summary.quizzesCreated}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.dashboard.statPlays}
              </p>
              <p className="font-mono-nums mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                {summary.totalPlaysReceived}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.dashboard.statAvgScore}
              </p>
              <p className="font-mono-nums mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                {summary.averageScoreReceived}%
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.dashboard.statCompleted}
              </p>
              <p className="font-mono-nums mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                {summary.attemptsCompleted}
              </p>
            </div>
          </div>

          {/* Social Hub & Game Shortcuts */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Link
              to="/achievements"
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-rose-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-800"
            >
              <Award className="h-5 w-5 shrink-0 text-amber-500" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                  {t.nav.achievements}
                </p>
                <p className="font-mono-nums truncate text-xs text-slate-500 dark:text-slate-400">
                  Lv.{dailyHub?.gamification?.level ?? 1} · {dailyHub?.gamification?.xp ?? 0} XP
                </p>
              </div>
            </Link>

            <Link
              to="/leaderboards"
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-rose-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-800"
            >
              <Trophy className="h-5 w-5 shrink-0 text-rose-500" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                  {t.nav.leaderboards}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  Global &amp; Friends
                </p>
              </div>
            </Link>

            <Link
              to="/friends"
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-rose-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-800"
            >
              <Users className="h-5 w-5 shrink-0 text-sky-500" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                  {t.nav.friends}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  Squad &amp; requests
                </p>
              </div>
            </Link>

            <Link
              to="/notifications"
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-rose-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-800"
            >
              <Bell className="h-5 w-5 shrink-0 text-emerald-500" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                  {t.nav.notifications}
                </p>
                <p className="font-mono-nums truncate text-xs text-slate-500 dark:text-slate-400">
                  {unreadCount} unread
                </p>
              </div>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Recent Quizzes */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                  {t.dashboard.myQuizzesHeading}
                </h2>
                <Link
                  to="/my-quizzes"
                  className="text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400"
                >
                  {t.dashboard.viewAll}
                </Link>
              </div>

              {summary.recentQuizzes.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  {t.dashboard.noQuizzes}
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                  {summary.recentQuizzes.map((quiz) => (
                    <li
                      key={quiz.id}
                      className="flex items-center justify-between gap-3 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {quiz.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {quiz.isPublished ? t.myQuizzes.published : t.myQuizzes.draft} ·{' '}
                          <span className="font-mono-nums">{quiz.playCount}</span>{' '}
                          {t.explore.playsLabel} · Code{' '}
                          <span className="font-mono">{quiz.shareCode}</span>
                        </p>
                      </div>
                      <Link
                        to={`/q/${quiz.shareCode}`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <span>{t.myQuizzes.play}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Recent Attempts */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                  {t.dashboard.recentAttemptsHeading}
                </h2>
                <Link
                  to="/explore"
                  className="text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400"
                >
                  {t.nav.explore}
                </Link>
              </div>

              {summary.recentAttempts.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  {t.dashboard.noAttempts}
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                  {summary.recentAttempts.map((att) => (
                    <li
                      key={att.id}
                      className="flex items-center justify-between gap-3 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {att.quizTitle}
                        </p>
                        <p className="mt-0.5 font-mono-nums text-xs text-slate-500 dark:text-slate-400">
                          {att.score}/{att.totalQuestions} · {att.durationSeconds}s
                        </p>
                      </div>
                      <Link
                        to={`/results/${att.id}`}
                        className="font-mono-nums shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
                      >
                        {att.percentage}%
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
