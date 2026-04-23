import { useEffect, useState } from 'react';
import { FileText, Save, Sparkles, Upload } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

function getInitialForm(user) {
  return {
    fullName: user?.resume?.fullName || user?.name || '',
    qualification: user?.resume?.qualification || '',
    experience: user?.resume?.experience || '',
    personalDetails: user?.resume?.personalDetails || ''
  };
}

export default function ResumeBuilderCard({ user, onSave }) {
  const { t, formatDateTime } = useLanguage();
  const [form, setForm] = useState(() => getInitialForm(user));
  const [photoFile, setPhotoFile] = useState(null);
  const [feedback, setFeedback] = useState({ message: '', error: '' });
  const [saving, setSaving] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');

  useEffect(() => {
    setForm(getInitialForm(user));
  }, [user?.name, user?.resume?.updatedAt, user?.resume?.qualification, user?.resume?.experience, user?.resume?.personalDetails]);

  useEffect(() => {
    if (!photoFile) {
      setLocalPreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(photoFile);
    setLocalPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const activePhoto = localPreviewUrl || user?.resume?.photo || user?.avatar || '';
  const resume = user?.resume;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFeedback({ message: '', error: '' });

    const result = await onSave(form, photoFile);

    if (result?.ok) {
      setFeedback({ message: result.message, error: '' });
      setPhotoFile(null);
    } else {
      setFeedback({ message: '', error: result?.error || 'Unable to save resume.' });
    }

    setSaving(false);
  }

  return (
    <div className="space-y-5 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-semibold text-white">{t('resumeSectionTitle')}</h2>
        <p className="text-sm text-slate-400">{t('resumeSectionSubtitle')}</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">{t('resumeFormNameLabel')}</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/50"
            name="fullName"
            placeholder={t('resumeFormNamePlaceholder')}
            value={form.fullName}
            onChange={updateField}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">{t('resumeFormQualificationLabel')}</span>
          <textarea
            className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/50"
            name="qualification"
            placeholder={t('resumeFormQualificationPlaceholder')}
            value={form.qualification}
            onChange={updateField}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">{t('resumeFormExperienceLabel')}</span>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/50"
            name="experience"
            placeholder={t('resumeFormExperiencePlaceholder')}
            value={form.experience}
            onChange={updateField}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">{t('resumeFormPersonalDetailsLabel')}</span>
          <textarea
            className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/50"
            name="personalDetails"
            placeholder={t('resumeFormPersonalDetailsPlaceholder')}
            value={form.personalDetails}
            onChange={updateField}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">{t('resumeFormPhotoLabel')}</span>
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/60 p-4">
            <input
              accept="image/*"
              className="block w-full cursor-pointer text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
              type="file"
              onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
            />
            <p className="mt-2 text-xs text-slate-400">{t('resumeFormPhotoHint')}</p>
          </div>
        </label>

        {feedback.error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{feedback.error}</div>}
        {feedback.message && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{feedback.message}</div>}

        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={saving}
          type="submit"
        >
          {saving ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
          {saving ? t('resumeSaving') : t('resumeSaveButton')}
        </button>
      </form>

      <div className="rounded-[26px] border border-cyan-400/15 bg-[linear-gradient(180deg,_rgba(14,165,233,0.12),_rgba(15,23,42,0.75))] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
              <FileText className="h-3.5 w-3.5" />
              {t('resumePreviewTitle')}
            </div>
            {resume?.updatedAt && (
              <p className="mt-3 text-xs text-slate-300">{t('resumePreviewGeneratedOn', { date: formatDateTime(resume.updatedAt) })}</p>
            )}
          </div>

          {activePhoto ? (
            <img
              alt={t('resumePhotoAlt')}
              className="h-20 w-20 rounded-2xl border border-white/10 object-cover shadow-lg shadow-slate-950/30"
              src={activePhoto}
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50 text-slate-400">
              <Upload className="h-6 w-6" />
            </div>
          )}
        </div>

        {resume ? (
          <div className="mt-5 space-y-4">
            <div>
              <h3 className="text-2xl font-semibold text-white">{resume.fullName}</h3>
              <p className="mt-1 text-sm text-cyan-100">{resume.qualification}</p>
              <p className="mt-2 text-sm text-slate-300">{user?.email || user?.phone}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">{t('resumeProfileLinked')}</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">{t('resumePreviewSummary')}</p>
              <p className="text-sm leading-6 text-slate-200">{resume.generatedSummary}</p>
            </div>

            {resume.generatedSkills?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">{t('resumePreviewSkills')}</p>
                <div className="flex flex-wrap gap-2">
                  {resume.generatedSkills.map((skill) => (
                    <span key={skill} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">{t('resumePreviewExperience')}</p>
              <p className="whitespace-pre-line text-sm leading-6 text-slate-200">{resume.experience}</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">{t('resumePreviewPersonalDetails')}</p>
              <p className="whitespace-pre-line text-sm leading-6 text-slate-200">{resume.personalDetails}</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-300">{t('resumeEmptyState')}</p>
        )}
      </div>
    </div>
  );
}
