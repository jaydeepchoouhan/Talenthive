import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function RegisterPage() {
  const { register, verifyAccount, resendAccountVerificationOtp } = useAuth();
  const { language, t, translateMessage } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [verification, setVerification] = useState({
    pending: false,
    identifier: '',
    destination: '',
    code: '',
    info: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);

  function buildFeedback(data) {
    return [
      translateMessage(data.message),
      data.destination ? t('authOtpSentTo', { destination: data.destination }) : '',
      data.devHint ? translateMessage(data.devHint) : ''
    ]
      .filter(Boolean)
      .join(' ');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await register({ ...form, language: language === 'fr' ? 'en' : language });
      setVerification({
        pending: true,
        identifier: data.identifier,
        destination: data.destination || '',
        code: '',
        info: buildFeedback(data)
      });
    } catch (err) {
      setError(translateMessage(err.response?.data?.message || t('apiRegistrationFailed')));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    setOtpLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await verifyAccount(verification.identifier, verification.code);
      navigate('/login', {
        state: { message: translateMessage(data.message || t('registerVerificationSuccess')) }
      });
    } catch (err) {
      setError(translateMessage(err.response?.data?.message || t('authOtpVerificationFailed')));
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResendOtp() {
    setResending(true);
    setError('');
    setMessage('');

    try {
      const data = await resendAccountVerificationOtp(verification.identifier);
      const feedback = buildFeedback(data);
      setVerification((current) => ({
        ...current,
        destination: data.destination || current.destination,
        info: feedback
      }));
      setMessage(feedback);
    } catch (err) {
      setError(translateMessage(err.response?.data?.message || t('authOtpResendFailed')));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      title={verification.pending ? t('registerVerificationTitle') : t('registerTitle')}
      subtitle={verification.pending ? t('registerVerificationSubtitle') : t('registerSubtitle')}
      footerText={t('registerFooterText')}
      footerLink="/login"
      footerAction={t('registerFooterAction')}
    >
      {verification.pending ? (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
            {verification.info || t('registerVerificationHelp')}
          </div>

          <Input
            label={t('authOtpCodeLabel')}
            value={verification.code}
            onChange={(value) => setVerification((current) => ({ ...current, code: value }))}
          />

          {message && <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p>}
          {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

          <button className="w-full rounded-2xl bg-blue-500 py-3 font-semibold text-white hover:bg-blue-400">
            {otpLoading ? t('authVerifyingOtp') : t('authVerifyOtpButton')}
          </button>

          <div className="flex gap-3">
            <button
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              onClick={handleResendOtp}
              type="button"
            >
              {resending ? t('authResendingOtp') : t('authResendOtpButton')}
            </button>
            <button
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              onClick={() => {
                setVerification((current) => ({ ...current, pending: false, code: '', info: '' }));
                setError('');
                setMessage('');
              }}
              type="button"
            >
              {t('authBackToForm')}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('registerNameLabel')} value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Input label={t('registerEmailLabel')} value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <Input label={t('registerPhoneLabel')} value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <Input label={t('registerPasswordLabel')} type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
          {message && <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p>}
          {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
          <button className="w-full rounded-2xl bg-blue-500 py-3 font-semibold text-white hover:bg-blue-400">
            {loading ? t('registerLoading') : t('registerButton')}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

function Input({ label, type = 'text', value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={type === 'password' ? '••••••••' : ''}
        className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none placeholder:text-slate-500"
      />
    </label>
  );
}
