import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, Bell, Check, ShieldBan, Trophy, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { mockApi } from '../services/mockApi';
import { AvatarBadge } from '../components/common/AvatarBadge';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

export function LeaderboardsPage() {
  const { t } = useI18n();
  const [scope, setScope] = useState<'global' | 'weekly' | 'monthly' | 'friends'>('global');

  const { data: rows, isLoading } = useQuery({
    queryKey: ['global-leaderboards', scope],
    queryFn: () => mockApi.getGlobalLeaderboards(scope),
  });

  const scopes: { id: 'global' | 'weekly' | 'monthly' | 'friends'; label: string }[] = [
    { id: 'global', label: 'Global' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'friends', label: 'Friends' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
        {t.modes.leaderboardsTitle}
      </h1>
      <p className="mt-1.5 text-sm text-slate-600 sm:text-base dark:text-slate-300">
        {t.modes.leaderboardsSubtitle}
      </p>

      <div className="mt-6 inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
        {scopes.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScope(s.id)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              scope === s.id
                ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonLoader variant="quiz-list" count={4} className="mt-8" />
      ) : !rows || rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No visible players in this leaderboard yet. Sign in and add friends to compare!
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-3">Rank</th>
                <th className="py-2 pr-3">Player</th>
                <th className="py-2 pr-3 text-right">Level</th>
                <th className="py-2 pr-3 text-right">Streak</th>
                <th className="py-2 text-right">XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r) => (
                <tr key={r.userId}>
                  <td className="font-mono-nums py-3 pr-3 text-xs font-bold text-slate-500">
                    #{r.rank}
                  </td>
                  <td className="py-3 pr-3">
                    <Link
                      to={`/u/${r.username}`}
                      className="flex items-center gap-2.5 font-semibold text-slate-900 hover:underline dark:text-white"
                    >
                      <AvatarBadge name={r.displayName} avatarId={r.avatarId} size="sm" />
                      <span>{r.displayName}</span>
                    </Link>
                  </td>
                  <td className="font-mono-nums py-3 pr-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Lv. {r.level}
                  </td>
                  <td className="font-mono-nums py-3 pr-3 text-right text-xs text-amber-600 dark:text-amber-400">
                    {r.streak}d
                  </td>
                  <td className="font-mono-nums py-3 text-right font-bold text-slate-950 dark:text-white">
                    {r.xp} XP
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AchievementsPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ['daily-hub', user?.id],
    queryFn: () => mockApi.getDailyChallengeHub(),
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
            {t.modes.achievementsTitle}
          </h1>
          <Link
            to="/login?redirect=/achievements"
            className="mt-5 inline-flex rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t.nav.signIn}
          </Link>
        </div>
      </div>
    );
  }

  const g = data?.gamification;
  const xpProgress = g ? g.xp % 100 : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
        {t.modes.achievementsTitle}
      </h1>
      <p className="mt-1.5 text-sm text-slate-600 sm:text-base dark:text-slate-300">
        {t.modes.achievementsSubtitle}
      </p>

      {isLoading || !data ? (
        <SkeletonLoader variant="stat-card" count={4} className="mt-8" />
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Level {g?.level ?? 1} · Daily XP cap: {g?.dailyXpToday ?? 0}/300 XP
                </p>
                <p className="font-mono-nums mt-1 text-3xl font-extrabold text-slate-950 dark:text-white">
                  {g?.xp ?? 0} Total XP
                </p>
              </div>
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-rose-600 transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>

          <h2 className="mt-8 font-display text-xl font-bold text-slate-950 dark:text-white">
            Badges
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.badges.map((badge) => {
              const unlocked = g?.unlockedBadgeIds.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`rounded-2xl border p-5 ${
                    unlocked
                      ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                      : 'border-slate-200 bg-white opacity-70 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Award
                      className={`h-5 w-5 ${
                        unlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {unlocked ? 'Unlocked' : badge.requirementLabel}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-base font-bold text-slate-950 dark:text-white">
                    {badge.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {badge.description}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function FriendsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['friends-overview', user?.id],
    queryFn: () => mockApi.getFriendsOverview(),
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
            {t.modes.friendsTitle}
          </h1>
          <Link
            to="/login?redirect=/friends"
            className="mt-5 inline-flex rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {t.nav.signIn}
          </Link>
        </div>
      </div>
    );
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['friends-overview'] });

  const handleRequest = async (targetId: string) => {
    try {
      await mockApi.sendFriendRequest(targetId);
      await refresh();
      showToast('Friend request sent!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    }
  };

  const handleRespond = async (
    friendshipId: string,
    action: 'accept' | 'decline' | 'block' | 'remove'
  ) => {
    try {
      await mockApi.respondFriendRequest(friendshipId, action);
      await refresh();
      showToast('Updated connections.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
        {t.modes.friendsTitle}
      </h1>
      <p className="mt-1.5 text-sm text-slate-600 sm:text-base dark:text-slate-300">
        {t.modes.friendsSubtitle}
      </p>

      {isLoading || !data ? (
        <SkeletonLoader variant="quiz-list" count={4} className="mt-8" />
      ) : (
        <div className="mt-8 space-y-6">
          {data.incomingRequests.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                Incoming Requests
              </h2>
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {data.incomingRequests.map((req) => (
                  <li
                    key={req.friendshipId}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarBadge
                        name={req.user.displayName}
                        avatarId={req.user.profile.avatarId}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {req.user.displayName}
                        </p>
                        <p className="text-xs text-slate-500">@{req.user.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleRespond(req.friendshipId, 'accept')}
                        className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRespond(req.friendshipId, 'decline')}
                        className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRespond(req.friendshipId, 'block')}
                        className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs text-rose-600"
                      >
                        <ShieldBan className="h-3.5 w-3.5" />
                        <span>Block</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
              Your Friends ({data.friends.length})
            </h2>
            {data.friends.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No friends added yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {data.friends.map((f) => (
                  <li key={f.id} className="flex items-center justify-between py-3">
                    <Link
                      to={`/u/${f.username}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      <AvatarBadge
                        name={f.displayName}
                        avatarId={f.profile.avatarId}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {f.displayName}
                        </p>
                        <p className="text-xs text-slate-500">@{f.username}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {data.suggestions.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                Discover Players
              </h2>
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {data.suggestions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <AvatarBadge
                        name={s.displayName}
                        avatarId={s.profile.avatarId}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {s.displayName}
                        </p>
                        <p className="text-xs text-slate-500">@{s.username}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRequest(s.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-950"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Add Friend</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => mockApi.listNotifications(),
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Link
          to="/login?redirect=/notifications"
          className="inline-flex rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          {t.nav.signIn}
        </Link>
      </div>
    );
  }

  const markAll = async () => {
    await mockApi.markNotificationsRead();
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">
            {t.modes.notificationsTitle}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            {t.modes.notificationsSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void markAll()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
        >
          <Check className="h-3.5 w-3.5" />
          <span>Mark all read</span>
        </button>
      </div>

      {isLoading ? (
        <SkeletonLoader variant="quiz-list" count={4} className="mt-8" />
      ) : !items || items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <Bell className="mx-auto h-6 w-6 text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">All caught up!</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {items.map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-bold text-slate-950 dark:text-white">
                  {n.title}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{n.body}</p>
              </div>
              <Link
                to={n.link}
                onClick={() => void mockApi.markNotificationsRead(n.id)}
                className="shrink-0 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
