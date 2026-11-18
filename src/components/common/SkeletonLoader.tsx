import { QuizCardSkeleton } from './QuizCardSkeleton';

export type SkeletonVariant = 'quiz-card' | 'quiz-list' | 'stat-card';

interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-slate-200 dark:bg-slate-800 ${className}`}
    />
  );
}

export { QuizCardSkeleton as SkeletonQuizCard } from './QuizCardSkeleton';

export function SkeletonQuizListRow() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-between gap-3 py-3.5"
    >
      <div className="min-w-0 flex-1">
        <SkeletonBlock className="h-4 w-3/5" />
        <SkeletonBlock className="mt-2 h-3 w-2/5 bg-slate-100 dark:bg-slate-800/70" />
      </div>
      <SkeletonBlock className="h-7 w-16 shrink-0 rounded-lg" />
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <SkeletonBlock className="h-3 w-24 bg-slate-100 dark:bg-slate-800/70" />
      <SkeletonBlock className="mt-3 h-8 w-16" />
    </div>
  );
}

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
  label?: string;
}

export function SkeletonLoader({
  variant = 'quiz-card',
  count = 3,
  className = '',
  label = 'Loading content...',
}: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, idx) => idx);

  if (variant === 'quiz-list') {
    return (
      <div role="status" aria-label={label} className={`divide-y divide-slate-100 dark:divide-slate-800 ${className}`}>
        <span className="sr-only">{label}</span>
        {items.map((idx) => (
          <SkeletonQuizListRow key={idx} />
        ))}
      </div>
    );
  }

  if (variant === 'stat-card') {
    return (
      <div
        role="status"
        aria-label={label}
        className={`grid grid-cols-2 gap-4 lg:grid-cols-4 ${className}`}
      >
        <span className="sr-only">{label}</span>
        {items.map((idx) => (
          <SkeletonStatCard key={idx} />
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={label}
      className={`grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 ${className}`}
    >
      <span className="sr-only">{label}</span>
      {items.map((idx) => (
        <QuizCardSkeleton key={idx} />
      ))}
    </div>
  );
}
