import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { BarList, ErrorBox, Pagination, Spinner, StatCard, StatusPill } from '../../components/ui';
import { Donut, LineChart } from '../../components/charts';
import { fmtDate, inr, STATUS_LABEL } from '../../utils';

const RANGES = [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly']];
const STATUS_COLOR = {
  applied: '#5b3fe0', institute_verification: '#2563eb', l2_verification: '#0ea5e9',
  sanctioned: '#12a05c', paid: '#0d9488', rejected: '#d63a3a',
};
const ICON = { user: '🧑‍🎓', application: '📄', scholarship: '🎓' };

const ago = (d) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} hr ago`;
  return `${Math.round(m / 1440)} days ago`;
};

// Every number here comes from MongoDB aggregation pipelines (see backend report.controller.js).
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [range, setRange] = useState('monthly');
  const [trend, setTrend] = useState(null);
  const [recent, setRecent] = useState({ items: [], meta: null });
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([
      api('/reports/overview'), api('/reports/applications-by-scholarship'),
      api('/reports/scholarships-by-category'), api('/reports/recent-activity'),
    ])
      .then(([o, t, c, a]) => setData({ overview: o.data, top: t.data, categories: c.data, activity: a.data }))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    api('/reports/trend', { params: { range } }).then((r) => setTrend(r.data)).catch((e) => setError(e.message));
  }, [range]);

  useEffect(() => {
    api('/applications', { params: { page, limit: 5 } })
      .then((r) => setRecent({ items: r.data, meta: r.meta }))
      .catch((e) => setError(e.message));
  }, [page]);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Spinner />;

  const { overview, top, categories, activity } = data;
  const count = (s) => (overview.applicationsByStatus.find((x) => x._id === s) || {}).count || 0;
  const submitted = overview.applicationsByStatus.filter((s) => s._id !== 'bookmarked').reduce((n, s) => n + s.count, 0);
  const pending = count('applied') + count('institute_verification') + count('l2_verification');
  const donutRows = Object.keys(STATUS_COLOR).map((s) => ({ label: STATUS_LABEL[s], value: count(s), color: STATUS_COLOR[s] }));
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <div className="page-head">
        <div><h1>Dashboard Overview</h1><p className="muted">Welcome back! Here is what is happening on ScholarMatch.</p></div>
        <span className="date-chip">📅 {today}</span>
      </div>

      <section className="stats">
        <StatCard icon="🧑‍🎓" value={overview.students} label={`New registrations (${overview.activeStudents} active)`} />
        <StatCard icon="🎓" tone="green" value={overview.openScholarships} label="Active scholarships" />
        <StatCard icon="📄" tone="blue" value={submitted} label="Applications submitted" />
        <StatCard icon="⏳" tone="amber" value={pending} label="Pending approvals" />
      </section>

      <div className="grid-main">
        <section className="card">
          <div className="chart-head">
            <div><h3>Monthly Performance Overview</h3><p className="muted small">Applications submitted and new student registrations</p></div>
            <div className="chart-totals">
              <div><span className="muted small">Total applications</span><b>{submitted}</b></div>
              <div><span className="muted small">Open amount</span><b>{inr(overview.totalOpenAmount)}</b></div>
            </div>
          </div>
          <div className="tabs" role="tablist">
            {RANGES.map(([k, l]) => (
              <button key={k} role="tab" aria-selected={range === k} className={`tab ${range === k ? 'tab-on' : ''}`} onClick={() => setRange(k)}>{l}</button>
            ))}
          </div>
          {trend ? (
            <LineChart labels={trend.labels} series={[
              { name: 'Applications', values: trend.applications, color: '#5b3fe0' },
              { name: 'Registrations', values: trend.registrations, color: '#f59e0b' },
            ]} />
          ) : <Spinner />}
          <div className="chart-legend"><span><i style={{ background: '#5b3fe0' }} />Applications</span><span><i style={{ background: '#f59e0b' }} />Registrations</span></div>
        </section>

        <section className="card">
          <div className="card-head"><h3>Analytics Breakdown</h3></div>
          <p className="muted small" style={{ marginTop: -8, marginBottom: 12 }}>Where submitted applications stand</p>
          <Donut rows={donutRows} />
        </section>
      </div>

      <section className="stats">
        <StatCard icon="💰" value={inr(overview.totalOpenAmount)} label="Total open scholarship amount" />
        <StatCard icon="✅" tone="green" value={count('sanctioned') + count('paid')} label="Sanctioned / paid" />
        <StatCard icon="⚡" tone="amber" value={overview.closingSoon} label="Closing in 7 days" />
        <StatCard icon="✗" tone="red" value={count('rejected')} label="Rejected" />
      </section>

      <div className="grid-bottom">
        <section className="card">
          <div className="card-head"><h3>Recent Activities</h3></div>
          {activity.length === 0 ? <p className="muted">No activity yet.</p> : activity.map((a, i) => (
            <div className="activity" key={i}>
              <span className="activity-icon">{ICON[a.type]}</span>
              <div><div className="activity-msg">{a.message}</div><div className="muted small">{ago(a.at)}</div></div>
            </div>
          ))}
        </section>

        <section className="card">
          <div className="card-head"><h3>Application Status</h3><Link to="/admin/applications">Manage all →</Link></div>
          {recent.items.length === 0 ? <p className="muted">No applications yet.</p> : (
            <div className="table-wrap flush">
              <table className="table">
                <thead><tr><th>Student</th><th>Scholarship</th><th>Updated</th><th>Status</th></tr></thead>
                <tbody>
                  {recent.items.map((a) => (
                    <tr key={a._id}>
                      <td><strong>{a.user ? a.user.name : 'Deleted user'}</strong></td>
                      <td>{a.scholarship ? a.scholarship.title : '—'}</td>
                      <td>{fmtDate(a.updatedAt)}</td>
                      <td><StatusPill status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {recent.meta && <p className="muted small">Showing {recent.items.length} of {recent.meta.total} applications</p>}
          <Pagination meta={recent.meta} onPage={setPage} />
        </section>
      </div>

      <div className="grid-2 equal">
        <section className="card">
          <div className="card-head"><h3>Open scholarships by category</h3></div>
          <BarList rows={categories.map((c) => ({ label: c.category, count: c.count }))} />
          <table className="table table-compact">
            <thead><tr><th>Category</th><th>Total amount</th><th>Average</th></tr></thead>
            <tbody>{categories.map((c) => <tr key={c.category}><td>{c.category}</td><td>{inr(c.totalAmount)}</td><td>{inr(c.avgAmount)}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="card">
          <div className="card-head"><h3>Most popular scholarships</h3></div>
          {top.length === 0 ? <p className="muted">No applications yet.</p> : (
            <div className="table-wrap flush">
              <table className="table table-compact">
                <thead><tr><th>Scholarship</th><th>Total</th><th>Applied</th><th>Saved</th><th>Sanctioned</th></tr></thead>
                <tbody>
                  {top.map((t) => (
                    <tr key={t.scholarshipId}>
                      <td><strong>{t.title}</strong><div className="muted small">{t.provider}</div></td>
                      <td>{t.total}</td><td>{t.applied}</td><td>{t.bookmarked}</td><td>{t.sanctioned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
