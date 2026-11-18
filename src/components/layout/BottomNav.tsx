import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Compass, Home, Layers, Plus, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';

interface NavTab {
  id: string;
  to: string;
  label: string;
  icon: typeof Home;
  isPrimary?: boolean;
  matchPaths: string[];
}

export function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { t } = useI18n();

  const tabs: NavTab[] = [
    {
      id: 'home',
      to: '/',
      label: t.nav.home,
      icon: Home,
      matchPaths: ['/'],
    },
    {
      id: 'explore',
      to: '/explore',
      label: t.nav.explore,
      icon: Compass,
      matchPaths: ['/explore'],
    },
    {
      id: 'create',
      to: '/create',
      label: t.nav.createShort,
      icon: Plus,
      isPrimary: true,
      matchPaths: ['/create'],
    },
    {
      id: 'quizzes',
      to: user ? '/my-quizzes' : '/dashboard',
      label: t.nav.quizzesShort,
      icon: Layers,
      matchPaths: ['/my-quizzes', '/dashboard'],
    },
    {
      id: 'account',
      to: user ? '/profile' : '/login',
      label: user ? t.nav.profileShort : t.nav.signIn,
      icon: User,
      matchPaths: user
        ? ['/profile', '/profile/edit', '/settings', '/admin']
        : ['/login', '/register', '/forgot-password'],
    },
  ];

  return (
    <motion.nav
      aria-label="Mobile Bottom Navigation"
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden dark:border-slate-800/90 dark:bg-[#0B0F17]/95"
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.matchPaths.some((path) =>
            path === '/' ? pathname === '/' : pathname.startsWith(path)
          );

          if (tab.isPrimary) {
            return (
              <Link
                key={tab.id}
                to={tab.to}
                aria-label={t.nav.createQuiz}
                aria-current={isActive ? 'page' : undefined}
                className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  animate={{ scale: isActive ? 1.05 : 1 }}
                  transition={{ type: 'spring', stiffness: 460, damping: 28 }}
                  className="flex h-10 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-sm"
                >
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                </motion.div>
                <span className="mt-0.5 max-w-full truncate text-[10px] font-semibold tracking-tight text-rose-600 dark:text-rose-400">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.id}
              to={tab.to}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-bottom-nav-indicator"
                  transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                  className="absolute inset-x-2.5 top-1 bottom-1 rounded-xl bg-rose-50 dark:bg-rose-950/50"
                />
              )}

              <motion.div
                whileTap={{ scale: 0.9 }}
                animate={{
                  scale: isActive ? 1.08 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex items-center justify-center"
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  strokeWidth={isActive ? 2.25 : 1.9}
                />
              </motion.div>

              <span
                className={`relative z-10 mt-1 max-w-full truncate text-[10px] tracking-tight transition-colors whitespace-nowrap ${
                  isActive
                    ? 'font-semibold text-rose-600 dark:text-rose-400'
                    : 'font-medium text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
