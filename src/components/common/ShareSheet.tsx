import { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { useToast } from '../../contexts/ToastContext';

interface ShareSheetProps {
  shareCode: string;
  quizTitle: string;
  scorePercentage?: number;
}

export function ShareSheet({ shareCode, quizTitle, scorePercentage }: ShareSheetProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/q/${shareCode}`;
  const shareText =
    scorePercentage !== undefined
      ? t.share.shareTextScore
          .replace('{pct}', String(scorePercentage))
          .replace('{title}', quizTitle)
      : `${t.share.shareTextQuiz} "${quizTitle}"`;

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`${shareText} ${shareUrl}`);
  const encodedTextOnly = encodeURIComponent(shareText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast(t.share.copied, 'success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(shareUrl, 'info');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `VibeBattle — ${quizTitle}`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled share sheet
      }
    } else {
      await handleCopy();
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/70">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
        {scorePercentage !== undefined ? t.results.shareScoreHeading : t.share.heading}
      </h3>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
        <span className="flex-1 truncate font-mono text-xs text-slate-700 dark:text-slate-300">
          {shareUrl}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 whitespace-nowrap shrink-0"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? t.share.copied : t.share.copyLink}</span>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodedText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap"
        >
          {t.share.whatsapp}
        </a>
        <a
          href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTextOnly}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700 whitespace-nowrap"
        >
          {t.share.telegram}
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap"
        >
          {t.share.facebook}
        </a>
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>{t.share.nativeShare}</span>
        </button>
      </div>
    </div>
  );
}
