import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { useNotify } from '../../context/NotifyContext';
import { Empty, ErrorBox, Pagination, Spinner } from '../../components/ui';
import { fmtDate, inr } from '../../utils';

export default function AdminStudents() {
  const { toast } = useNotify();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api('/users', { params: { page, limit: 10, q } });
      setItems(r.data);
      setMeta(r.meta);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [page, q]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const toggle = async (u) => {
    try {
      await api(`/users/${u.id}/active`, { method: 'PATCH', body: { isActive: !u.isActive } });
      toast(u.isActive ? 'Student deactivated' : 'Student activated', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-head"><div><h1>Students</h1><p className="muted">View profiles and deactivate accounts.</p></div></div>
      <section className="card filters">
        <input className="filters-q" placeholder="Search by name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </section>
      <ErrorBox message={error} />
      {loading && items.length === 0 ? <Spinner /> : items.length === 0 ? <Empty icon="👥" title="No students found" /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Student</th><th>Profile</th><th>Joined</th><th>Status</th><th /></tr></thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong><div className="muted small">{u.email}</div></td>
                  <td>{u.profile ? `${u.profile.category} · ${inr(u.profile.income)} · ${u.profile.course} · ${u.profile.state} · ${u.profile.marks}%` : <span className="muted">Not filled</span>}</td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td>{u.isActive ? <span className="badge badge-green">Active</span> : <span className="badge badge-grey">Deactivated</span>}</td>
                  <td className="actions"><button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-ghost'}`} onClick={() => toggle(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={meta} onPage={setPage} />
    </>
  );
}
