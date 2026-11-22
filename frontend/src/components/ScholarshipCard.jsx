import { DeadlineBadge, StatusPill } from './ui';
import { useLang } from '../i18n';
import { fmtDate, inr } from '../utils';

export function RuleChips({ s }) {
  const chips = [];
  chips.push(s.categories.length ? s.categories.join(' / ') : 'All categories');
  if (s.maxIncome != null) chips.push(`Income < ${inr(s.maxIncome)}`);
  if (s.minMarks) chips.push(`Min ${s.minMarks}% marks`);
  if (s.courses.length) chips.push(s.courses.length > 2 ? `${s.courses.slice(0, 2).join(', ')} +${s.courses.length - 2}` : s.courses.join(', '));
  if (s.states.length) chips.push(s.states.length > 2 ? `${s.states.length} states` : s.states.join(', '));
  return <div className="rule-chips">{chips.map((c) => <span key={c} className="rule-chip">{c}</span>)}</div>;
}

export function EligibilityTag({ eligibility }) {
  if (!eligibility) return null;
  if (eligibility.eligible) return <span className="elig elig-yes">✓ You are eligible</span>;
  return <span className="elig elig-no" title={`Not met: ${eligibility.failed.join(', ')}`}>✗ Not met: {eligibility.failed.join(', ')}</span>;
}

export default function ScholarshipCard({ s, application, onOpen, onToggleBookmark, compared, onToggleCompare }) {
  const { t } = useLang();
  const bookmarked = application && application.status === 'bookmarked';
  const canBookmark = !application || application.status === 'bookmarked';
  return (
    <article className={`card sch-card ${compared ? 'sch-compared' : ''}`}>
      <div className="sch-top">
        <span className={`type-tag type-${s.type}`}>{s.type}</span>
        {application && !bookmarked && <StatusPill status={application.status} />}
        {canBookmark && onToggleBookmark && (
          <button className={`icon-btn bm ${bookmarked ? 'bm-on' : ''}`} onClick={() => onToggleBookmark(s)} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'} title={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
            {bookmarked ? '★' : '☆'}
          </button>
        )}
      </div>
      <h3 className="sch-title" onClick={() => onOpen(s)}>{s.title}</h3>
      <p className="sch-provider">{s.provider}</p>
      <div className="sch-amount">{inr(s.amount)} <small>{t('per year')}</small></div>
      <RuleChips s={s} />
      <EligibilityTag eligibility={s.eligibility} />
      <div className="sch-foot">
        <div>
          <div className="sch-date">{t('Last date')}: {fmtDate(s.lastDate)}</div>
          <DeadlineBadge date={s.lastDate} />
        </div>
        <div className="sch-actions">
          {onToggleCompare && (
            <label className="compare-check"><input type="checkbox" checked={Boolean(compared)} onChange={() => onToggleCompare(s)} /> {t('Compare')}</label>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => onOpen(s)}>{t('View details')}</button>
        </div>
      </div>
    </article>
  );
}
