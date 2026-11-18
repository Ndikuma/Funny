import { useI18n } from '../contexts/I18nContext';

export function PrivacyPolicyPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">
        {t.legal.privacyTitle}
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Effective November 2026 · VibeBattle
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <section>
          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
            1. Minimal Data Collection
          </h2>
          <p className="mt-2">
            VibeBattle only collects information required to operate quizzes, leaderboards, and creator accounts: your display name, unique username, email address (for registered creators), and quiz responses. Guest players only provide a temporary nickname for the leaderboard.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
            2. Privacy Controls
          </h2>
          <p className="mt-2">
            You decide whether your profile is public, whether your creator name appears on published quizzes, and whether each quiz is public, unlisted (link-only), or private.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
            3. Deletion & Anonymization
          </h2>
          <p className="mt-2">
            Deleting a quiz removes its questions and leaderboard attempts immediately. Account data can be edited or removed from your settings at any time.
          </p>
        </section>
      </div>
    </div>
  );
}

export function TermsOfServicePage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">
        {t.legal.termsTitle}
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Effective November 2026 · VibeBattle
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <section>
          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
            1. Friendly Entertainment Only
          </h2>
          <p className="mt-2">
            VibeBattle is designed for lighthearted social entertainment among friends. Harassment, hate speech, personal doxxing, and abusive quizzes are strictly prohibited and subject to moderation removal.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
            2. Fair Play & Integrity
          </h2>
          <p className="mt-2">
            Automated score manipulation, spam submissions, and attempts to bypass quiz privacy controls are not permitted.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
            3. Reporting Content
          </h2>
          <p className="mt-2">
            Any visitor or player can report a quiz using the Report link on the quiz intro screen. Our moderation team reviews open reports promptly.
          </p>
        </section>
      </div>
    </div>
  );
}
