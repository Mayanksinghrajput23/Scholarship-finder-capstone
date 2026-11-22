import { useEffect } from 'react';
import { daysLeft, fmtDate, STATUS_LABEL } from '../utils';
import { useLang } from '../i18n';

export function Spinner({ label = 'Loading…' }) {
  return <div className="spinner-wrap"><div className="spinner" /><span>{label}</span></div>;
}

export function Empty({ icon = '🔍', title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h4>{title}</h4>
      {children && <p>{children}</p>}
    </div>
  );
}

export function ErrorBox({ message }) {
  return message ? <div className="alert alert-error" role="alert">{message}</div> : null;
}

// 7 days or less = red, 30 days or less = amber, otherwise green.
export function DeadlineBadge({ date }) {
  const d = daysLeft(date);
  let cls = 'badge-green';
  let text = `${d} days left`;
  if (d <= 0) { cls = 'badge-grey'; text = 'Closed'; }
  else if (d <= 7) { cls = 'badge-red'; text = d === 1 ? 'Closes tomorrow' : `Closes in ${d} days`; }
  else if (d <= 30) cls = 'badge-amber';
  return <span className={`badge ${cls}`}>⏱ {text}</span>;
}

export function StatusPill({ status }) {
  const { t } = useLang();
  return <span className={`pill pill-${status}`}>{t(STATUS_LABEL[status] || status)}</span>;
}

export function DateText({ date }) {
  return <span>{fmtDate(date)}</span>;
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <div className="pagination">
      <button className="btn btn-ghost btn-sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>← Prev</button>
      <span>Page {meta.page} of {meta.pages} · {meta.total} results</span>
      <button className="btn btn-ghost btn-sm" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>Next →</button>
    </div>
  );
}

// Controlled form field wrapper with inline error.
export function Field({ label, error, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

// Checkbox chips for "any of" rules; empty selection means "no restriction".
export function MultiSelect({ options, value, onChange, scroll }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);
  return (
    <div className={`chips ${scroll ? 'chips-scroll' : ''}`}>
      {options.map((o) => (
        <button type="button" key={o} className={`chip ${value.includes(o) ? 'chip-on' : ''}`} onClick={() => toggle(o)}>{o}</button>
      ))}
    </div>
  );
}

export function StatCard({ icon, tone = 'purple', value, label, onClick }) {
  return (
    <div className={`stat ${onClick ? 'stat-click' : ''}`} onClick={onClick}>
      <div className={`stat-icon tone-${tone}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export function BarList({ rows, valueKey = 'count', labelKey = 'label', format = (v) => v }) {
  const max = Math.max(1, ...rows.map((r) => r[valueKey]));
  return (
    <div className="bars">
      {rows.map((r) => (
        <div key={r[labelKey]} className="bar-row">
          <span className="bar-label">{r[labelKey]}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(r[valueKey] / max) * 100}%` }} /></div>
          <span className="bar-value">{format(r[valueKey])}</span>
        </div>
      ))}
    </div>
  );
}
