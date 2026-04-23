import { Link } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../context/LanguageContext';

export default function AuthShell({ title, subtitle, children, footerText, footerLink, footerAction }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.28),_transparent_40%),linear-gradient(180deg,_#020617,_#0f172a)] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center gap-10 px-6 py-10">
        <div className="hidden max-w-xl lg:block">
          <h1 className="text-5xl font-bold leading-tight">TalentHive</h1>
          <p className="mt-5 text-lg text-slate-300">{t('authShellDescription')}</p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-slate-200">
            <FeatureCard title={t('featureSmartPostingTitle')} text={t('featureSmartPostingText')} />
            <FeatureCard title={t('featureEmailResetTitle')} text={t('featureEmailResetText')} />
            <FeatureCard title={t('featureLiveFeedTitle')} text={t('featureLiveFeedText')} />
            <FeatureCard title={t('featureCleanUiTitle')} text={t('featureCleanUiText')} />
          </div>
        </div>

        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/10 p-7 shadow-glow backdrop-blur-xl">
          <LanguageSelector className="mb-6" />
          <h2 className="text-3xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
          <div className="mt-6">{children}</div>
          <p className="mt-6 text-sm text-slate-300">
            {footerText}{' '}
            <Link className="font-semibold text-blue-300 hover:text-blue-200" to={footerLink}>
              {footerAction}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 text-slate-300">{text}</p>
    </div>
  );
}
