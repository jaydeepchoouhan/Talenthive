import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import LanguageSelector from '../components/LanguageSelector';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function PostDetailsPage() {
  const { postId } = useParams();
  const { token, user } = useAuth();
  const { language, t, translateMessage } = useLanguage();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      setLoading(true);
      setError('');

      try {
        const { data } = await api.get(`/posts/${postId}`);
        if (!cancelled) {
          setPost(data.post);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(translateMessage(requestError.response?.data?.message || t('sharedPostError')));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPost();

    return () => {
      cancelled = true;
    };
  }, [language, postId]);

  async function toggleLike() {
    const { data } = await api.post(`/posts/${postId}/like`);
    setPost((current) => (current ? { ...current, likes: data.likes } : current));
  }

  async function addComment(_targetPostId, content) {
    const { data } = await api.post(`/posts/${postId}/comment`, { content });
    setPost((current) =>
      current
        ? {
            ...current,
            comments: [...(current.comments || []), data.comment]
          }
        : current
    );
  }

  async function sharePost() {
    const { data } = await api.post(`/posts/${postId}/share`);

    if (navigator.share) {
      try {
        await navigator.share({ title: 'TalentHive Post', url: data.shareLink });
      } catch {
        await navigator.clipboard.writeText(data.shareLink);
      }
    } else {
      await navigator.clipboard.writeText(data.shareLink);
    }

    setBanner(t('postShareReadyBanner'));
    setPost((current) => (current ? { ...current, sharesCount: data.sharesCount } : current));
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_40%),linear-gradient(180deg,_#020617,_#0f172a)] text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-200/80">{t('sharedPostLabel')}</p>
            <h1 className="mt-2 text-3xl font-semibold">TalentHive</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">{t('sharedPostDescription')}</p>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <div className="w-full min-w-[220px] sm:w-64">
              <LanguageSelector />
            </div>
            <Link
              to={token ? '/' : '/login'}
              className="rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/15"
            >
              {token ? t('sharedPostBackToFeed') : t('sharedPostSignIn')}
            </Link>
          </div>
        </div>

        {banner && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{banner}</div>}

        {loading && (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-sm text-slate-300 backdrop-blur-xl">
            {t('sharedPostLoading')}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[28px] border border-rose-400/20 bg-rose-500/10 p-8 text-sm text-rose-100">
            {error}
          </div>
        )}

        {!loading && post && (
          <PostCard
            post={post}
            currentUserId={user?._id}
            onLike={toggleLike}
            onComment={addComment}
            onShare={sharePost}
            readOnly={!token}
          />
        )}
      </div>
    </div>
  );
}
