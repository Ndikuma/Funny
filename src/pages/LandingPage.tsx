import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, Lock, Sparkles, Trophy, Users } from 'lucide-react';
import { ASSET_IMAGES } from '../data/seedData';
import { useI18n } from '../contexts/I18nContext';
import { mockApi } from '../services/mockApi';

export function LandingPage() {
  const { t } = useI18n();

  const { data: featuredLeaderboard } = useQuery({
    queryKey: ['leaderboard', 'AB12CD'],
    queryFn: () => mockApi.getQuizLeaderboard('AB12CD'),
  });

  return (
    <div className="bg-slate-50 dark:bg-[#0B0F17]">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:px-6 lg:pt-16 lg:pb-20">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          <div className="flex flex-col justify-center lg:col-span-6">
            <h1
              className="font-display font-extrabold tracking-tight text-slate-950 dark:text-white text-balance"
              style={{ fontSize: 'clamp(2.25rem, 4vw, 3.75rem)', lineHeight: 1.06 }}
            >
              {t.landing.heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              {t.landing.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/create"
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 whitespace-nowrap"
              >
                <span>{t.landing.heroPrimaryCta}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/explore"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                {t.landing.heroSecondaryCta}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-64 overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:h-80 lg:h-full lg:min-h-[380px] dark:border-slate-800 dark:bg-slate-900">
              <img
                src={ASSET_IMAGES.heroFriends}
                alt="Friends laughing and playing VibeBattle quizzes on their smartphones"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
              <div className="absolute right-4 bottom-4 left-4 flex items-center justify-between text-xs font-medium text-white/95">
                <span>Who Knows Me Best?</span>
                <Link
                  to="/q/AB12CD"
                  className="pointer-events-auto rounded-lg bg-white/95 px-3 py-1.5 font-semibold text-slate-950 transition-colors hover:bg-white"
                >
                  Try Live Demo Quiz
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Quantitative Proof Strip */}
        <div className="mt-10 grid grid-cols-1 gap-4 border-t border-slate-200 pt-8 sm:grid-cols-3 dark:border-slate-800">
          <div>
            <p className="font-mono-nums text-2xl font-bold text-slate-950 dark:text-white">
              14,820+
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t.landing.proofQuizzesPlayed}
            </p>
          </div>
          <div>
            <p className="font-mono-nums text-2xl font-bold text-slate-950 dark:text-white">
              45 sec
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t.landing.proofShareTime}
            </p>
          </div>
          <div>
            <p className="font-mono-nums text-2xl font-bold text-slate-950 dark:text-white">
              100% Guest
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t.landing.proofFriendsJoined}
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white text-balance">
              {t.landing.howTitle}
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
              {t.landing.howSubtitle}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                {t.landing.step1Title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t.landing.step1Desc}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                {t.landing.step2Title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t.landing.step2Desc}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                {t.landing.step3Title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t.landing.step3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Games Bento Grid */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white text-balance">
            {t.landing.gamesTitle}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
            {t.landing.gamesSubtitle}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Featured Game 1 (Spans 7 columns) */}
          <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
            <div className="h-56 overflow-hidden bg-slate-100 sm:h-64 dark:bg-slate-800">
              <img
                src={ASSET_IMAGES.whoKnowsMe}
                alt="Who Knows Me Best quiz cards"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t.landing.game1Meta}
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold text-slate-950 dark:text-white">
                  {t.landing.game1Title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {t.landing.game1Desc}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <Link
                  to="/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
                >
                  <span>{t.landing.game1Action}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/q/AB12CD"
                  className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline dark:text-slate-200"
                >
                  Try Sample Quiz
                </Link>
              </div>
            </div>
          </article>

          {/* Secondary Games Stack (Spans 5 columns) */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <article className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white sm:flex-row lg:flex-col dark:border-slate-800 dark:bg-slate-900">
              <div className="h-44 shrink-0 overflow-hidden bg-slate-100 sm:h-auto sm:w-44 lg:h-40 lg:w-full dark:bg-slate-800">
                <img
                  src={ASSET_IMAGES.funnyBattle}
                  alt="Funny Battle voting cards and brass trophy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t.landing.game2Meta}
                  </p>
                  <h3 className="mt-1.5 font-display text-lg font-bold text-slate-950 dark:text-white">
                    {t.landing.game2Title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                    {t.landing.game2Desc}
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    to="/battles"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                  >
                    <span>{t.landing.game2Action}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>

            <article className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white sm:flex-row lg:flex-col dark:border-slate-800 dark:bg-slate-900">
              <div className="h-44 shrink-0 overflow-hidden bg-slate-100 sm:h-auto sm:w-44 lg:h-40 lg:w-full dark:bg-slate-800">
                <img
                  src={ASSET_IMAGES.loveFriendship}
                  alt="Couple and friendship conversation prompts"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t.landing.game3Meta}
                  </p>
                  <h3 className="mt-1.5 font-display text-lg font-bold text-slate-950 dark:text-white">
                    {t.landing.game3Title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                    {t.landing.game3Desc}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <Link
                    to="/compatibility"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                  >
                    <span>{t.landing.game3Action}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/live"
                    className="text-xs font-semibold text-slate-700 underline-offset-4 hover:underline dark:text-slate-300"
                  >
                    {t.nav.live}
                  </Link>
                  <Link
                    to="/daily"
                    className="text-xs font-semibold text-slate-700 underline-offset-4 hover:underline dark:text-slate-300"
                  >
                    {t.nav.daily}
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Social Experience & Live Leaderboard Preview */}
      <section className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white text-balance">
              {t.landing.socialTitle}
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
              {t.landing.socialSubtitle}
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-3.5">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                    {t.landing.socialPoint1Title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {t.landing.socialPoint1Desc}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                    {t.landing.socialPoint2Title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {t.landing.socialPoint2Desc}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                    {t.landing.socialPoint3Title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {t.landing.socialPoint3Desc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Sample Leaderboard · Code AB12CD
                  </p>
                  <h3 className="mt-0.5 font-display text-lg font-bold text-slate-950 dark:text-white">
                    How Well Do You Really Know Maya?
                  </h3>
                </div>
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>

              <ul className="mt-4 divide-y divide-slate-200/80 dark:divide-slate-800">
                {(featuredLeaderboard ?? []).slice(0, 4).map((entry) => (
                  <li
                    key={entry.attemptId}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono-nums w-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        #{entry.rank}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {entry.playerNickname}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-nums text-xs text-slate-500 dark:text-slate-400">
                        {entry.score}/{entry.totalQuestions}
                      </span>
                      <span className="font-mono-nums font-bold text-slate-950 dark:text-white">
                        {entry.percentage}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-center justify-between pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Live mock scoring enabled
                </span>
                <Link
                  to="/q/AB12CD"
                  className="text-sm font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                >
                  Beat 100% now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-950 px-6 py-12 text-center text-white sm:px-12 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mx-auto max-w-xl font-display text-2xl font-bold tracking-tight sm:text-4xl text-balance">
            {t.landing.finalCtaTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-slate-300 sm:text-base">
            {t.landing.finalCtaSubtitle}
          </p>
          <div className="mt-8">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-rose-500"
            >
              <span>{t.landing.finalCtaButton}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
