import { UserPlus, Users } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PeopleSidebar({ users, onAddFriend, onAccept }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div>
        <h3 className="text-lg font-semibold text-white">{t('peopleTitle')}</h3>
        <p className="text-sm text-slate-400">{t('peopleSubtitle')}</p>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user._id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">{user.name}</p>
                <p className="text-xs text-slate-400">{user.email || user.phone || t('peopleStudentUser')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                    <Users className="h-3.5 w-3.5" /> {t('peopleFriends', { count: user.friendCount })}
                  </div>
                  {user.hasResume && (
                    <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
                      {t('peopleResumeReady')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              {!user.isFriend && !user.requestSent && (
                <button
                  onClick={() => onAddFriend(user._id)}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white"
                >
                  <UserPlus className="h-4 w-4" /> {t('peopleAddFriend')}
                </button>
              )}
              {user.requestSent && <span className="text-xs text-amber-200">{t('peopleRequestSent')}</span>}
              {user.requestReceived && (
                <button
                  onClick={() => onAccept(user._id)}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white"
                >
                  {t('peopleAcceptRequest')}
                </button>
              )}
              {user.isFriend && <span className="text-xs text-emerald-200">{t('peopleAlreadyConnected')}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
