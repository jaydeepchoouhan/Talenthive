import { useState } from 'react';
import { BriefcaseBusiness, Send } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const INITIAL_FORM = {
  companyName: '',
  role: '',
  location: '',
  mode: '',
  notes: ''
};

export default function InternshipApplicationsCard({ user, onApply }) {
  const { t, formatDateTime } = useLanguage();
  const [form, setForm] = useState(INITIAL_FORM);
  const [feedback, setFeedback] = useState({ message: '', error: '' });
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback({ message: '', error: '' });

    const result = await onApply(form);

    if (result?.ok) {
      setFeedback({ message: result.message, error: '' });
      setForm(INITIAL_FORM);
    } else {
      setFeedback({ message: '', error: result?.error || 'Unable to submit application.' });
    }

    setSubmitting(false);
  }

  const hasResume = Boolean(
    user?.resume?.fullName &&
      user?.resume?.qualification &&
      user?.resume?.experience &&
      user?.resume?.personalDetails
  );

  return (
    <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div>
        <h3 className="text-lg font-semibold text-white">{t('internshipSectionTitle')}</h3>
        <p className="text-sm text-slate-400">{t('internshipSectionSubtitle')}</p>
      </div>

      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
        {hasResume ? t('internshipSavedResumeNotice', { name: user?.resume?.fullName || user?.name || 'Student' }) : t('internshipResumeRequired')}
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">{t('internshipCompanyLabel')}</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50"
            name="companyName"
            placeholder={t('internshipCompanyPlaceholder')}
            value={form.companyName}
            onChange={updateField}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">{t('internshipRoleLabel')}</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50"
            name="role"
            placeholder={t('internshipRolePlaceholder')}
            value={form.role}
            onChange={updateField}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">{t('internshipLocationLabel')}</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50"
              name="location"
              placeholder={t('internshipLocationPlaceholder')}
              value={form.location}
              onChange={updateField}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">{t('internshipModeLabel')}</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50"
              name="mode"
              placeholder={t('internshipModePlaceholder')}
              value={form.mode}
              onChange={updateField}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">{t('internshipNotesLabel')}</span>
          <textarea
            className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50"
            name="notes"
            placeholder={t('internshipNotesPlaceholder')}
            value={form.notes}
            onChange={updateField}
          />
        </label>

        {feedback.error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{feedback.error}</div>}
        {feedback.message && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{feedback.message}</div>}

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={submitting}
          type="submit"
        >
          {submitting ? <BriefcaseBusiness className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
          {submitting ? t('internshipApplying') : t('internshipApplyButton')}
        </button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">{t('internshipRecentApplications')}</h4>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
            {user?.internshipApplications?.length || 0}
          </span>
        </div>

        {user?.internshipApplications?.length ? (
          user.internshipApplications.slice(0, 5).map((application) => (
            <div key={application._id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{application.role}</p>
                  <p className="text-sm text-slate-300">{application.companyName}</p>
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

              {application.notes && <p className="mt-3 text-sm text-slate-300">{application.notes}</p>}

              <p className="mt-3 text-xs text-slate-400">{t('internshipAppliedOn', { date: formatDateTime(application.appliedAt) })}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/30 p-4 text-sm text-slate-400">
            {t('internshipNoApplications')}
          </div>
        )}
      </div>
    </div>
  );
}
