import { DeadlineBadge, Modal } from './ui';
import { fmtDate, inr } from '../utils';

// Side-by-side comparison of up to 3 scholarships. The best amount and the earliest deadline are highlighted.
export default function CompareModal({ items, onClose, onRemove }) {
  const bestAmount = Math.max(...items.map((s) => s.amount));
  const earliest = Math.min(...items.map((s) => new Date(s.lastDate).getTime()));
  const list = (a, fallback) => (a && a.length ? a.join(', ') : fallback);

  const rows = [
    ['Provider', (s) => s.provider],
    ['Type', (s) => <span className={`type-tag type-${s.type}`}>{s.type}</span>],
    ['Amount per year', (s) => <b className={s.amount === bestAmount ? 'best' : ''}>{inr(s.amount)}</b>],
    ['Last date', (s) => (
      <div className={new Date(s.lastDate).getTime() === earliest ? 'urgent-cell' : ''}>{fmtDate(s.lastDate)}<div><DeadlineBadge date={s.lastDate} /></div></div>
    )],
    ['Categories', (s) => list(s.categories, 'All')],
    ['Income limit', (s) => (s.maxIncome == null ? 'No limit' : `up to ${inr(s.maxIncome)}`)],
    ['Minimum marks', (s) => (s.minMarks ? `${s.minMarks}%` : 'None')],
    ['Courses', (s) => list(s.courses, 'All')],
    ['States', (s) => list(s.states, 'All')],
    ['Documents needed', (s) => list(s.prerequisites, '—')],
    ['Your eligibility', (s) => (!s.eligibility ? '—' : s.eligibility.eligible
      ? <span className="elig elig-yes">✓ Eligible</span>
      : <span className="elig elig-no">✗ Not met: {s.eligibility.failed.join(', ')}</span>)],
  ];

  return (
    <Modal title="Compare scholarships" onClose={onClose} wide>
      <div className="table-wrap flush">
        <table className="table compare-table">
          <thead>
            <tr>
              <th />
              {items.map((s) => (
                <th key={s._id}>
                  <div className="compare-title">{s.title}</div>
                  <button className="link-btn" onClick={() => onRemove(s)}>Remove</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, cell]) => (
              <tr key={label}><th scope="row">{label}</th>{items.map((s) => <td key={s._id}>{cell(s)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small">Green amount = highest. Highlighted date = closes first.</p>
    </Modal>
  );
}
