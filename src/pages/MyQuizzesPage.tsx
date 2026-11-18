import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, ExternalLink, Plus, Share2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { mockApi } from '../services/mockApi';
import type { Quiz } from '../types/vibebattle';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { ShareSheet } from '../components/common/ShareSheet';
import { SkeletonCard } from '../components/common/SkeletonCard';

export function MyQuizzesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [shareQuiz, setShareQuiz] = useState<{ code: string; title: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null);

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['my-quizzes', user?.id],
    queryFn: () => mockApi.listMyQuizzes(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    const shareParam = searchParams.get('share');
    if (shareParam && quizzes) {
      const found = quizzes.find((q) => q.shareCode === shareParam);
      if (found) {
        setShareQuiz({ code: found.shareCode, title: found.title });
      }
    }
  }, [searchParams, quizzes]);

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
            {t.auth.loginTitle}
          </h1>
          <Link
            to="/login?redirect=/my-quizzes"
            className="mt-5 inline-flex rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t.nav.signIn}
          </Link>
        </div>
      </div>
    );
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await mockApi.deleteQuiz(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ['my-quizzes'] });
      await queryClient.invalidateQueries({ queryKey: ['public-quizzes'] });
      showToast('Quiz deleted.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {t.myQuizzes.title}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 sm:text-base dark:text-slate-300">
            {t.myQuizzes.subtitle}
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>{t.myQuizzes.createBtn}</span>
        </Link>
      </div>

      {shareQuiz && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Ready to share: {shareQuiz.title}
            </span>
            <button
              type="button"
              onClick={() => {
                setShareQuiz(null);
                setSearchParams({});
              }}
              className="text-xs text-slate-500 hover:underline dark:text-slate-400"
            >
              {t.common.close}
            </button>
          </div>
          <ShareSheet shareCode={shareQuiz.code} quizTitle={shareQuiz.title} />
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !quizzes || quizzes.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
            {t.myQuizzes.emptyTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t.myQuizzes.emptyDesc}
          </p>
          <Link
            to="/create"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
          >
            <Plus className="h-4 w-4" />
            <span>{t.myQuizzes.createBtn}</span>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <article
              key={quiz.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span
                    className={`font-semibold ${
                      quiz.isPublished
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {quiz.isPublished ? t.myQuizzes.published : t.myQuizzes.draft}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{quiz.visibility}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {quiz.questions.length} {t.explore.questionsLabel}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {quiz.playCount} {t.explore.playsLabel}
                  </span>
                </div>

                <h2 className="mt-2 font-display text-xl font-bold text-slate-950 dark:text-white">
                  {quiz.title}
                </h2>
                {quiz.description && (
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                    {quiz.description}
                  </p>
                )}
                <p className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                  /q/{quiz.shareCode}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <Link
                  to={`/quiz/${quiz.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>{t.myQuizzes.edit}</span>
                </Link>

                {quiz.isPublished && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setShareQuiz({ code: quiz.shareCode, title: quiz.title })
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>{t.myQuizzes.share}</span>
                    </button>
                    <Link
                      to={`/q/${quiz.shareCode}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>{t.myQuizzes.play}</span>
                    </Link>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setDeleteTarget(quiz)}
                  className="ml-auto inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{t.myQuizzes.delete}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={t.myQuizzes.confirmDeleteTitle}
        description={t.myQuizzes.confirmDeleteDesc}
        confirmLabel={t.myQuizzes.confirmDeleteBtn}
        cancelLabel={t.myQuizzes.cancelBtn}
        destructive
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
