import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Edit3, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { AVATAR_OPTIONS } from '../data/seedData';
import { mockApi } from '../services/mockApi';
import type { Language } from '../types/vibebattle';
import { AvatarBadge } from '../components/common/AvatarBadge';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { PerformanceTrendsChart } from '../components/profile/PerformanceTrendsChart';

export function MyProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary', user?.id],
    queryFn: () => mockApi.getDashboardSummary(),
    enabled: Boolean(user),
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['user-performance-trends', user?.id],
    queryFn: () => mockApi.getUserPerformanceTrends(),
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
            {t.auth.loginTitle}
          </h1>
          <Link
            to="/login?redirect=/profile"
            className="mt-5 inline-flex rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t.nav.signIn}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <AvatarBadge
              name={user.displayName}
              avatarId={user.profile.avatarId}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
                  {user.displayName}
                </h1>
                {user.emailVerified && (
                  <CheckCircle2
                    aria-label="Verified email"
                    className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                  />
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                @{user.username} · {user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/profile/edit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{t.profile.editProfileBtn}</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                void logout().then(() => navigate('/'));
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t.nav.signOut}</span>
            </button>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t.profile.bioLabel}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {user.profile.bio || t.profile.noBio}
          </p>
          {user.profile.isPublic && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {t.profile.publicLinkLabel}:{' '}
              <Link
                to={`/u/${user.username}`}
                className="font-semibold text-rose-600 hover:underline dark:text-rose-400"
              >
                /u/{user.username}
              </Link>
            </p>
          )}
        </div>
      </div>

      {summary && (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
              {t.profile.statsHeading}
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t.dashboard.statQuizzes}
                </dt>
                <dd className="font-mono-nums mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                  {summary.quizzesCreated}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t.dashboard.statPlays}
                </dt>
                <dd className="font-mono-nums mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                  {summary.totalPlaysReceived}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t.dashboard.statAvgScore}
                </dt>
                <dd className="font-mono-nums mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                  {summary.averageScoreReceived}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t.dashboard.statCompleted}
                </dt>
                <dd className="font-mono-nums mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                  {summary.attemptsCompleted}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
              {t.profile.historyHeading}
            </h2>
            {summary.recentAttempts.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                {t.dashboard.noAttempts}
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {summary.recentAttempts.map((att) => (
                  <li key={att.id} className="flex items-center justify-between py-2.5 text-sm">
                    <Link
                      to={`/results/${att.id}`}
                      className="truncate pr-3 font-medium text-slate-800 hover:underline dark:text-slate-200"
                    >
                      {att.quizTitle}
                    </Link>
                    <span className="font-mono-nums shrink-0 font-bold text-slate-950 dark:text-white">
                      {att.percentage}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <PerformanceTrendsChart
        points={trends?.points ?? []}
        weeklyXpTotal={trends?.weeklyXpTotal ?? 0}
        averageAccuracy={trends?.averageAccuracy ?? null}
        quizzesThisWeek={trends?.quizzesThisWeek ?? 0}
        isLoading={trendsLoading}
      />
    </div>
  );
}

export function EditProfilePage() {
  const { user, updateProfile } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.profile.bio ?? '');
  const [avatarId, setAvatarId] = useState(user?.profile.avatarId ?? 'coral');
  const [isPublic, setIsPublic] = useState(user?.profile.isPublic ?? true);
  const [showCreatorOnQuizzes, setShowCreatorOnQuizzes] = useState(
    user?.profile.showCreatorOnQuizzes ?? true
  );
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Link to="/login" className="text-sm font-semibold text-rose-600">
          {t.nav.signIn}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        displayName,
        username,
        profile: {
          bio,
          avatarId,
          isPublic,
          showCreatorOnQuizzes,
          preferredLanguage: language,
        },
      });
      showToast('Profile saved!', 'success');
      navigate('/profile');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">
        {t.profile.editProfileBtn}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900"
      >
        <div>
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t.profile.avatarLabel}
          </span>
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {AVATAR_OPTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setAvatarId(item.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  avatarId === item.id
                    ? 'border-slate-950 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                    : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                <span className={`h-4 w-4 rounded-full ${item.bg}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="edit-display-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {t.auth.displayNameLabel}
            </label>
            <input
              id="edit-display-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="edit-username"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {t.auth.usernameLabel}
            </label>
            <input
              id="edit-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="edit-bio"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {t.profile.bioLabel}
          </label>
          <textarea
            id="edit-bio"
            rows={3}
            maxLength={220}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        {/* Privacy Settings */}
        <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-950 dark:text-white">
            {t.profile.privacyHeading}
          </h2>
          <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
            <span>{t.profile.publicProfileToggle}</span>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 accent-rose-600"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
            <span>{t.profile.showCreatorToggle}</span>
            <input
              type="checkbox"
              checked={showCreatorOnQuizzes}
              onChange={(e) => setShowCreatorOnQuizzes(e.target.checked)}
              className="h-4 w-4 accent-rose-600"
            />
          </label>
        </div>

        {/* Language & Theme */}
        <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 dark:border-slate-800">
          <div>
            <label
              htmlFor="pref-lang"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {t.profile.languageLabel}
            </label>
            <select
              id="pref-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="rn">Kirundi</option>
            </select>
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t.profile.themeLabel}
            </span>
            <div className="mt-1.5 flex gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${
                  theme === 'light'
                    ? 'border-slate-950 bg-slate-900 text-white dark:border-white'
                    : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>{t.profile.lightMode}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${
                  theme === 'dark'
                    ? 'border-white bg-white text-slate-950'
                    : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>{t.profile.darkMode}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/profile"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
          >
            {t.common.cancel}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {t.profile.saveProfileBtn}
          </button>
        </div>
      </form>
    </div>
  );
}

export function PublicProfilePage() {
  const { username = '' } = useParams<{ username: string }>();
  const { t } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => mockApi.getPublicProfile(username),
    enabled: Boolean(username),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <SkeletonCard />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
            Profile unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            This user profile does not exist or has been set to private.
          </p>
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <AvatarBadge
            name={data.user.displayName}
            avatarId={data.user.profile.avatarId}
            size="lg"
          />
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
              {data.user.displayName}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              @{data.user.username} · {data.quizzes.length} quizzes · {data.totalPlays}{' '}
              {t.explore.playsLabel}
            </p>
          </div>
        </div>
        {data.user.profile.bio && (
          <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
            {data.user.profile.bio}
          </p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        {data.quizzes.map((quiz) => (
          <article
            key={quiz.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {quiz.questionCount} {t.explore.questionsLabel} · {quiz.playCount}{' '}
                {t.explore.playsLabel}
              </p>
              <h2 className="mt-1.5 font-display text-lg font-bold text-slate-950 dark:text-white">
                {quiz.title}
              </h2>
            </div>
            <Link
              to={`/q/${quiz.shareCode}`}
              className="mt-4 inline-flex items-center gap-1.5 self-start rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
            >
              <span>{t.explore.playQuiz}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
