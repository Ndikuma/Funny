import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { aiClient, type ModerationAdvice } from '../services/aiClient';
import { mockApi } from '../services/mockApi';
import type { Quiz, Report } from '../types/vibebattle';
import { SkeletonCard } from '../components/common/SkeletonCard';

type AdminTab = 'overview' | 'users' | 'quizzes' | 'reports' | 'templates';

export function AdminPage() {
  const { user, login } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [tplCategory, setTplCategory] = useState<Quiz['category']>('personality');
  const [tplEn, setTplEn] = useState('');
  const [tplFr, setTplFr] = useState('');
  const [tplRn, setTplRn] = useState('');
  const [aiAdviceMap, setAiAdviceMap] = useState<Record<string, ModerationAdvice>>({});
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-snapshot', user?.id],
    queryFn: () => mockApi.getAdminSnapshot(),
    enabled: Boolean(user && user.role === 'admin'),
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
            Administrator access required
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Sign in with the demo administrator account to inspect moderation queues and platform metrics.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => void login('admin@vibebattle.app', 'admin1234')}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
            >
              {t.auth.demoAdminBtn}
            </button>
            <Link
              to="/"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              {t.common.back}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const refreshAdmin = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-snapshot'] });
    await queryClient.invalidateQueries({ queryKey: ['public-quizzes'] });
    await queryClient.invalidateQueries({ queryKey: ['question-templates'] });
  };

  const handleToggleUser = async (userId: string) => {
    try {
      await mockApi.adminToggleUserActive(userId);
      await refreshAdmin();
      showToast('User status updated.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    }
  };

  const handleModerateQuiz = async (
    quizId: string,
    action: 'toggle_hide' | 'toggle_feature'
  ) => {
    try {
      await mockApi.adminModerateQuiz(quizId, action);
      await refreshAdmin();
      showToast('Quiz updated.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    }
  };

  const handleReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      await mockApi.adminResolveReport(reportId, status);
      await refreshAdmin();
      showToast(`Report ${status}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    }
  };

  const handleAiModeration = async (rep: Report) => {
    setAiLoadingId(rep.id);
    try {
      const matchedQuiz = data?.quizzes.find((q) => q.id === rep.quizId);
      const advice = await aiClient.moderateReport({
        quizTitle: rep.quizTitle,
        quizDescription: matchedQuiz?.description ?? '',
        reason: rep.reason,
        details: rep.details,
      });
      setAiAdviceMap((prev) => ({ ...prev, [rep.id]: advice }));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    } finally {
      setAiLoadingId(null);
    }
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mockApi.adminAddTemplate({
        category: tplCategory,
        promptEn: tplEn,
        promptFr: tplFr,
        promptRn: tplRn,
      });
      setTplEn('');
      setTplFr('');
      setTplRn('');
      await refreshAdmin();
      showToast('Template added.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    }
  };

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: t.admin.tabOverview },
    { id: 'users', label: t.admin.tabUsers },
    { id: 'quizzes', label: t.admin.tabQuizzes },
    { id: 'reports', label: t.admin.tabReports },
    { id: 'templates', label: t.admin.tabTemplates },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          {t.admin.title}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 sm:text-base dark:text-slate-300">
          {t.admin.subtitle}
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-label="Admin sections"
        className="mt-6 inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              tab === item.id
                ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading || !data ? (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="mt-8">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.admin.totalUsers}
                  </p>
                  <p className="font-mono-nums mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                    {data.users.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.admin.totalQuizzes}
                  </p>
                  <p className="font-mono-nums mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                    {data.quizzes.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.admin.totalAttempts}
                  </p>
                  <p className="font-mono-nums mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                    {data.totalAttempts}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.admin.openReports}
                  </p>
                  <p className="font-mono-nums mt-2 text-3xl font-bold text-rose-600 dark:text-rose-400">
                    {data.reports.filter((r) => r.status === 'open').length}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                  {t.admin.auditLog}
                </h2>
                <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                  {data.moderationLog.slice(0, 8).map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-col justify-between gap-1 py-3 text-sm sm:flex-row sm:items-center"
                    >
                      <span className="text-slate-800 dark:text-slate-200">
                        <strong className="font-mono text-xs">{entry.actionType}</strong> —{' '}
                        {entry.note}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        @{entry.adminUsername}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white">
                        {u.displayName} (@{u.username})
                      </td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                        {u.email}
                      </td>
                      <td className="py-3 pr-4 capitalize text-slate-600 dark:text-slate-300">
                        {u.role}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`text-xs font-semibold ${
                            u.isActive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {u.id !== user.id && (
                          <button
                            type="button"
                            onClick={() => void handleToggleUser(u.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                          >
                            {t.admin.toggleActive}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'quizzes' && (
            <div className="space-y-3">
              {data.quizzes.map((q) => (
                <div
                  key={q.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      @{q.creatorUsername} · Code {q.shareCode} · {q.playCount} plays ·{' '}
                      {q.isHiddenByModeration ? 'Hidden' : 'Visible'}
                    </p>
                    <h3 className="mt-1 font-display text-base font-bold text-slate-950 dark:text-white">
                      {q.title}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleModerateQuiz(q.id, 'toggle_feature')}
                      className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                    >
                      {q.isFeatured ? t.admin.unfeatureQuiz : t.admin.featureQuiz}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleModerateQuiz(q.id, 'toggle_hide')}
                      className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-950"
                    >
                      {q.isHiddenByModeration ? t.admin.unhideQuiz : t.admin.hideQuiz}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'reports' && (
            <div className="space-y-3">
              {data.reports.map((rep) => {
                const advice = aiAdviceMap[rep.id];
                return (
                  <div
                    key={rep.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Status: <strong className="capitalize">{rep.status}</strong> · Quiz{' '}
                          {rep.quizShareCode} · Reporter: {rep.reporterLabel}
                        </p>
                        <h3 className="mt-1 text-sm font-bold text-slate-950 dark:text-white">
                          {rep.quizTitle} — {rep.reason}
                        </h3>
                        {rep.details && (
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            {rep.details}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={aiLoadingId === rep.id}
                          onClick={() => void handleAiModeration(rep)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>
                            {aiLoadingId === rep.id
                              ? t.ai.generating
                              : t.ai.moderationCheckBtn}
                          </span>
                        </button>
                        {rep.status === 'open' && (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleReport(rep.id, 'resolved')}
                              className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              {t.admin.resolve}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleReport(rep.id, 'dismissed')}
                              className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                            >
                              {t.admin.dismiss}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {advice && (
                      <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-xs dark:border-rose-900/50 dark:bg-rose-950/20">
                        <span className="font-bold uppercase text-rose-600 dark:text-rose-400">
                          AI Recommendation: {advice.recommendation}
                        </span>
                        <p className="mt-1 text-slate-700 dark:text-slate-300">
                          {advice.summary}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'templates' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <form
                onSubmit={handleAddTemplate}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                  {t.admin.addTemplate}
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t.create.categoryLabel}
                  </label>
                  <select
                    value={tplCategory}
                    onChange={(e) => setTplCategory(e.target.value as Quiz['category'])}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="friendship">{t.explore.friendship}</option>
                    <option value="couple">{t.explore.couple}</option>
                    <option value="personality">{t.explore.personality}</option>
                    <option value="fun">{t.explore.fun}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t.admin.templatePromptEn}
                  </label>
                  <input
                    type="text"
                    required
                    value={tplEn}
                    onChange={(e) => setTplEn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t.admin.templatePromptFr}
                  </label>
                  <input
                    type="text"
                    value={tplFr}
                    onChange={(e) => setTplFr(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t.admin.templatePromptRn}
                  </label>
                  <input
                    type="text"
                    value={tplRn}
                    onChange={(e) => setTplRn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  {t.admin.addTemplate}
                </button>
              </form>

              <div className="space-y-3 lg:col-span-7">
                {data.templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <p className="text-xs font-semibold capitalize text-rose-600 dark:text-rose-400">
                      {tpl.category}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                      EN: {tpl.prompt.en}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                      FR: {tpl.prompt.fr}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                      RN: {tpl.prompt.rn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
