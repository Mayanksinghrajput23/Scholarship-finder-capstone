import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApplications } from '../hooks';
import { useNotify } from '../context/NotifyContext';
import { useLang } from '../i18n';
import { DeadlineBadge, Empty, Spinner, StatusPill } from '../components/ui';
import StatusTracker from '../components/StatusTracker';
import { fmtDate, inr } from '../utils';

// Documents the student needs for this scholarship, with a tick for each one that is ready.
function Checklist({ app, onToggle }) {
  const { t } = useLang();
  const items = app.checklist || [];
  if (items.length === 0) return null;
  const done = items.filter((c) => c.done).length;
  const pct = Math.round((done / items.length) * 100);
  return (
    <div className="checklist">
      <div className="meter-label"><span>📎 {t('Documents checklist')}</span><b>{done}/{items.length} {t('Documents ready')}</b></div>
      <div className="meter"><div style={{ width: `${pct}%` }} /></div>
      <ul>
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`}>
            <label className={c.done ? 'check-done' : ''}>
              <input type="checkbox" checked={c.done} onChange={(e) => onToggle(app._id, i, e.target.checked)} /> {c.label}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

// mode="bookmarks": saved scholarships.  mode="applications": everything the student has applied for.
export default function Applications({ mode }) {
  const { apps, loading, setStatus, remove, toggleChecklist } = useApplications();
  const { toast } = useNotify();
  const { t } = useLang();
  const [busyId, setBusyId] = useState(null);
  const bookmarks = mode === 'bookmarks';
  const list = apps.filter((a) => a.scholarship && (bookmarks ? a.status === 'bookmarked' : a.status !== 'bookmarked'));

  const act = async (id, fn, msg) => {
    setBusyId(id);
    try { await fn(); toast(msg, 'success'); } catch (e) { toast(e.message, 'error'); } finally { setBusyId(null); }
  };
  const tick = (id, index, done) => toggleChecklist(id, index, done).catch((e) => toast(e.message, 'error'));

  if (loading) return <Spinner />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{bookmarks ? t('My Bookmarks') : t('My Applications')}</h1>
          <p className="muted">{bookmarks ? t('Scholarships you saved for later.') : t('Track every application through the NSP stages.')}</p>
        </div>
      </div>

      {list.length === 0 ? (
        <Empty icon={bookmarks ? '🔖' : '📄'} title={bookmarks ? t('No bookmarks yet') : t('No applications yet')}>
          <Link to="/scholarships">{t('Find Scholarships')}</Link> {bookmarks ? '— tap the ☆ to save one' : '— press Apply Now'}.
        </Empty>
      ) : list.map((a) => {
        const s = a.scholarship;
        const closed = new Date(s.lastDate) < new Date();
        return (
          <article key={a._id} className="card app-card">
            <div className="app-top">
              <div>
                <h3>{s.title}</h3>
                <p className="muted">{s.provider} · {inr(s.amount)}/yr · {t('Last date')} {fmtDate(s.lastDate)}</p>
              </div>
              <div className="app-top-r"><DeadlineBadge date={s.lastDate} /><StatusPill status={a.status} /></div>
            </div>

            {!bookmarks && <StatusTracker status={a.status} />}
            <Checklist app={a} onToggle={tick} />

            <div className="app-actions">
              {s.applyLink && <a className="btn btn-ghost btn-sm" href={s.applyLink} target="_blank" rel="noopener noreferrer">{t('Open official site')}</a>}
              {bookmarks && (
                <button className="btn btn-primary btn-sm" disabled={closed || busyId === a._id} onClick={() => act(a._id, () => setStatus(s._id, 'applied'), 'Marked as applied')}>
                  {closed ? 'Closed' : t('Mark as applied')}
                </button>
              )}
              {a.status === 'applied' && (
                <button className="btn btn-ghost btn-sm" disabled={busyId === a._id} onClick={() => act(a._id, () => setStatus(s._id, 'bookmarked'), 'Moved back to bookmarks')}>{t('Undo apply')}</button>
              )}
              {['bookmarked', 'applied'].includes(a.status) && (
                <button className="btn btn-danger btn-sm" disabled={busyId === a._id} onClick={() => act(a._id, () => remove(a._id), 'Removed')}>{t('Remove')}</button>
              )}
            </div>
          </article>
        );
      })}
    </>
  );
}
