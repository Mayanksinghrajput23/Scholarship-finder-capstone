import { useCallback, useEffect, useState } from 'react';
import { api, download } from '../../api';
import { useMeta } from '../../hooks';
import { useNotify } from '../../context/NotifyContext';
import { Empty, ErrorBox, Pagination, Spinner } from '../../components/ui';
import { fmtDate, STATUS_LABEL } from '../../utils';

export default function AdminApplications() {
  const meta = useMeta();
  const { toast } = useNotify();
  const [items, setItems] = useState([]);
  const [pageMeta, setPageMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api('/applications', { params: { page, limit: 10, status } });
      setItems(r.data);
      setPageMeta(r.meta);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const change = async (id, next) => {
    try {
      await api(`/applications/${id}/status`, { method: 'PATCH', body: { status: next } });
      toast('Status updated. The student was notified.', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const exportCsv = async () => {
    try {
      await download('/applications/export', 'scholarmatch-applications.csv', { status });
      toast('CSV downloaded', 'success');
    } catch (e) { toast(e.message, 'error'); }
  };

  const options = meta.statuses.filter((s) => s !== 'bookmarked');

  return (
    <>
      <div className="page-head"><div><h1>Applications</h1><p className="muted">Move applications through verification, sanction and payment.</p></div></div>
      <section className="card filters">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status filter">
          <option value="">All applied</option>{options.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <button className="btn btn-ghost" onClick={exportCsv}>⬇ Export CSV</button>
      </section>
      <ErrorBox message={error} />
      {loading && items.length === 0 ? <Spinner /> : items.length === 0 ? <Empty icon="📄" title="No applications" /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Student</th><th>Scholarship</th><th>Updated</th><th>Status</th></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a._id}>
                  <td><strong>{a.user ? a.user.name : 'Deleted user'}</strong><div className="muted small">{a.user && a.user.email}</div></td>
                  <td>{a.scholarship ? a.scholarship.title : '—'}</td>
                  <td>{fmtDate(a.updatedAt)}</td>
                  <td>
                    <select value={a.status} onChange={(e) => change(a._id, e.target.value)} aria-label="Change status">
                      {options.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={pageMeta} onPage={setPage} />
    </>
  );
}
