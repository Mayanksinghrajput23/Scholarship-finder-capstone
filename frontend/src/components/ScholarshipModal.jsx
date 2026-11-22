import { useState } from 'react';
import { DeadlineBadge, Modal, StatusPill } from './ui';
import { EligibilityTag, RuleChips } from './ScholarshipCard';
import { fmtDate, inr } from '../utils';
import { useNotify } from '../context/NotifyContext';

// Details + eligibility explanation + Apply Now.
export default function ScholarshipModal({ s, application, setStatus, onClose }) {
  const { toast } = useNotify();
  const [busy, setBusy] = useState(false);
  const closed = new Date(s.lastDate) < new Date();
  const processing = application && !['bookmarked', 'applied'].includes(application.status);

  const run = async (status, okMsg) => {
    setBusy(true);
    try {
      await setStatus(s._id, status);
      toast(okMsg, 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const applyNow = async () => {
    // Open the official site first (inside the click handler so popup blockers allow it).
    if (s.applyLink) window.open(s.applyLink, '_blank', 'noopener,noreferrer');
    if (!application || application.status === 'bookmarked') await run('applied', 'Marked as applied. Track it under My Applications.');
  };

  return (
    <Modal title={s.title} onClose={onClose} wide>
      <div className="detail-head">
        <div>
          <p className="sch-provider">{s.provider} · <span className={`type-tag type-${s.type}`}>{s.type}</span></p>
          <div className="sch-amount">{inr(s.amount)} <small>per year</small></div>
        </div>
        <div className="detail-dates">
          <div className="sch-date">Last date: {fmtDate(s.lastDate)}</div>
          <DeadlineBadge date={s.lastDate} />
        </div>
      </div>

      {s.description && <p className="detail-desc">{s.description}</p>}
      <RuleChips s={s} />

      {s.eligibility && (
        <>
          <h4 className="detail-h">Your eligibility <EligibilityTag eligibility={s.eligibility} /></h4>
          <table className="table table-compact">
            <thead><tr><th>Rule</th><th>Required</th><th>You</th><th /></tr></thead>
            <tbody>
              {s.eligibility.checks.map((c) => (
                <tr key={c.rule}>
                  <td>{c.rule}</td><td>{c.required}</td><td>{c.actual}</td>
                  <td className={c.pass ? 'ok' : 'bad'}>{c.pass ? '✓' : '✗'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {s.prerequisites && s.prerequisites.length > 0 && (
        <>
          <h4 className="detail-h">Before you apply</h4>
          <ul className="list">{s.prerequisites.map((p) => <li key={p}>{p}</li>)}</ul>
        </>
      )}

      <div className="modal-actions">
        {application && <span>Your status: <StatusPill status={application.status} /></span>}
        <div className="spacer" />
        {!processing && application && application.status === 'bookmarked' && (
          <button className="btn btn-ghost" disabled={busy} onClick={() => run('bookmarked', 'Saved')}>★ Bookmarked</button>
        )}
        {!application && !closed && (
          <button className="btn btn-ghost" disabled={busy} onClick={() => run('bookmarked', 'Added to bookmarks')}>☆ Bookmark</button>
        )}
        {!processing && !(application && application.status === 'applied') && (
          <button className="btn btn-primary" disabled={busy || closed} onClick={applyNow}>
            {closed ? 'Closed' : 'Apply Now →'}
          </button>
        )}
        {application && application.status === 'applied' && s.applyLink && (
          <a className="btn btn-ghost" href={s.applyLink} target="_blank" rel="noopener noreferrer">Open official site</a>
        )}
      </div>
    </Modal>
  );
}
