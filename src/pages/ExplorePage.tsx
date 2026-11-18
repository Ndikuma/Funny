import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarCheck2, Flame, HeartHandshake, Radio, Search } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { mockApi } from '../services/mockApi';
import { QUIZ_THEMES } from '../data/seedData';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

const CATEGORIES = ['all', 'friendship', 'couple', 'personality', 'fun'] as const;

export function ExplorePage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('all');

  const { data: quizzes, isLoading, isFetching } = useQuery({
    queryKey: ['public-quizzes', search, category],
    queryFn: () => mockApi.listPublicQuizzes({ search, category }),
  });

  const categoryLabels: Record<(typeof CATEGORIES)[number], string> = {
    all: t.explore.all,
    friendship: t.explore.friendship,
    couple: t.explore.couple,
    personality: t.explore.personality,
    fun: t.explore.fun,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t.explore.title}
          </h1>
          <p className="mt-1.5 text-base text-slate-600 dark:text-slate-300">
            {t.explore.subtitle}
          </p>
        </div>

        <Link
          to="/create"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 whitespace-nowrap"
        >
          <span>{t.nav.createQuiz}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Mode Hub Quick Links */}
      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link
          to="/battles"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-rose-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-800"
        >
          <Flame className="h-5 w-5 shrink-0 text-amber-500" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
              {t.nav.battles}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              Squad voting awards
            </p>
          </div>
        </Link>

        <Link
          to="/compatibility"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-rose-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-800"
        >
          <HeartHandshake className="h-5 w-5 shrink-0 text-rose-500" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
              {t.nav.compatibility}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              Dual match &amp; compare
            </p>
          </div>
        </Link>

        <Link
          to="/daily"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-rose-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-800"
        >
          <CalendarCheck2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
              {t.nav.daily}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              Streaks &amp; XP
            </p>
          </div>
        </Link>

        <Link
          to="/live"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-rose-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-800"
        >
          <Radio className="h-5 w-5 shrink-0 text-sky-500" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
              {t.nav.live}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              Real-time rooms
            </p>
          </div>
        </Link>
      </div>

      {/* Search & Segmented Category Filter */}
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.explore.searchPlaceholder}
            aria-label={t.explore.searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div
          role="group"
          aria-label="Category filter"
          className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                category === cat
                  ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading || (isFetching && !quizzes) ? (
        <SkeletonLoader
          variant="quiz-card"
          count={6}
          className="mt-8"
          label={t.common.loading}
        />
      ) : !quizzes || quizzes.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
            {t.explore.emptyTitle}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            {t.explore.emptyDesc}
          </p>
          <Link
            to="/create"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
          >
            {t.nav.createQuiz}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            const themeStyle =
              QUIZ_THEMES.find((th) => th.id === quiz.theme) ?? QUIZ_THEMES[0];
            return (
              <article
                key={quiz.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className={`font-semibold capitalize ${themeStyle.accentText}`}>
                      {quiz.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {quiz.questionCount} {t.explore.questionsLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {quiz.playCount} {t.explore.playsLabel}
                    </span>
                  </div>

                  <h2 className="mt-2.5 font-display text-xl font-bold text-slate-950 dark:text-white">
                    {quiz.title}
                  </h2>
                  {quiz.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                      {quiz.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {quiz.creatorLabel ? (
                      <>
                        {t.explore.byLabel}{' '}
                        <Link
                          to={`/u/${quiz.creatorUsername}`}
                          className="font-semibold text-slate-800 hover:underline dark:text-slate-200"
                        >
                          {quiz.creatorLabel}
                        </Link>
                      </>
                    ) : (
                      <span>{t.explore.anonymousCreator}</span>
                    )}
                  </div>

                  <Link
                    to={`/q/${quiz.shareCode}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 whitespace-nowrap"
                  >
                    <span>{t.explore.playQuiz}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
