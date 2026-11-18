import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Heart, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { aiClient } from '../services/aiClient';
import { mockApi } from '../services/mockApi';
import type { CompatibilityCategory, CompatibilityQuestion } from '../types/vibebattle';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

const COMPATIBILITY_CATEGORIES: { id: CompatibilityCategory; label: string }[] = [
  { id: 'couple', label: 'Couple Challenge' },
  { id: 'best_friends', label: 'Best Friends Challenge' },
  { id: 'compatibility', label: 'Compatibility Quiz' },
  { id: 'would_you_rather', label: 'Would You Rather?' },
  { id: 'this_or_that', label: 'This or That?' },
  { id: 'friendship_test', label: 'Friendship Test' },
];

const DEFAULT_QUESTIONS: CompatibilityQuestion[] = [
  {
    id: 'def-1',
    prompt: 'This or That: Cozy movie night or spontaneous late-night drive?',
    options: [
      { id: 'def-1-a', text: 'Cozy movie night' },
      { id: 'def-1-b', text: 'Spontaneous late-night drive' },
    ],
  },
  {
    id: 'def-2',
    prompt: 'Would You Rather: Always know when someone is lying or always get away with any white lie?',
    options: [
      { id: 'def-2-a', text: 'Always detect lies' },
      { id: 'def-2-b', text: 'Always pass smoothly' },
    ],
  },
  {
    id: 'def-3',
    prompt: 'Ideal Sunday brunch pick:',
    options: [
      { id: 'def-3-a', text: 'Sweet pancakes & iced coffee' },
      { id: 'def-3-b', text: 'Savory eggs, avocado & fresh juice' },
    ],
  },
];

export function CompatibilityPage() {
  const { code } = useParams<{ code?: string }>();
  if (code) {
    return <CompatibilityDetail code={code} />;
  }
  return <CompatibilityHub />;
}

function CompatibilityHub() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [category, setCategory] = useState<CompatibilityCategory>('best_friends');
  const [title, setTitle] = useState('');
  const [creatorName, setCreatorName] = useState(user?.displayName ?? '');
  const [questions, setQuestions] = useState<CompatibilityQuestion[]>(DEFAULT_QUESTIONS);
  const [creatorAnswers, setCreatorAnswers] = useState<Record<string, string>>({
    'def-1': 'def-1-a',
    'def-2': 'def-2-a',
    'def-3': 'def-3-a',
  });
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['compatibility-sessions'],
    queryFn: () => mockApi.listCompatibilitySessions(),
  });

  const handleGenerateAi = async () => {
    setAiLoading(true);
    try {
      const catLabel =
        COMPATIBILITY_CATEGORIES.find((c) => c.id === category)?.label ?? category;
      const res = await aiClient.generateBattle({
        mode: 'love_friendship',
        subCategory: catLabel,
        topic: aiTopic,
        language,
      });
      if (res.title && !title.trim()) setTitle(res.title);
      if (res.prompts?.length) {
        const nextQuestions: CompatibilityQuestion[] = res.prompts.map((p, idx) => {
          const qId = `ai-cq-${Date.now().toString(36)}-${idx}`;
          const rawOpts = p.options && p.options.length >= 2 ? p.options.slice(0, 4) : ['Option A', 'Option B'];
          return {
            id: qId,
            prompt: p.prompt,
            options: rawOpts.map((text, oIdx) => ({
              id: `${qId}-o${oIdx}`,
              text,
            })),
          };
        });
        setQuestions(nextQuestions);
        const defaultAns: Record<string, string> = {};
        for (const q of nextQuestions) defaultAns[q.id] = q.options[0].id;
        setCreatorAnswers(defaultAns);
      }
      showToast('AI compatibility deck ready!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await mockApi.createCompatibilitySession({
        category,
        title,
        creatorName: creatorName || user?.displayName || 'Player 1',
        questions,
        creatorAnswers,
      });
      await queryClient.invalidateQueries({ queryKey: ['compatibility-sessions'] });
      showToast('Challenge created! Share the link with your partner or bestie.', 'success');
      navigate(`/compatibility/${created.shareCode}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t.modes.compatibilityTitle}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 sm:text-base dark:text-slate-300">
            {t.modes.compatibilitySubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>{showCreate ? t.common.close : 'Start New Sync'}</span>
        </button>
      </div>

      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        {t.modes.compatibilityDisclaimer}
      </p>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-950">
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Optional theme for AI (e.g. travel habits, food debates, weekend plans)..."
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <button
              type="button"
              disabled={aiLoading}
              onClick={() => void handleGenerateAi()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{aiLoading ? t.ai.generating : t.ai.battleGenerateBtn}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Game Mode
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CompatibilityCategory)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {COMPATIBILITY_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekend Bestie Sync"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Your Name
              </label>
              <input
                type="text"
                required
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="Your name"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-950 dark:text-white">
              Lock in your own picks first (your partner/friend will answer separately):
            </h2>
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {idx + 1}. {q.prompt}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const picked = creatorAnswers[q.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setCreatorAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                        }
                        className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                          picked
                            ? 'border-rose-600 bg-rose-50 text-rose-950 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-100'
                            : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            Create & Get Invite Link
          </button>
        </form>
      )}

      {isLoading ? (
        <SkeletonLoader variant="quiz-card" count={3} className="mt-8" />
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {(sessions ?? []).map((s) => (
            <article
              key={s.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {COMPATIBILITY_CATEGORIES.find((c) => c.id === s.category)?.label} ·{' '}
                  {s.questions.length} prompts
                </p>
                <h2 className="mt-2 font-display text-xl font-bold text-slate-950 dark:text-white">
                  {s.title}
                </h2>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                  Started by {s.creatorName}
                  {s.matchPercentage !== null
                    ? ` · Matched ${s.matchPercentage}% with ${s.partnerName}`
                    : ' · Waiting for partner/friend'}
                </p>
              </div>
              <div className="mt-6 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
                <Link
                  to={`/compatibility/${s.shareCode}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                >
                  <span>{s.partnerAnswers ? 'View Comparison' : 'Compare Picks'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function CompatibilityDetail({ code }: { code: string }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [partnerName, setPartnerName] = useState(user?.displayName ?? '');
  const [partnerAnswers, setPartnerAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { data: session, isLoading, isError } = useQuery({
    queryKey: ['compatibility-session', code],
    queryFn: () => mockApi.getCompatibilityByCode(code),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <SkeletonLoader variant="quiz-card" count={1} />
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-base font-semibold">Compatibility session not found.</p>
        <Link to="/compatibility" className="mt-4 inline-block text-sm text-rose-600">
          Back to Love & Friendship
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await mockApi.submitCompatibilityPartner({
        code: session.shareCode,
        partnerName,
        partnerAnswers,
      });
      await queryClient.invalidateQueries({ queryKey: ['compatibility-session', code] });
      await queryClient.invalidateQueries({ queryKey: ['compatibility-sessions'] });
      showToast('Comparison complete!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const shareUrl = `${window.location.origin}/compatibility/${session.shareCode}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {COMPATIBILITY_CATEGORIES.find((c) => c.id === session.category)?.label} · Code{' '}
          {session.shareCode}
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">
          {session.title}
        </h1>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t.modes.compatibilityDisclaimer}
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950">
          <span className="flex-1 truncate font-mono">{shareUrl}</span>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(shareUrl);
              showToast('Invite link copied!', 'success');
            }}
            className="rounded-lg bg-slate-900 px-3 py-1 font-semibold text-white dark:bg-white dark:text-slate-950"
          >
            Copy Invite
          </button>
        </div>
      </div>

      {session.partnerAnswers && session.matchPercentage !== null ? (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <Heart className="mx-auto h-7 w-7 text-rose-600 dark:text-rose-400" />
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
              {session.creatorName} & {session.partnerName}
            </p>
            <p className="font-mono-nums font-display mt-2 text-6xl font-extrabold text-slate-950 dark:text-white">
              {session.matchPercentage}%
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {session.commonCount} out of {session.questions.length} matching vibes!
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
              Side-by-Side Comparison
            </h2>
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {session.questions.map((q) => {
                const cOpt = q.options.find((o) => o.id === session.creatorAnswers[q.id]);
                const pOpt = q.options.find((o) => o.id === session.partnerAnswers?.[q.id]);
                const matched = cOpt?.id && cOpt.id === pOpt?.id;
                return (
                  <div key={q.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {q.prompt}
                      </p>
                      {matched && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Match</span>
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {session.creatorName}: <strong>{cOpt?.text ?? '—'}</strong> ·{' '}
                      {session.partnerName}: <strong>{pOpt?.text ?? '—'}</strong>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {session.creatorName}’s answers stay hidden until you submit yours.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Your Name
            </label>
            <input
              type="text"
              required
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Enter your name"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="space-y-4">
            {session.questions.map((q, idx) => (
              <div key={q.id} className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  {idx + 1}. {q.prompt}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const selected = partnerAnswers[q.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setPartnerAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                        }
                        className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                          selected
                            ? 'border-rose-600 bg-rose-50 text-rose-950 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-100'
                            : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            Reveal Compatibility Match
          </button>
        </form>
      )}
    </div>
  );
}
