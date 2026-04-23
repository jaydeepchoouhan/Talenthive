import { ImagePlus, SendHorizonal, Video } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function CreatePostCard({ postingStatus, onSubmit }) {
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const canPost = postingStatus?.unlimited || (postingStatus?.remaining ?? 0) > 0;
  const { t, getPostingStatusLabel } = useLanguage();

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canPost) return;
    setSubmitting(true);
    try {
      await onSubmit({ caption, files });
      setCaption('');
      setFiles([]);
      event.target.reset();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{t('createPostTitle')}</h2>
          <p className="text-sm text-slate-400">{t('createPostSubtitle')}</p>
        </div>
        <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs text-blue-200">
          {getPostingStatusLabel(postingStatus)}
        </span>
      </div>

      <textarea
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        rows={4}
        placeholder={t('createPostPlaceholder')}
        className="w-full rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-white outline-none placeholder:text-slate-500"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">
          <ImagePlus className="h-4 w-4" />
          {t('createPostMediaLabel')}
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files || []))}
            className="hidden"
          />
        </label>

        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Video className="h-4 w-4" /> {t('createPostFilesSelected', { count: files.length })}
        </div>

        <button
          disabled={!canPost || submitting}
          className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          <SendHorizonal className="h-4 w-4" /> {submitting ? t('createPostPosting') : t('createPostPostNow')}
        </button>
      </div>

      {!canPost && (
        <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {t('createPostLimitReached')}
        </p>
      )}
    </form>
  );
}
