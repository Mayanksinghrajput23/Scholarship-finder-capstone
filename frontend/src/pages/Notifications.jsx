import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../context/NotifyContext';
import { useLang } from '../i18n';
import { Empty } from '../components/ui';

const ICON = { scholarship: '🎓', status: '📄', reminder: '⏰', admin: '👤' };

// Stored in MongoDB (so nothing is lost while you are offline) and delivered live through Socket.IO.
export default function Notifications() {
  const { items, markAllRead, clearAll } = useNotify();
  const { t } = useLang();
  const navigate = useNavigate();
  useEffect(() => { markAllRead(); }, [markAllRead, items.length]);

  return (
    <>
      <div className="page-head">
        <div><h1>{t('Notifications')}</h1><p className="muted">{t('Live updates: new matching scholarships and application status changes.')}</p></div>
        {items.length > 0 && <button className="btn btn-ghost btn-sm" onClick={clearAll}>{t('Clear all')}</button>}
      </div>
      {items.length === 0 ? (
        <Empty icon="🔔" title={t('You are all caught up')}>New alerts and deadline reminders appear here.</Empty>
      ) : (
        <div className="card">
          {items.map((n) => (
            <div key={n._id} className={`notif ${n.link ? 'notif-click' : ''}`} onClick={() => n.link && navigate(n.link)}>
              <span className="notif-icon">{ICON[n.type] || '🔔'}</span>
              <div><div>{n.message}</div><div className="muted small">{new Date(n.createdAt).toLocaleString('en-IN')}</div></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
