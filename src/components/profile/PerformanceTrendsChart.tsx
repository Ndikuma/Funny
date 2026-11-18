import { Link } from 'react-router-dom';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { PerformanceTrendPoint } from '../../types/vibebattle';

interface PerformanceTrendsChartProps {
  points: PerformanceTrendPoint[];
  weeklyXpTotal: number;
  averageAccuracy: number | null;
  quizzesThisWeek: number;
  isLoading?: boolean;
}

interface CustomTooltipPayloadItem {
  dataKey?: string;
  name?: string;
  value?: number | null;
  color?: string;
  payload?: PerformanceTrendPoint;
}

function TrendTooltip({
  active,
  payload,
  weeklyXpLabel,
  accuracyLabel,
}: {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  weeklyXpLabel: string;
  accuracyLabel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold text-slate-950 dark:text-white">
        {point.day} · {point.dateKey}
      </p>
      <div className="mt-1.5 space-y-1">
        <p className="flex items-center justify-between gap-4 text-slate-700 dark:text-slate-300">
          <span className="font-medium text-rose-600 dark:text-rose-400">{weeklyXpLabel}</span>
          <span className="font-mono-nums font-bold text-slate-950 dark:text-white">
            {point.xpEarned} XP
          </span>
        </p>
        <p className="flex items-center justify-between gap-4 text-slate-700 dark:text-slate-300">
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {accuracyLabel}
          </span>
          <span className="font-mono-nums font-bold text-slate-950 dark:text-white">
            {point.accuracy !== null ? `${point.accuracy}%` : '—'}
          </span>
        </p>
      </div>
    </div>
  );
}

export function PerformanceTrendsChart({
  points,
  weeklyXpTotal,
  averageAccuracy,
  quizzesThisWeek,
  isLoading = false,
}: PerformanceTrendsChartProps) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const gridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const axisTickColor = isDark ? '#94A3B8' : '#64748B';
  const xpStroke = isDark ? '#FB7185' : '#E11D48';
  const accuracyStroke = isDark ? '#34D399' : '#059669';

  const hasActivity = weeklyXpTotal > 0 || quizzesThisWeek > 0;

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
            {t.profile.trendsHeading}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t.profile.trendsSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.profile.weeklyXpLabel}
            </p>
            <p className="font-mono-nums mt-0.5 text-xl font-bold text-rose-600 dark:text-rose-400">
              +{weeklyXpTotal} XP
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.profile.accuracyLabel}
            </p>
            <p className="font-mono-nums mt-0.5 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {averageAccuracy !== null ? `${averageAccuracy}%` : '—'}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div
          aria-busy="true"
          aria-label={t.common.loading}
          className="mt-5 h-64 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
        />
      ) : !hasActivity ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-950">
          <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">
            {t.profile.trendsEmptyTitle}
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-600 dark:text-slate-400">
            {t.profile.trendsEmptyDesc}
          </p>
          <Link
            to="/explore"
            className="mt-4 inline-flex items-center rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 whitespace-nowrap"
          >
            {t.profile.exploreQuizzesBtn}
          </Link>
        </div>
      ) : (
        <div className="mt-5 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={points}
              margin={{ top: 10, right: 12, left: -12, bottom: 4 }}
            >
              <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: axisTickColor, fontSize: 12 }}
                axisLine={{ stroke: gridStroke }}
                tickLine={false}
              />
              <YAxis
                yAxisId="xp"
                orientation="left"
                allowDecimals={false}
                tick={{ fill: axisTickColor, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="accuracy"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
                tick={{ fill: axisTickColor, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={
                  <TrendTooltip
                    weeklyXpLabel={t.profile.weeklyXpLabel}
                    accuracyLabel={t.profile.accuracyLabel}
                  />
                }
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                iconType="circle"
              />
              <Line
                yAxisId="xp"
                type="monotone"
                dataKey="xpEarned"
                name={t.profile.weeklyXpLabel}
                stroke={xpStroke}
                strokeWidth={2.5}
                dot={{ r: 4, fill: xpStroke, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                isAnimationActive={!prefersReducedMotion}
              />
              <Line
                yAxisId="accuracy"
                type="monotone"
                dataKey="accuracy"
                name={t.profile.accuracyLabel}
                stroke={accuracyStroke}
                strokeWidth={2.5}
                connectNulls
                dot={{ r: 4, fill: accuracyStroke, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                isAnimationActive={!prefersReducedMotion}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
