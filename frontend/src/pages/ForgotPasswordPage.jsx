import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import PasswordGeneratorCard from '../components/PasswordGeneratorCard';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { t, translateMessage } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [method, setMethod] = useState('email');
  const [message, setMessage] = useState('');
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setWarning('');

    if (!identifier.trim()) {
      setLoading(false);
      setError(t('forgotIdentifierRequired'));
      return;
    }

    try {
      const { data } = await api.post('/auth/forgot-password', { identifier, method });
      setMessage(
        [translateMessage(data.message), data.devHint ? translateMessage(data.devHint) : '']
          .filter(Boolean)
          .join(' ')
      );
    } catch (err) {
      if (err.response?.status === 429) {
        setWarning(translateMessage(err.response?.data?.message || t('apiForgotOncePerDay')));
      } else {
        setError(translateMessage(err.response?.data?.message || t('apiUnableRequestReset')));
      }
    } finally {
      setLoading(false);
    }
  }

  function openResetPage() {
    const query = identifier ? `?identifier=${encodeURIComponent(identifier)}` : '';
    navigate(`/reset-password${query}`);
  }

  return (
    <AuthShell
      title={t('forgotTitle')}
      subtitle={t('forgotSubtitle')}
      footerText={t('forgotRememberedPassword')}
      footerLink="/login"
      footerAction={t('commonGoBack')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">{t('forgotIdentifierLabel')}</span>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder={method === 'email' ? t('forgotIdentifierPlaceholderEmail') : t('forgotIdentifierPlaceholderPhone')}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none"
          />
        </label>

        <div>
          <span className="mb-2 block text-sm text-slate-300">{t('forgotResetUsing')}</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod('email')}
              className={`rounded-2xl border px-4 py-3 text-sm ${method === 'email' ? 'border-blue-400 bg-blue-500/20 text-blue-200' : 'border-white/10 bg-slate-900/60 text-slate-300'}`}
            >
              {t('commonEmail')}
            </button>
            <button
              type="button"
              onClick={() => setMethod('phone')}
              className={`rounded-2xl border px-4 py-3 text-sm ${method === 'phone' ? 'border-blue-400 bg-blue-500/20 text-blue-200' : 'border-white/10 bg-slate-900/60 text-slate-300'}`}
            >
              {t('commonPhone')}
            </button>
          </div>
        </div>

        <div className="rounded-[24px] border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {t('forgotPolicyNote')}
        </div>

        <PasswordGeneratorCard title={t('forgotSuggestedPasswordTitle')} />

        {message && <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p>}
        {warning && <p className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{warning}</p>}
        {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

        <button className="w-full rounded-2xl bg-blue-500 py-3 font-semibold text-white hover:bg-blue-400">
          {loading ? t('forgotRequesting') : t('forgotRequestButton')}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <span>{t('forgotAfterCode')}</span>
        <button type="button" onClick={openResetPage} className="font-semibold text-blue-300 transition hover:text-blue-200">
          {t('forgotOpenReset')}
        </button>
        <Link className="font-semibold text-blue-300 transition hover:text-blue-200" to="/reset-password">
          {t('forgotResetWithoutPrefill')}
        </Link>
      </div>
    </AuthShell>
  );
}
