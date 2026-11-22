import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { useMeta } from '../../hooks';
import { useNotify } from '../../context/NotifyContext';
import { DeadlineBadge, Empty, ErrorBox, Field, Modal, MultiSelect, Pagination, Spinner } from '../../components/ui';
import ImportModal from '../../components/ImportModal';
import { fieldErrors, fmtDate, inr } from '../../utils';

const BLANK = {
  title: '', provider: '', type: 'merit', description: '', amount: '', categories: [], maxIncome: '',
  courses: [], states: [], minMarks: '0', prerequisites: '', applyLink: '', lastDate: '', isActive: true,
};

const toForm = (s) => ({
  ...BLANK, ...s,
  amount: String(s.amount), maxIncome: s.maxIncome == null ? '' : String(s.maxIncome), minMarks: String(s.minMarks || 0),
  prerequisites: (s.prerequisites || []).join('\n'), applyLink: s.applyLink || '', lastDate: s.lastDate.slice(0, 10),
});

function ScholarshipForm({ initial, onClose, onSaved }) {
  const meta = useMeta();
  const { toast } = useNotify();
  const [form, setForm] = useState(initial ? toForm(initial) : BLANK);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setError('');
    setSaving(true);
    const body = {
      ...form,
      amount: Number(form.amount),
      maxIncome: form.maxIncome === '' ? null : Number(form.maxIncome),
      minMarks: Number(form.minMarks) || 0,
      prerequisites: form.prerequisites.split('\n').map((x) => x.trim()).filter(Boolean),
    };
    delete body._id; delete body.__v; delete body.createdAt; delete body.updatedAt; delete body.createdBy;
    try {
      if (initial) await api(`/scholarships/${initial._id}`, { method: 'PATCH', body });
      else await api('/scholarships', { method: 'POST', body });
      toast(initial ? 'Scholarship updated' : 'Scholarship added. Eligible students were notified.', 'success');
      onSaved();
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={initial ? 'Edit scholarship' : 'Add scholarship'} onClose={onClose} wide>
      <form onSubmit={submit} noValidate>
        <ErrorBox message={error} />
        <div className="form-grid">
          <Field label="Title" error={errors.title}><input value={form.title} onChange={set('title')} /></Field>
          <Field label="Provider" error={errors.provider}><input value={form.provider} onChange={set('provider')} /></Field>
          <Field label="Type" error={errors.type}>
            <select value={form.type} onChange={set('type')}>{meta.types.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          </Field>
          <Field label="Amount per year (₹)" error={errors.amount}><input type="number" min="0" value={form.amount} onChange={set('amount')} /></Field>
          <Field label="Last date" error={errors.lastDate}><input type="date" value={form.lastDate} onChange={set('lastDate')} /></Field>
          <Field label="Apply link" error={errors.applyLink}><input value={form.applyLink} onChange={set('applyLink')} placeholder="https://…" /></Field>
        </div>
        <Field label="Description" error={errors.description}><textarea rows="3" value={form.description} onChange={set('description')} /></Field>

        <h4 className="detail-h">Eligibility rules <span className="muted small">(leave empty = no restriction)</span></h4>
        <Field label="Categories" error={errors.categories}><MultiSelect options={meta.categories} value={form.categories} onChange={(v) => setForm({ ...form, categories: v })} /></Field>
        <Field label="Courses" error={errors.courses}><MultiSelect options={meta.courses} value={form.courses} onChange={(v) => setForm({ ...form, courses: v })} /></Field>
        <Field label="States" error={errors.states}><MultiSelect scroll options={meta.states} value={form.states} onChange={(v) => setForm({ ...form, states: v })} /></Field>
        <div className="form-grid">
          <Field label="Income limit (₹)" error={errors.maxIncome} hint="Empty = no limit"><input type="number" min="0" value={form.maxIncome} onChange={set('maxIncome')} /></Field>
          <Field label="Minimum marks (%)" error={errors.minMarks}><input type="number" min="0" max="100" value={form.minMarks} onChange={set('minMarks')} /></Field>
        </div>
        <Field label="Prerequisites" hint="One per line"><textarea rows="3" value={form.prerequisites} onChange={set('prerequisites')} /></Field>
        <label className="toggle"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Visible to students</label>

        <div className="modal-actions"><div className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminScholarships() {
  const { toast } = useNotify();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api('/scholarships', { params: { page, limit: 10, status, q } });
      setItems(r.data);
      setMeta(r.meta);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [page, status, q]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const remove = async (s) => {
    if (!window.confirm(`Delete "${s.title}"? Students' bookmarks and applications for it will be removed too.`)) return;
    try { await api(`/scholarships/${s._id}`, { method: 'DELETE' }); toast('Deleted', 'success'); load(); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Scholarships</h1><p className="muted">Add scholarships with rules, and edit deadlines.</p></div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={() => setImporting(true)}>⬆ Import CSV</button>
          <button className="btn btn-primary" onClick={() => setEditing(null)}>＋ Add scholarship</button>
        </div>
      </div>
      <section className="card filters">
        <input className="filters-q" placeholder="Search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="all">All</option><option value="open">Open</option><option value="expired">Expired</option>
        </select>
      </section>
      <ErrorBox message={error} />
      {loading && items.length === 0 ? <Spinner /> : items.length === 0 ? <Empty title="No scholarships" /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Scholarship</th><th>Type</th><th>Amount</th><th>Last date</th><th>Visible</th><th /></tr></thead>
            <tbody>
              {items.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.title}</strong><div className="muted small">{s.provider}</div></td>
                  <td><span className={`type-tag type-${s.type}`}>{s.type}</span></td>
                  <td>{inr(s.amount)}</td>
                  <td>{fmtDate(s.lastDate)}<div><DeadlineBadge date={s.lastDate} /></div></td>
                  <td>{s.isActive ? 'Yes' : 'Hidden'}</td>
                  <td className="actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(s)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(s)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={meta} onPage={setPage} />
      {importing && <ImportModal onClose={() => setImporting(false)} onDone={load} />}
      {editing !== undefined && (
        <ScholarshipForm initial={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load(); }} />
      )}
    </>
  );
}
