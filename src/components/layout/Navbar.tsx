import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { Language } from '../../types/vibebattle';

export function Navbar() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap shrink-0 text-sm font-medium transition-colors underline-offset-4 hover:underline ${
      isActive
        ? 'text-slate-950 dark:text-white underline decoration-rose-500 decoration-2'
        : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
    }`;

  const handleSignOut = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/');
  };

  return (
    <header className="relative md:sticky md:top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm dark:border-slate-800/80 dark:bg-[#0B0F17]/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Single-element Brand Wordmark */}
        <Link
          to="/"
          className="font-display text-xl font-bold tracking-tight text-slate-950 dark:text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-md px-1"
        >
          VibeBattle
        </Link>

        {/* Zone 2: 5 single-line nav links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6"
        >
          <NavLink to="/explore" className={navLinkClass}>
            {t.nav.explore}
          </NavLink>
          <NavLink to="/battles" className={navLinkClass}>
            {t.nav.battles}
          </NavLink>
          <NavLink to="/daily" className={navLinkClass}>
            {t.nav.daily}
          </NavLink>
          <NavLink to="/live" className={navLinkClass}>
            {t.nav.live}
          </NavLink>
          {user ? (
            <NavLink to="/dashboard" className={navLinkClass}>
              {t.nav.dashboard}
            </NavLink>
          ) : (
            <NavLink to="/login" className={navLinkClass}>
              {t.nav.signIn}
            </NavLink>
          )}
        </nav>

        {/* Zone 3: 1 primary action + mobile menu trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/create"
            className="hidden sm:inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 whitespace-nowrap shrink-0"
          >
            {t.nav.createQuiz}
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 md:hidden dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden dark:border-slate-800 dark:bg-[#0B0F17]">
          <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
            <Link
              to="/explore"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t.nav.explore}
            </Link>
            <Link
              to="/create"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-3 text-base font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              {t.nav.createQuiz}
            </Link>
            <Link
              to="/battles"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t.nav.battles}
            </Link>
            <Link
              to="/compatibility"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t.nav.compatibility}
            </Link>
            <Link
              to="/daily"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t.nav.daily}
            </Link>
            <Link
              to="/live"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t.nav.live}
            </Link>
            <Link
              to="/leaderboards"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t.nav.leaderboards}
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {t.nav.dashboard}
                </Link>
                <Link
                  to="/my-quizzes"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {t.nav.myQuizzes}
                </Link>
                <Link
                  to="/achievements"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {t.nav.achievements}
                </Link>
                <Link
                  to="/friends"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {t.nav.friends}
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {t.nav.notifications}
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {t.nav.profile}
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    {t.nav.admin}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-1 rounded-xl px-3 py-3 text-left text-base font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  {t.nav.signOut}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {t.nav.signIn}
              </Link>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
                {(['en', 'fr', 'rn'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
                      language === lang
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200"
              >
                {theme === 'dark' ? t.profile.lightMode : t.profile.darkMode}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
