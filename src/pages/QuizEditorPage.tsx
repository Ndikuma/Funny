import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Eye, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { QUIZ_THEMES } from '../data/seedData';
import { aiClient } from '../services/aiClient';
import { mockApi, validateQuizInput } from '../services/mockApi';
import type { Question, QuestionTemplate, Quiz, QuizTheme, QuizVisibility } from '../types/vibebattle';

function makeEmptyQuestion(index: number): Question {
  const qId = `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const optA = `${qId}-a`;
  const optB = `${qId}-b`;
  const optC = `${qId}-c`;
  return {
    id: qId,
    prompt: index === 0 ? '' : '',
    options: [
      { id: optA, text: '' },
      { id: optB, text: '' },
      { id: optC, text: '' },
    ],
    correctOptionId: optA,
  };
}

export function QuizEditorPage() {
  const { id: editQuizId } = useParams<{ id: string }>();
  const isEditing = Boolean(editQuizId);
  const { user, login } = useAuth();
  const { t, language } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Quiz['category']>('friendship');
  const [theme, setTheme] = useState<QuizTheme>('coral');
  const [visibility, setVisibility] = useState<QuizVisibility>('public');
  const [questions, setQuestions] = useState<Question[]>(() => [
    makeEmptyQuestion(0),
    makeEmptyQuestion(1),
    makeEmptyQuestion(2),
    makeEmptyQuestion(3),
    makeEmptyQuestion(4),
  ]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadedEdit, setLoadedEdit] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiGenerating, setAiGenerating] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['question-templates'],
    queryFn: () => mockApi.listTemplates(),
  });

  useEffect(() => {
    if (!editQuizId || loadedEdit || !user) return;
    mockApi
      .getQuizForEdit(editQuizId)
      .then((quiz) => {
        setTitle(quiz.title);
        setDescription(quiz.description);
        setCategory(quiz.category);
        setTheme(quiz.theme);
        setVisibility(quiz.visibility);
        setQuestions(quiz.questions);
        setLoadedEdit(true);
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
        navigate('/my-quizzes');
      });
  }, [editQuizId, loadedEdit, user, navigate, showToast, t.common.errorGeneric]);

  const applyTemplate = (tpl: QuestionTemplate) => {
    if (questions.length >= 20) {
      showToast(t.create.validationMaxQuestions, 'error');
      return;
    }
    const qId = `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const opts = tpl.suggestedOptions[language].slice(0, 4).map((text, idx) => ({
      id: `${qId}-o${idx}`,
      text,
    }));
    const newQ: Question = {
      id: qId,
      prompt: tpl.prompt[language],
      options: opts,
      correctOptionId: opts[0].id,
    };

    // Replace first completely blank question if present, else append
    const blankIdx = questions.findIndex(
      (q) => !q.prompt.trim() && q.options.every((o) => !o.text.trim())
    );
    if (blankIdx !== -1) {
      const next = [...questions];
      next[blankIdx] = newQ;
      setQuestions(next);
    } else {
      setQuestions((prev) => [...prev, newQ]);
    }
  };

  const addCustomQuestion = () => {
    if (questions.length >= 20) {
      showToast(t.create.validationMaxQuestions, 'error');
      return;
    }
    setQuestions((prev) => [...prev, makeEmptyQuestion(prev.length)]);
  };

  const removeQuestion = (qId: string) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const updateQuestionPrompt = (qId: string, prompt: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, prompt } : q)));
  };

  const updateOptionText = (qId: string, optId: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((o) => (o.id === optId ? { ...o, text } : o)),
            }
          : q
      )
    );
  };

  const setCorrectOption = (qId: string, optId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, correctOptionId: optId } : q))
    );
  };

  const addOptionToQuestion = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || q.options.length >= 4) return q;
        const optId = `${q.id}-o${Date.now().toString(36).slice(-3)}`;
        return { ...q, options: [...q.options, { id: optId, text: '' }] };
      })
    );
  };

  const removeOptionFromQuestion = (qId: string, optId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId || q.options.length <= 2) return q;
        const filtered = q.options.filter((o) => o.id !== optId);
        const nextCorrect =
          q.correctOptionId === optId ? filtered[0].id : q.correctOptionId;
        return { ...q, options: filtered, correctOptionId: nextCorrect };
      })
    );
  };

  const handleSave = async (publish: boolean) => {
    setErrorMsg(null);
    const payload = {
      title,
      description,
      category,
      theme,
      visibility,
      isPublished: publish,
      questions,
    };

    const validationError = validateQuizInput(payload);
    if (validationError) {
      setErrorMsg(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!user) {
      setErrorMsg('Please sign in below (or use 1-click Demo Player) to publish your quiz.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    try {
      const saved =
        isEditing && editQuizId
          ? await mockApi.updateQuiz(editQuizId, payload)
          : await mockApi.createQuiz(payload);
      await queryClient.invalidateQueries({ queryKey: ['public-quizzes'] });
      await queryClient.invalidateQueries({ queryKey: ['my-quizzes'] });
      showToast(
        publish ? `Published! Code: ${saved.shareCode}` : 'Draft saved!',
        'success'
      );
      navigate(publish ? `/my-quizzes?share=${saved.shareCode}` : '/my-quizzes');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateWithAi = async () => {
    setErrorMsg(null);
    setAiGenerating(true);
    try {
      const generated = await aiClient.generateQuiz({
        topic: aiTopic,
        category,
        questionCount: aiCount,
        language,
      });

      if (generated.suggestedTitle && !title.trim()) {
        setTitle(generated.suggestedTitle.slice(0, 90));
      }
      if (generated.suggestedDescription && !description.trim()) {
        setDescription(generated.suggestedDescription.slice(0, 240));
      }

      const mapped: Question[] = (generated.questions ?? []).slice(0, 20).map((gq, qIdx) => {
        const qId = `ai-${Date.now().toString(36)}-${qIdx}`;
        const rawOpts = (gq.options ?? []).filter((o) => o && o.trim()).slice(0, 4);
        const paddedOpts =
          rawOpts.length >= 2 ? rawOpts : ['Option A', 'Option B', 'Option C'];
        const options = paddedOpts.map((text, oIdx) => ({
          id: `${qId}-o${oIdx}`,
          text: text.trim(),
        }));
        const safeCorrectIdx =
          typeof gq.correctIndex === 'number' &&
          gq.correctIndex >= 0 &&
          gq.correctIndex < options.length
            ? gq.correctIndex
            : 0;
        return {
          id: qId,
          prompt: gq.prompt.trim(),
          options,
          correctOptionId: options[safeCorrectIdx].id,
        };
      });

      if (mapped.length >= 5) {
        setQuestions(mapped);
        showToast(`Generated ${mapped.length} questions with AI!`, 'success');
      } else if (mapped.length > 0) {
        setQuestions((prev) => [...mapped, ...prev].slice(0, 20));
        showToast(`Added ${mapped.length} AI questions.`, 'success');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.common.errorGeneric;
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  const activeTheme = QUIZ_THEMES.find((th) => th.id === theme) ?? QUIZ_THEMES[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {isEditing ? t.create.editTitle : t.create.pageTitle}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 sm:text-base dark:text-slate-300">
            {t.create.pageSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <Eye className="h-4 w-4" />
            <span>{t.create.previewBtn}</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave(false)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {t.create.saveDraftBtn}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave(true)}
            className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {isEditing ? t.create.updateBtn : t.create.publishBtn}
          </button>
        </div>
      </div>

      {!user && (
        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center dark:border-amber-900/60 dark:bg-amber-950/30">
          <p className="text-sm text-amber-950 dark:text-amber-200">
            Sign in or activate the demo account to save and publish your quiz link.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void login('maya@vibebattle.app', 'demo1234')}
              className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
            >
              {t.auth.demoUserBtn}
            </button>
            <Link
              to="/login?redirect=/create"
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {t.nav.signIn}
            </Link>
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-sm font-medium text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
        >
          {errorMsg}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Quiz Settings & Templates */}
        <div className="space-y-6 lg:col-span-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
              {t.create.detailsHeading}
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="quiz-title"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {t.create.titleLabel}
                </label>
                <input
                  id="quiz-title"
                  type="text"
                  maxLength={90}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.create.titlePlaceholder}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="quiz-desc"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {t.create.descLabel}
                </label>
                <textarea
                  id="quiz-desc"
                  rows={3}
                  maxLength={240}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.create.descPlaceholder}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="quiz-category"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {t.create.categoryLabel}
                  </label>
                  <select
                    id="quiz-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Quiz['category'])}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="friendship">{t.explore.friendship}</option>
                    <option value="couple">{t.explore.couple}</option>
                    <option value="personality">{t.explore.personality}</option>
                    <option value="fun">{t.explore.fun}</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="quiz-visibility"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {t.create.visibilityLabel}
                  </label>
                  <select
                    id="quiz-visibility"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as QuizVisibility)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="public">{t.create.visPublic}</option>
                    <option value="unlisted">{t.create.visUnlisted}</option>
                    <option value="private">{t.create.visPrivate}</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.create.themeLabel}
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {QUIZ_THEMES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTheme(item.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                        theme === item.id
                          ? 'border-slate-950 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full ${item.accentBg}`} />
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* AI Quiz Writer */}
          <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 dark:border-rose-900/50 dark:bg-rose-950/20">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-950 dark:text-white">
              <Sparkles className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span>{t.ai.quizGeneratorTitle}</span>
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {t.ai.quizGeneratorHint}
            </p>
            <textarea
              rows={2}
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder={t.ai.topicPlaceholder}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <span>Questions</span>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                </select>
              </label>
              <button
                type="button"
                disabled={aiGenerating}
                onClick={() => void handleGenerateWithAi()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60 whitespace-nowrap"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{aiGenerating ? t.ai.generating : t.ai.generateBtn}</span>
              </button>
            </div>
          </section>

          {/* Predefined Question Templates */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
              {t.create.templatesHeading}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t.create.templatesHint}
            </p>
            <div className="mt-4 space-y-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left text-xs font-medium text-slate-800 transition-colors hover:border-rose-300 hover:bg-rose-50/60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-rose-800 dark:hover:bg-rose-950/20"
                >
                  <span>{tpl.prompt[language]}</span>
                  <Plus className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Questions Builder */}
        <div className="space-y-5 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
              {t.create.questionsHeading}{' '}
              <span className="font-mono-nums text-sm font-medium text-slate-500 dark:text-slate-400">
                ({questions.length}/20 · min 5)
              </span>
            </h2>
            <button
              type="button"
              onClick={addCustomQuestion}
              disabled={questions.length >= 20}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.create.addCustomQuestion}</span>
            </button>
          </div>

          {questions.map((question, qIndex) => (
            <div
              key={question.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-4">
                <span className={`text-xs font-bold ${activeTheme.accentText}`}>
                  Question {String(qIndex + 1).padStart(2, '0')}
                </span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(question.id)}
                    aria-label={t.create.removeQuestion}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t.create.removeQuestion}</span>
                  </button>
                )}
              </div>

              <input
                type="text"
                value={question.prompt}
                onChange={(e) => updateQuestionPrompt(question.id, e.target.value)}
                placeholder={t.create.questionPlaceholder}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 placeholder:font-normal placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-950"
              />

              <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.create.correctAnswerHint}
              </p>

              <div className="mt-2 space-y-2.5">
                {question.options.map((opt, optIdx) => {
                  const isCorrect = question.correctOptionId === opt.id;
                  return (
                    <div key={opt.id} className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setCorrectOption(question.id, opt.id)}
                        aria-label={`Mark option ${optIdx + 1} as correct answer`}
                        aria-pressed={isCorrect}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold transition-colors ${
                          isCorrect
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400'
                        }`}
                      >
                        {isCorrect ? <Check className="h-4 w-4" /> : optIdx + 1}
                      </button>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) =>
                          updateOptionText(question.id, opt.id, e.target.value)
                        }
                        placeholder={`${t.create.optionPlaceholder} ${optIdx + 1}`}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      />

                      {question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOptionFromQuestion(question.id, opt.id)}
                          aria-label="Remove option"
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {question.options.length < 4 && (
                <button
                  type="button"
                  onClick={() => addOptionToQuestion(question.id)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.create.addOption}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h2
                id="preview-title"
                className="font-display text-lg font-bold text-slate-950 dark:text-white"
              >
                {t.create.previewModalTitle}
              </h2>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t.create.previewClose}
              </button>
            </div>

            <div className={`mt-4 rounded-xl border p-4 ${activeTheme.softBg} ${activeTheme.border}`}>
              <p className={`text-xs font-semibold capitalize ${activeTheme.accentText}`}>
                {category} · {questions.length} questions
              </p>
              <h3 className="mt-1 font-display text-xl font-bold text-slate-950 dark:text-white">
                {title || 'Untitled Quiz'}
              </h3>
              {description && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {description}
                </p>
              )}
            </div>

            <ol className="mt-5 space-y-4">
              {questions.map((q, idx) => (
                <li
                  key={q.id}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {idx + 1}. {q.prompt || '(Empty question)'}
                  </p>
                  <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {q.options.map((o) => (
                      <li
                        key={o.id}
                        className={`rounded-lg border px-3 py-1.5 text-xs ${
                          o.id === q.correctOptionId
                            ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
                            : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {o.text || '(Empty option)'}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
