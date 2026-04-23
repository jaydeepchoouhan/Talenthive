import { useState } from 'react';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector({ className = '', selectClassName = '' }) {
  const {
    language,
    t,
    changeLanguage,
    requestFrenchVerification,
    verifyFrenchLanguage,
    clearFrenchVerification,
    frenchVerification
  } = useLanguage();
  const [code, setCode] = useState('');

  async function handleChange(event) {
    const nextLanguage = event.target.value;

    if (nextLanguage === language && frenchVerification.status !== 'pending') {
      return;
    }

    if (nextLanguage !== 'fr') {
      setCode('');
    }

    await changeLanguage(nextLanguage);
  }

  async function handleVerify(event) {
    event.preventDefault();
    const result = await verifyFrenchLanguage(code);

    if (!result?.error) {
      setCode('');
    }
  }

  function handleCancel() {
    clearFrenchVerification();
    setCode('');
  }

  const activeLanguage = frenchVerification.status === 'pending' ? 'fr' : language;

  return (
    <div className={className}>
      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
          {t('languageLabel')}
        </span>
        <select
          value={activeLanguage}
          onChange={handleChange}
          className={`w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none ${selectClassName}`}
        >
          {LANGUAGE_OPTIONS.map((item) => (
            <option key={item.code} value={item.code}>
              {item.nativeLabel}
            </option>
          ))}
        </select>
      </label>

      {(frenchVerification.message || frenchVerification.error) && (
        <p
          className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
            frenchVerification.error
              ? 'bg-red-500/10 text-red-200'
              : 'bg-emerald-500/10 text-emerald-200'
          }`}
        >
          {frenchVerification.error || frenchVerification.message}
        </p>
      )}

      {frenchVerification.status === 'pending' && (
        <form onSubmit={handleVerify} className="mt-3 space-y-3 rounded-[24px] border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300">
            {t('languageFrenchUsesAccountEmail', { email: frenchVerification.email })}
          </p>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">{t('languageFrenchCodeLabel')}</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={t('languageFrenchCodePlaceholder')}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={requestFrenchVerification}
              className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-200"
            >
              {frenchVerification.loading ? t('languageFrenchSendingCode') : t('languageFrenchSendCode')}
            </button>
            <button className="rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white">
              {frenchVerification.verifying ? t('languageFrenchVerifying') : t('languageFrenchVerifyCode')}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
            >
              {t('languageFrenchCancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
