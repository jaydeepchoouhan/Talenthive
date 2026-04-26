import { LogOut, Sparkles, UserRound, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ postingStatus }) {
  const { user, logout } = useAuth();
  const { t, getPostingStatusLabel } = useLanguage();
  const location = useLocation();
  const hasResume = Boolean(user?.resume?.updatedAt);
  const isProfilePage = location.pathname === '/profile';

  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">TalentHive</h1>
            <p className="text-xs text-slate-400">{t('navbarSubtitle')}</p>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 lg:hidden"
          >
            <LogOut className="h-4 w-4" /> {t('navbarLogout')}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
            <Sparkles className="mr-2 inline h-4 w-4" />
            {postingStatus?.unlimited
              ? t('navbarUnlimitedPosts')
              : t('navbarPostsLeft', { count: postingStatus?.remaining ?? 0 })}
          </div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
            <Users className="mr-2 inline h-4 w-4" />
            {t('navbarFriends', { count: user?.friendCount ?? 0 })}
          </div>
          <Link
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              isProfilePage
                ? 'border border-white/10 bg-white/10 text-white'
                : 'border border-blue-400/20 bg-blue-500/10 text-blue-100 hover:bg-blue-500/20'
            }`}
            to="/profile"
          >
            <UserRound className="h-4 w-4" /> {isProfilePage ? t('navbarProfileActive') : t('navbarProfile')}
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(180px,260px)_1fr] lg:flex lg:items-start">
          <div className="w-full lg:w-56">
            <LanguageSelector selectClassName="py-2.5" />
          </div>
          <div className="min-w-0 text-left lg:text-right">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email || user?.phone}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-blue-200/70">{getPostingStatusLabel(postingStatus)}</p>
            {hasResume && <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-emerald-200/70">{t('navbarResumeReady')}</p>}
          </div>
          <button
            onClick={logout}
            className="hidden items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 lg:inline-flex"
          >
            <LogOut className="h-4 w-4" /> {t('navbarLogout')}
          </button>
        </div>
      </div>
    </div>
  );
}
