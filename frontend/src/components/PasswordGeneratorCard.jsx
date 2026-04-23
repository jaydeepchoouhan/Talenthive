import { useState } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function PasswordGeneratorCard({ onUsePassword, title = 'Password generator' }) {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setCopyMessage('');

    try {
      const { data } = await api.get('/auth/password-generator');
      setGeneratedPassword(data.password);
    } catch (err) {
      setError(err.response?.data?.message || t('apiResetFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!generatedPassword) return;

    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopyMessage(t('passwordGeneratorCopied'));
    } catch {
      setCopyMessage(t('passwordGeneratorCopyFailed'));
    }
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-base font-semibold text-white">{title}</p>
          <p className="text-sm text-slate-400">{t('passwordGeneratorDescription')}</p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
        >
          {loading ? t('passwordGeneratorGenerating') : t('passwordGeneratorGenerate')}
        </button>
      </div>

      {generatedPassword && (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-blue-400/20 bg-slate-950/70 px-4 py-3 font-mono text-lg tracking-[0.18em] text-blue-200">
            {generatedPassword}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:border-blue-300/40 hover:text-white"
            >
              {t('passwordGeneratorCopy')}
            </button>
            {onUsePassword && (
              <button
                type="button"
                onClick={() => onUsePassword(generatedPassword)}
                className="rounded-full border border-blue-400/30 bg-blue-500/15 px-4 py-2 text-sm text-blue-200 transition hover:bg-blue-500/25"
              >
                {t('passwordGeneratorUse')}
              </button>
            )}
          </div>
        </div>
      )}

      {copyMessage && <p className="mt-3 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{copyMessage}</p>}
      {error && <p className="mt-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
    </div>
  );
}
