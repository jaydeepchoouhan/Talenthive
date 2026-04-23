import { Heart, MessageCircle, Repeat2, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function PostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onShare,
  readOnly = false,
  loginHref = '/login'
}) {
  const [comment, setComment] = useState('');
  const liked = useMemo(() => post.likes?.some((id) => id === currentUserId || id?._id === currentUserId), [post.likes, currentUserId]);
  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;
  const shareCount = post.sharesCount || 0;
  const { t, formatDateTime } = useLanguage();

  async function submitComment(event) {
    event.preventDefault();
    if (!comment.trim() || readOnly) return;
    await onComment(post._id, comment);
    setComment('');
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-white">{post.author?.name}</p>
          <p className="text-xs text-slate-400">{formatDateTime(post.createdAt)}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {t('postMediaCount', { count: post.media?.length || 0 })}
        </div>
      </div>

      {post.caption && <p className="mt-4 whitespace-pre-wrap text-slate-200">{post.caption}</p>}

      {!!post.media?.length && (
        <div className="mt-4 grid gap-3">
          {post.media.map((item, index) =>
            item.resourceType === 'video' ? (
              <video key={`${item.url}-${index}`} controls className="max-h-[420px] w-full rounded-2xl bg-black">
                <source src={item.url} />
              </video>
            ) : (
              <img
                key={`${item.url}-${index}`}
                src={item.url}
                alt={t('postMediaAlt')}
                className="max-h-[420px] w-full rounded-2xl object-cover"
              />
            )
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => onLike?.(post._id)}
          disabled={readOnly}
          className={`inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 ${liked ? 'bg-pink-500/20 text-pink-200' : 'bg-white/5 text-slate-200'} ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
        >
          <Heart className="h-4 w-4" /> {t('postLikes', { count: likeCount })}
        </button>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200">
          <MessageCircle className="h-4 w-4" /> {t('postComments', { count: commentCount })}
        </div>
        <button
          type="button"
          onClick={() => onShare?.(post._id)}
          disabled={readOnly}
          className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200 ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
        >
          <Repeat2 className="h-4 w-4" /> {t('postShares', { count: shareCount })}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {post.comments?.map((item) => (
          <div key={item._id} className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3">
            <p className="text-sm font-semibold text-white">{item.author?.name}</p>
            <p className="mt-1 text-sm text-slate-300">{item.content}</p>
          </div>
        ))}
      </div>

      {readOnly ? (
        <div className="mt-4 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
          {t('postReadOnlyPrompt')}
          <a href={loginHref} className="ml-2 font-semibold text-blue-200 underline underline-offset-4">
            {t('postOpenLogin')}
          </a>
        </div>
      ) : (
        <form onSubmit={submitComment} className="mt-4 flex gap-3">
          <input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t('postCommentPlaceholder')}
            className="flex-1 rounded-full border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none placeholder:text-slate-500"
          />
          <button className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-medium text-slate-900">
            <Send className="h-4 w-4" /> {t('postSend')}
          </button>
        </form>
      )}
    </div>
  );
}
