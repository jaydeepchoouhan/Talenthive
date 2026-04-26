import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../api/client';
import CreatePostCard from '../components/CreatePostCard';
import InternshipApplicationsCard from '../components/InternshipApplicationsCard';
import Navbar from '../components/Navbar';
import PeopleSidebar from '../components/PeopleSidebar';
import PostCard from '../components/PostCard';
import ResumeBuilderCard from '../components/ResumeBuilderCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  autoConnect: false
});

export default function FeedPage() {
  const { user, refreshUser } = useAuth();
  const { language, t, translateMessage } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [postingStatus, setPostingStatus] = useState(null);
  const [banner, setBanner] = useState('');

  async function loadAll() {
    try {
      const [postsRes, usersRes, statusRes] = await Promise.all([
        api.get('/posts'),
        api.get('/users'),
        api.get('/posts/posting-status')
      ]);
      setPosts(postsRes.data.posts);
      setUsers(usersRes.data.users);
      setPostingStatus(statusRes.data);
    } catch (error) {
      setBanner(translateMessage(error.response?.data?.message || 'Unable to load feed.'));
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    socket.connect();
    socket.emit('join-user-room', user._id);

    socket.on('new-post', (incomingPost) => {
      setPosts((current) =>
        current.some((post) => post._id === incomingPost._id) ? current : [incomingPost, ...current]
      );
      setBanner(t('postNewArrivalBanner'));
    });

    socket.on('post-liked', ({ postId, likes }) => {
      setPosts((current) => current.map((post) => (post._id === postId ? { ...post, likes } : post)));
    });

    socket.on('new-comment', (incomingComment) => {
      setPosts((current) =>
        current.map((post) => {
          if (post._id !== incomingComment.post) return post;
          const exists = (post.comments || []).some((comment) => comment._id === incomingComment._id);
          return exists ? post : { ...post, comments: [...(post.comments || []), incomingComment] };
        })
      );
    });

    socket.on('post-shared', ({ postId, sharesCount }) => {
      setPosts((current) => current.map((post) => (post._id === postId ? { ...post, sharesCount } : post)));
    });

    socket.on('friend-request', ({ name }) => setBanner(t('postFriendRequestBanner', { name })));
    socket.on('friend-accepted', ({ name }) => setBanner(t('postFriendAcceptedBanner', { name })));

    return () => {
      socket.off('new-post');
      socket.off('post-liked');
      socket.off('new-comment');
      socket.off('post-shared');
      socket.off('friend-request');
      socket.off('friend-accepted');
      socket.disconnect();
    };
  }, [language, user?._id]);

  async function createPost({ caption, files }) {
    const formData = new FormData();
    formData.append('caption', caption);
    files.forEach((file) => formData.append('media', file));
    await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    const statusRes = await api.get('/posts/posting-status');
    setPostingStatus(statusRes.data);
  }

  async function toggleLike(postId) {
    const { data } = await api.post(`/posts/${postId}/like`);
    setPosts((current) => current.map((post) => (post._id === postId ? { ...post, likes: data.likes } : post)));
  }

  async function addComment(postId, content) {
    await api.post(`/posts/${postId}/comment`, { content });
  }

  async function share(postId) {
    const { data } = await api.post(`/posts/${postId}/share`);
    setBanner(t('postShareReadyBanner'));
    if (navigator.share) {
      try {
        await navigator.share({ title: 'TalentHive Post', url: data.shareLink });
      } catch {
        await navigator.clipboard?.writeText(data.shareLink);
      }
    } else {
      await navigator.clipboard?.writeText(data.shareLink);
    }
    setPosts((current) => current.map((post) => (post._id === postId ? { ...post, sharesCount: data.sharesCount } : post)));
  }

  async function sendFriendRequest(targetUserId) {
    await api.post(`/users/friend-request/${targetUserId}`);
    setBanner(t('postFriendRequestSentSuccess'));
    await loadAll();
  }

  async function acceptFriend(requesterId) {
    await api.post(`/users/accept-request/${requesterId}`);
    await Promise.all([loadAll(), refreshUser()]);
    setBanner(t('postFriendAcceptedSuccess'));
  }

  async function saveResume(formValues, photoFile) {
    try {
      const formData = new FormData();
      formData.append('fullName', formValues.fullName);
      formData.append('qualification', formValues.qualification);
      formData.append('experience', formValues.experience);
      formData.append('personalDetails', formValues.personalDetails);

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const { data } = await api.patch('/users/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await refreshUser();
      const message = translateMessage(data.message);
      setBanner(message);
      return { ok: true, message };
    } catch (error) {
      const message = translateMessage(error.response?.data?.message || 'Unable to save resume.');
      setBanner(message);
      return { ok: false, error: message };
    }
  }

  async function applyForInternship(formValues) {
    try {
      const { data } = await api.post('/users/internship-applications', formValues);
      await refreshUser();
      const message = translateMessage(data.message);
      setBanner(message);
      return { ok: true, message };
    } catch (error) {
      const message = translateMessage(error.response?.data?.message || 'Unable to submit application.');
      setBanner(message);
      return { ok: false, error: message };
    }
  }

  const sortedPosts = useMemo(() => posts, [posts]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#020617,_#0f172a)]">
      <Navbar postingStatus={postingStatus} />

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {banner && <div className="mb-4 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">{banner}</div>}

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <ResumeBuilderCard user={user} onSave={saveResume} />
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-white">{t('postingRulesTitle')}</h2>
              <ul className="space-y-3 text-sm text-slate-300">
                <li>{t('postingRuleOne')}</li>
                <li>{t('postingRuleTwo')}</li>
                <li>{t('postingRuleUnlimited')}</li>
              </ul>
              <div className="rounded-2xl bg-slate-900/60 p-4 text-sm text-slate-300">
                {t('postingTodayUsed', { count: postingStatus?.postsToday ?? 0 })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <CreatePostCard postingStatus={postingStatus} onSubmit={createPost} />
            {sortedPosts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={user?._id}
                onLike={toggleLike}
                onComment={addComment}
                onShare={share}
              />
            ))}
          </div>

          <div className="space-y-6">
            <InternshipApplicationsCard user={user} onApply={applyForInternship} />
            <PeopleSidebar users={users} onAddFriend={sendFriendRequest} onAccept={acceptFriend} />
          </div>
        </div>
      </div>
    </div>
  );
}
