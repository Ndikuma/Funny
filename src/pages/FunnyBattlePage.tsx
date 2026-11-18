import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Flag, Plus, Sparkles, Trophy, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { aiClient } from '../services/aiClient';
import { mockApi } from '../services/mockApi';
import { ShareSheet } from '../components/common/ShareSheet';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

export function FunnyBattlePage() {
  const { code } = useParams<{ code?: string }>();
  if (code) {
    return <FunnyBattleDetail code={code} />;
  }
  return <FunnyBattleHub />;
}

function FunnyBattleHub() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [nomineesText, setNomineesText] = useState('Maya, Théo, Aline, Sam');
  const [prompts, setPrompts] = useState<string[]>([
    'Who is the funniest in the group?',
    'Who always arrives late?',
    'Who would survive on a desert island?',
  ]);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const { data: battles, isLoading } = useQuery({
    queryKey: ['funny-battles'],
    queryFn: () => mockApi.listFunnyBattles(),
  });

  const handleGenerateAi = async () => {
    setAiLoading(true);
    try {
      const res = await aiClient.generateBattle({
        mode: 'funny_battle',
        topic: aiTopic,
        language,
      });
      if (res.title && !title.trim()) setTitle(res.title);
      if (res.prompts?.length) {
        setPrompts(res.prompts.map((p) => p.prompt));
      }
      showToast('AI prompts generated!', 'success');
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
      const nominees = nomineesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const created = await mockApi.createFunnyBattle({
        title,
        nominees,
        prompts,
        creatorName: user?.displayName,
      });
      await queryClient.invalidateQueries({ queryKey: ['funny-battles'] });
      showToast('Funny Battle created!', 'success');
      navigate(`/battles/${created.shareCode}`);
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
            {t.modes.battlesTitle}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 sm:text-base dark:text-slate-300">
            {t.modes.battlesSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>{showCreate ? t.common.close : 'Create Funny Battle'}</span>
        </button>
      </div>

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
              placeholder="Optional group vibe for AI (e.g. college roommates, soccer squad)..."
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Battle Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekend Squad Awards"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Friend Nominees (comma-separated)
              </label>
              <input
                type="text"
                required
                value={nomineesText}
                onChange={(e) => setNomineesText(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Voting Prompts ({prompts.length})
              </span>
              <button
                type="button"
                onClick={() => setPrompts((prev) => [...prev, ''])}
                className="text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400"
              >
                + Add Prompt
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {prompts.map((p, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={p}
                  onChange={(e) =>
                    setPrompts((prev) =>
                      prev.map((item, i) => (i === idx ? e.target.value : item))
                    )
                  }
                  placeholder={`Prompt ${idx + 1} (e.g. Who talks the most?)`}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            Publish Funny Battle
          </button>
        </form>
      )}

      {isLoading ? (
        <SkeletonLoader variant="quiz-card" count={3} className="mt-8" />
      ) : !battles || battles.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">No battles yet.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {battles.map((b) => (
            <article
              key={b.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {b.prompts.length} prompts · {b.nominees.length} nominees ·{' '}
                  <span className="font-mono-nums">{b.votes.length}</span> votes
                </p>
                <h2 className="mt-2 font-display text-xl font-bold text-slate-950 dark:text-white">
                  {b.title}
                </h2>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  Nominees: {b.nominees.join(', ')}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  by {b.creatorName}
                </span>
                <Link
                  to={`/battles/${b.shareCode}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                >
                  <span>Vote Now</span>
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

function FunnyBattleDetail({ code }: { code: string }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [voterName, setVoterName] = useState(user?.displayName ?? '');
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { data: battle, isLoading, isError } = useQuery({
    queryKey: ['funny-battle', code],
    queryFn: () => mockApi.getFunnyBattleByCode(code),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <SkeletonLoader variant="quiz-card" count={1} />
      </div>
    );
  }

  if (isError || !battle) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
          Battle not found.
        </p>
        <Link to="/battles" className="mt-4 inline-block text-sm font-semibold text-rose-600">
          Back to Funny Battle
        </Link>
      </div>
    );
  }

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await mockApi.submitFunnyBattleVotes({
        code: battle.shareCode,
        voterName,
        selections,
      });
      await queryClient.invalidateQueries({ queryKey: ['funny-battle', code] });
      await queryClient.invalidateQueries({ queryKey: ['funny-battles'] });
      showToast('Votes recorded!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    await mockApi.submitReport({
      quizId: battle.id,
      reason: 'Harassment / offensive prompt',
      details: `Reported Funny Battle ${battle.shareCode}`,
    });
    showToast(t.play.reportThanks, 'success');
  };

  // Overall nominee tally
  const totalTally = new Map<string, number>();
  for (const n of battle.nominees) totalTally.set(n, 0);
  for (const v of battle.votes) {
    totalTally.set(v.nominee, (totalTally.get(v.nominee) ?? 0) + 1);
  }
  const rankedNominees = [...totalTally.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Funny Battle · Code {battle.shareCode} · by {battle.creatorName}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-slate-950 dark:text-white">
            {battle.title}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void handleReport()}
          className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400"
        >
          <Flag className="h-3.5 w-3.5" />
          <span>Report</span>
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleVoteSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Your Nickname
            </label>
            <input
              type="text"
              required
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              placeholder="e.g. Alex"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="space-y-5">
            {battle.prompts.map((p, idx) => (
              <div key={p.id} className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-950 dark:text-white">
                  {idx + 1}. {p.prompt}
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {battle.nominees.map((nominee) => {
                    const selected = selections[p.id] === nominee;
                    const count = battle.votes.filter(
                      (v) => v.promptId === p.id && v.nominee === nominee
                    ).length;
                    return (
                      <button
                        key={nominee}
                        type="button"
                        onClick={() =>
                          setSelections((prev) => ({ ...prev, [p.id]: nominee }))
                        }
                        className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                          selected
                            ? 'border-rose-600 bg-rose-50 text-rose-950 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-100'
                            : 'border-slate-200 text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{nominee}</span>
                        <span className="font-mono-nums text-slate-500 dark:text-slate-400">
                          {count}
                        </span>
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
            Submit My Votes
          </button>
        </form>

        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-950 dark:text-white">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>Overall Squad Standings</span>
            </h2>
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {rankedNominees.map(([nominee, count], idx) => (
                <li key={nominee} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    <span className="font-mono-nums mr-2 text-xs text-slate-400">
                      #{idx + 1}
                    </span>
                    {nominee}
                  </span>
                  <span className="font-mono-nums font-bold text-slate-700 dark:text-slate-300">
                    {count} votes
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <ShareSheet shareCode={battle.shareCode} quizTitle={battle.title} />
          <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Users className="h-3.5 w-3.5" />
            <span>Share the link `/battles/{battle.shareCode}` with your group.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
