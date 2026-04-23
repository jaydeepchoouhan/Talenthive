import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
  const { login, verifyAccount, resendAccountVerificationOtp, verifyLoginOtp, resendLoginOtp } = useAuth();
  const { t, translateMessage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ identifier: '', password: '', otp: '' });
  const [step, setStep] = useState('credentials');
  const [stepMeta, setStepMeta] = useState({ identifier: '', destination: '', browser: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState(location.state?.message || '');
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

  async function continueLoginFlow(result) {
    if (result.requiresVerification) {
      setStep('verify-account');
      setStepMeta({
        identifier: result.identifier || form.identifier,
        destination: result.destination || '',
        browser: ''
      });
      setMessage(buildFeedback(result));
      return;
    }

    if (result.requiresOtp) {
      setStep('verify-login-otp');
      setStepMeta({
        identifier: result.identifier || form.identifier,
        destination: result.destination || '',
        browser: result.browser || 'Google Chrome'
      });
      setMessage(buildFeedback(result));
      return;
    }

    navigate('/');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await login(form.identifier, form.password);
      await continueLoginFlow(result);
    } catch (err) {
      setError(translateMessage(err.response?.data?.message || t('apiLoginFailed')));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAccount(event) {
    event.preventDefault();
    setOtpLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await verifyAccount(stepMeta.identifier || form.identifier, form.otp);
      setForm((current) => ({ ...current, otp: '' }));
      setMessage(translateMessage(data.message));
      const result = await login(form.identifier, form.password);
      await continueLoginFlow(result);
    } catch (err) {
      setError(translateMessage(err.response?.data?.message || t('authOtpVerificationFailed')));
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleVerifyLoginOtp(event) {
    event.preventDefault();
    setOtpLoading(true);
    setError('');
    setMessage('');

    try {
      await verifyLoginOtp(stepMeta.identifier || form.identifier, form.otp);
      navigate('/');
    } catch (err) {
      setError(translateMessage(err.response?.data?.message || t('authOtpVerificationFailed')));
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError('');
    setMessage('');

    try {
      const data =
        step === 'verify-account'
          ? await resendAccountVerificationOtp(stepMeta.identifier || form.identifier)
          : await resendLoginOtp(stepMeta.identifier || form.identifier);
      setStepMeta((current) => ({
        ...current,
        destination: data.destination || current.destination
      }));
      setMessage(buildFeedback(data));
    } catch (err) {
      setError(translateMessage(err.response?.data?.message || t('authOtpResendFailed')));
    } finally {
      setResending(false);
    }
  }

  const isVerificationStep = step === 'verify-account';
  const isChromeOtpStep = step === 'verify-login-otp';

  return (
    <AuthShell
      title={
        isVerificationStep
          ? t('loginVerificationTitle')
          : isChromeOtpStep
            ? t('loginChromeOtpTitle')
            : t('loginTitle')
      }
      subtitle={
        isVerificationStep
          ? t('loginVerificationSubtitle')
          : isChromeOtpStep
            ? t('loginChromeOtpSubtitle')
            : t('loginSubtitle')
      }
      footerText={t('loginFooterText')}
      footerLink="/register"
      footerAction={t('loginFooterAction')}
    >
      {step === 'credentials' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('loginIdentifierLabel')} value={form.identifier} onChange={(value) => setForm({ ...form, identifier: value })} />
          <Input label={t('loginPasswordLabel')} type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />

          <div className="flex items-center justify-between text-sm">
            <Link className="text-blue-300 hover:text-blue-200" to="/forgot-password">
              {t('forgotPasswordLink')}
            </Link>
          </div>

          {message && <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p>}
          {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

          <button className="w-full rounded-2xl bg-blue-500 py-3 font-semibold text-white hover:bg-blue-400">
            {loading ? t('loginLoading') : t('loginButton')}
          </button>
        </form>
      ) : (
        <form onSubmit={isVerificationStep ? handleVerifyAccount : handleVerifyLoginOtp} className="space-y-4">
          <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
            {message ||
              (isVerificationStep
                ? t('loginVerificationHelp')
                : t('loginChromeOtpHelp', { browser: stepMeta.browser || 'Google Chrome' }))}
          </div>

          <Input
            label={t('authOtpCodeLabel')}
            value={form.otp}
            onChange={(value) => setForm((current) => ({ ...current, otp: value }))}
          />

          {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

          <button className="w-full rounded-2xl bg-blue-500 py-3 font-semibold text-white hover:bg-blue-400">
            {otpLoading ? t('authVerifyingOtp') : t('authVerifyOtpButton')}
          </button>

          <div className="flex gap-3">
            <button
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              onClick={handleResend}
              type="button"
            >
              {resending ? t('authResendingOtp') : t('authResendOtpButton')}
            </button>
            <button
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              onClick={() => {
                setStep('credentials');
                setStepMeta({ identifier: '', destination: '', browser: '' });
                setForm((current) => ({ ...current, otp: '' }));
                setError('');
                setMessage('');
              }}
              type="button"
            >
              {t('authChangeAccount')}
            </button>
          </div>
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
