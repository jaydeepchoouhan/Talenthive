import { BriefcaseBusiness, FileText, Mail, Phone, UserRound, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function getDeviceLabel(deviceType, t) {
  if (deviceType === 'mobile') return t('profileDeviceMobile');
  if (deviceType === 'tablet') return t('profileDeviceTablet');
  return t('profileDeviceDesktop');
}

function getLoginMethodLabel(loginMethod, t) {
  if (loginMethod === 'chrome-email-otp') return t('profileLoginMethodChromeOtp');
  return t('profileLoginMethodPassword');
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { t, formatDateTime } = useLanguage();

  const hasResume = Boolean(
    user?.resume?.fullName &&
      user?.resume?.qualification &&
      user?.resume?.experience &&
      user?.resume?.personalDetails
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#020617,_#0f172a)]">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-white">{t('profilePageTitle')}</h1>
            <p className="mt-2 text-sm text-slate-400">{t('profilePageSubtitle')}</p>
          </div>

          <Link
            className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-500/20"
            to="/"
          >
            {t('profileBackToFeed')}
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,_rgba(14,165,233,0.18),_rgba(15,23,42,0.95))]">
              <div className="grid gap-6 p-6 lg:grid-cols-[140px_minmax(0,1fr)] lg:p-8">
                <div className="flex items-start justify-center lg:justify-start">
                  {user?.resume?.photo || user?.avatar ? (
                    <img
                      alt={t('profilePhotoAlt')}
                      className="h-32 w-32 rounded-[28px] border border-white/10 object-cover shadow-xl shadow-slate-950/40"
                      src={user.resume?.photo || user.avatar}
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-[28px] border border-white/10 bg-slate-950/40 text-slate-300">
                      <UserRound className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100">
                      {hasResume ? t('profileResumeReady') : t('profileResumeMissing')}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200">
                      {t('profileApplicationsCount', { count: user?.internshipApplications?.length || 0 })}
                    </span>
                  </div>

                  <h2 className="mt-4 text-3xl font-semibold text-white">{user?.resume?.fullName || user?.name}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
                    {user?.resume?.generatedSummary || t('profileSummaryFallback')}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{t('profileQualification')}</p>
                      <p className="mt-2 text-sm text-white">{user?.resume?.qualification || t('profileNoQualification')}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{t('profileMemberSince')}</p>
                      <p className="mt-2 text-sm text-white">{user?.createdAt ? formatDateTime(user.createdAt) : t('profileNoDate')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatPill icon={Users} label={t('profileFriendsStat')} value={user?.friendCount ?? 0} />
              <StatPill
                icon={BriefcaseBusiness}
                label={t('profileApplicationsStat')}
                value={user?.internshipApplications?.length ?? 0}
              />
              <StatPill
                icon={FileText}
                label={t('profileResumeStat')}
                value={hasResume ? t('profileResumeReadyShort') : t('profileResumePendingShort')}
              />
              <StatPill
                icon={user?.email ? Mail : Phone}
                label={t('profilePrimaryContact')}
                value={user?.email || user?.phone || t('profileNotAvailable')}
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <h3 className="text-lg font-semibold text-white">{t('profileAccountDetails')}</h3>
                <div className="mt-4 space-y-4 text-sm text-slate-300">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{t('profileFullName')}</p>
                    <p className="mt-2 text-white">{user?.name || t('profileNotAvailable')}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{t('profileEmail')}</p>
                    <p className="mt-2 text-white">{user?.email || t('profileNotAvailable')}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{t('profilePhone')}</p>
                    <p className="mt-2 text-white">{user?.phone || t('profileNotAvailable')}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <h3 className="text-lg font-semibold text-white">{t('profilePersonalDetailsTitle')}</h3>
                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
                    {user?.resume?.personalDetails || t('profileNoPersonalDetails')}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{t('profileResumePreviewTitle')}</h3>
                  <p className="text-sm text-slate-400">{t('profileResumePreviewSubtitle')}</p>
                </div>
                {user?.resume?.updatedAt && (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {t('profileResumeUpdatedOn', { date: formatDateTime(user.resume.updatedAt) })}
                  </span>
                )}
              </div>

              {hasResume ? (
                <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
                  <div className="space-y-5 rounded-[24px] border border-cyan-400/15 bg-[linear-gradient(180deg,_rgba(14,165,233,0.12),_rgba(15,23,42,0.85))] p-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">{t('profileQualification')}</p>
                      <p className="mt-2 text-sm leading-7 text-white">{user.resume.qualification}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">{t('profileExperience')}</p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-200">{user.resume.experience}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-white/10 bg-slate-900/60 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{t('profileResumeSummary')}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-200">{user.resume.generatedSummary}</p>
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-slate-900/60 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{t('profileHighlights')}</p>
                      {user?.resume?.generatedSkills?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {user.resume.generatedSkills.map((skill) => (
                            <span key={skill} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-100">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-400">{t('profileNoHighlights')}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] border border-dashed border-white/10 bg-slate-900/35 p-5 text-sm text-slate-400">
                  {t('profileResumeEmpty')}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-white">{t('profileQuickActionsTitle')}</h3>
              <div className="mt-4 space-y-3">
                <Link
                  className="block rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-100 transition hover:bg-blue-500/20"
                  to="/"
                >
                  {t('profileQuickActionResume')}
                </Link>
                <Link
                  className="block rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20"
                  to="/"
                >
                  {t('profileQuickActionApply')}
                </Link>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">{t('profileApplicationsTitle')}</h3>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {user?.internshipApplications?.length || 0}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {user?.internshipApplications?.length ? (
                  user.internshipApplications.slice(0, 6).map((application) => (
                    <div key={application._id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{application.role}</p>
                          <p className="mt-1 text-sm text-slate-300">{application.companyName}</p>
                        </div>
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
                          {application.status}
                        </span>
                      </div>

                      {(application.location || application.mode) && (
                        <p className="mt-2 text-xs text-slate-400">
                          {[application.location, application.mode].filter(Boolean).join(' • ')}
                        </p>
                      )}

                      {application.notes && <p className="mt-3 text-sm leading-6 text-slate-300">{application.notes}</p>}

                      <p className="mt-3 text-xs text-slate-400">{t('profileAppliedOn', { date: formatDateTime(application.appliedAt) })}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/35 p-4 text-sm text-slate-400">
                    {t('profileNoApplications')}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{t('profileLoginHistoryTitle')}</h3>
                  <p className="text-sm text-slate-400">{t('profileLoginHistorySubtitle')}</p>
                </div>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {user?.loginHistory?.length || 0}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {user?.loginHistory?.length ? (
                  user.loginHistory.slice(0, 10).map((entry) => (
                    <div key={entry._id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{entry.browser}</p>
                          <p className="mt-1 text-sm text-slate-300">{entry.os}</p>
                        </div>
                        <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-100">
                          {getDeviceLabel(entry.deviceType, t)}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{t('profileLoginMethod')}</p>
                          <p className="mt-2">{getLoginMethodLabel(entry.loginMethod, t)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{t('profileLoginIp')}</p>
                          <p className="mt-2 break-all">{entry.ipAddress}</p>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-slate-400">{t('profileLoginAt', { date: formatDateTime(entry.loggedInAt) })}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/35 p-4 text-sm text-slate-400">
                    {t('profileNoLoginHistory')}
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
