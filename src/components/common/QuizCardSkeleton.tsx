interface QuizCardSkeletonProps {
  className?: string;
  showDescription?: boolean;
}

export function QuizCardSkeleton({
  className = '',
  showDescription = true,
}: QuizCardSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex animate-pulse flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div>
        {/* Metadata row (category · question count · play count) */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800/70" />
          <div className="h-3 w-14 rounded bg-slate-100 dark:bg-slate-800/70" />
        </div>

        {/* Quiz title */}
        <div className="mt-3 h-6 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />

        {/* Description lines */}
        {showDescription && (
          <div className="mt-3 space-y-2">
            <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800/70" />
            <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800/70" />
          </div>
        )}
      </div>

      {/* Footer: creator label & action button area */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="h-3.5 w-24 rounded bg-slate-100 dark:bg-slate-800/70" />
        <div className="h-8 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
