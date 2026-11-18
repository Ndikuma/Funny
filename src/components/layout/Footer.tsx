import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Language } from '../../types/vibebattle';

export function Footer() {
  const { t, language, setLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0B0F17]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              to="/"
              className="font-display text-lg font-bold tracking-tight text-slate-950 dark:text-white"
            >
              VibeBattle
            </Link>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t.footer.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600 dark:text-slate-400">
            <Link to="/explore" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              {t.nav.explore}
            </Link>
            <Link to="/battles" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              {t.nav.battles}
            </Link>
            <Link to="/compatibility" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              {t.nav.compatibility}
            </Link>
            <Link to="/daily" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              {t.nav.daily}
            </Link>
            <Link to="/live" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              {t.nav.live}
            </Link>
            <Link to="/leaderboards" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              {t.nav.leaderboards}
            </Link>
            <Link to="/create" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              {t.nav.createQuiz}
            </Link>
            <Link to="/privacy" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              {t.footer.privacy}
            </Link>
            <Link to="/terms" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              {t.footer.terms}
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                {t.nav.admin}
              </Link>
            )}
            {user && (
              <button
                type="button"
                onClick={() => void logout()}
                className="hover:text-slate-950 dark:hover:text-white transition-colors"
              >
                {t.nav.signOut}
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © 2026 VibeBattle. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t.footer.language}:
              </span>
              <div
                role="group"
                aria-label={t.footer.language}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900"
              >
                {(['en', 'fr', 'rn'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition-colors whitespace-nowrap ${
                      language === lang
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {lang === 'rn' ? 'RN' : lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Light / Dark Mode Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t.profile.lightMode : t.profile.darkMode}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span>{t.profile.lightMode}</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-slate-600" />
                  <span>{t.profile.darkMode}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
