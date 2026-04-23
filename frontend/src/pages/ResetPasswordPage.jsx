import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import PasswordGeneratorCard from '../components/PasswordGeneratorCard';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function ResetPasswordPage() {
  const { t, translateMessage } = useLanguage();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    identifier: searchParams.get('identifier') || '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (form.newPassword !== form.confirmPassword) {
      setLoading(false);
      setError(t('resetPasswordsMustMatch'));
      return;
    }

    try {
      const { data } = await api.post('/auth/reset-password', {
        identifier: form.identifier,
        code: form.code,
        newPassword: form.newPassword
      });
      setMessage(translateMessage(data.message));
      setForm((current) => ({ ...current, code: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      setError(translateMessage(err.response?.data?.message || t('apiResetFailed')));
    } finally {
      setLoading(false);
    }
  }

  function setGeneratedPassword(password) {
    setForm((current) => ({ ...current, newPassword: password, confirmPassword: password }));
    setMessage(t('resetGeneratedPasswordApplied'));
    setError('');
  }

  return (
    <AuthShell
      title={t('resetTitle')}
      subtitle={t('resetSubtitle')}
      footerText={t('resetNeedAnotherCode')}
      footerLink="/forgot-password"
      footerAction={t('forgotTitle')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">{t('resetIdentifierLabel')}</span>
          <input
            type="text"
            value={form.identifier}
            onChange={(event) => setForm({ ...form, identifier: event.target.value })}
            placeholder={t('resetIdentifierPlaceholder')}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">{t('resetCodeLabel')}</span>
          <input
            type="text"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
            placeholder={t('resetCodePlaceholder')}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 uppercase tracking-[0.3em] text-white outline-none"
          />
          <p className="mt-2 text-xs text-slate-400">{t('resetCodeExpiryHint')}</p>
        </label>

        <PasswordGeneratorCard title={t('forgotSuggestedPasswordTitle')} onUsePassword={setGeneratedPassword} />

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">{t('resetNewPasswordLabel')}</span>
          <input
            type="password"
            value={form.newPassword}
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
            placeholder={t('resetNewPasswordPlaceholder')}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">{t('resetConfirmPasswordLabel')}</span>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
            placeholder={t('resetConfirmPasswordPlaceholder')}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none"
          />
        </label>

        {message && <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p>}
        {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        <button className="w-full rounded-2xl bg-blue-500 py-3 font-semibold text-white hover:bg-blue-400">
          {loading ? t('resetUpdating') : t('resetButton')}
        </button>
      </form>

      <div className="mt-4 text-sm text-slate-400">
        {t('resetNeedAnotherCode')}{' '}
        <Link className="font-semibold text-blue-300 transition hover:text-blue-200" to="/forgot-password">
          {t('resetRequestAgain')}
        </Link>
      </div>
    </AuthShell>
  );
}
