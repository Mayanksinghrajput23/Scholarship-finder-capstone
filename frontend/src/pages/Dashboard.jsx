import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useApplications } from '../hooks';
import { useLang } from '../i18n';
import { DeadlineBadge, Empty, ErrorBox, Spinner, StatCard } from '../components/ui';
import ScholarshipModal from '../components/ScholarshipModal';
import { EligibilityTag } from '../components/ScholarshipCard';
import { fmtDate, inr, profileCompleteness, STATUS_FLOW, STATUS_LABEL } from '../utils';

function Row({ s, onOpen }) {
  const { t } = useLang();
  return (
    <div className="row-item">
      <div className="row-main">
        <div className="row-title" onClick={() => onOpen(s)}>{s.title}</div>
        <div className="row-sub">{s.provider} · {inr(s.amount)}/yr</div>
        {s.eligibility && !s.eligibility.eligible && <EligibilityTag eligibility={s.eligibility} />}
      </div>
      <div className="row-side">
        <div className="sch-date">Last date: {fmtDate(s.lastDate)}</div>
        <DeadlineBadge date={s.lastDate} />
      </div>
      <button className="btn btn-primary btn-sm" onClick={() => onOpen(s)}>{t('Apply Now')}</button>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(undefined);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);
  const { byScholarship, setStatus, reload } = useApplications();

  const load = useCallback(async () => {
    try {
      const [d, p] = await Promise.all([
        api('/dashboard/student'),
        api('/profile').then((r) => r.data).catch((e) => (e.status === 404 ? null : Promise.reject(e))),
      ]);
      setData(d.data);
      setProfile(p);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorBox message={error} />;
  if (!data || profile === undefined) return <Spinner />;

  const { stats, progress, eligible, closing, almostEligible } = data;
  const completeness = profileCompleteness(profile);
  const changed = async (id, status) => { await setStatus(id, status); await Promise.all([load(), reload()]); };
  const trackerCount = (st) => progress[st] || 0;
  const firstName = user.name.split(' ')[0];

  return (
    <>
      <section className="hero">
        <div>
          <p className="hero-hi">{t('Hi')} {firstName} 👋</p>
          <h1>Scholar<span>Match</span><br />{t('Your Smart Scholarship Finder')}</h1>
          <p>{t('Discover the best scholarships based on your profile and build a brighter future.')}</p>
          <button className="btn btn-primary" onClick={() => navigate(data.hasProfile ? '/scholarships?eligible=1' : '/profile')}>
            {data.hasProfile ? t('Find Eligible Scholarships →') : t('Complete your profile →')}
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">🎓</div>
      </section>

      {!data.hasProfile && (
        <div className="alert alert-warn">
          <strong>Add your profile to unlock your matches.</strong> We need your category, income, course, state and marks. <Link to="/profile">Fill profile</Link>
        </div>
      )}

      {data.hasProfile && stats.potentialAmount > 0 && (
        <div className="potential">
          <span className="potential-icon">💰</span>
          <div>
            <div className="potential-label">{t('Potential support')}</div>
            <div className="potential-amount">{t('Up to')} {inr(stats.potentialAmount)} <small>{t('per year across')} {stats.eligible} {t('scholarships you are eligible for')}</small></div>
          </div>
          <Link className="btn btn-primary btn-sm" to="/scholarships?eligible=1">{t('View All →')}</Link>
        </div>
      )}

      <section className="stats">
        <StatCard icon="🎓" value={stats.available} label={t('Available Scholarships')} onClick={() => navigate('/scholarships')} />
        <StatCard icon="✅" tone="green" value={stats.eligible} label={t('Eligible for You')} onClick={() => navigate('/scholarships?eligible=1')} />
        <StatCard icon="⏱" tone="amber" value={stats.closingSoon} label={t('Closing Soon (within 7 days)')} />
        <StatCard icon="🔖" tone="blue" value={stats.bookmarked} label={t('Bookmarked')} onClick={() => navigate('/bookmarks')} />
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head"><h3>🎯 {t('Eligible for You')}</h3><Link to="/scholarships?eligible=1">{t('View All →')}</Link></div>
          {eligible.length === 0
            ? <Empty icon="🧭" title="No exact matches yet">{data.hasProfile ? 'Check “Almost eligible” below, or come back when new scholarships are added.' : 'Complete your profile to see matches.'}</Empty>
            : eligible.map((s) => <Row key={s._id} s={s} onOpen={setOpen} />)}
        </section>

        <section className="card card-urgent">
          <div className="card-head"><h3>⚡ {t('Closing in 7 Days')}</h3></div>
          {closing.length === 0
            ? <Empty icon="🌤" title="Nothing closing this week" />
            : closing.map((s) => <Row key={s._id} s={s} onOpen={setOpen} />)}
        </section>
      </div>

      {almostEligible.length > 0 && (
        <section className="card">
          <div className="card-head"><h3>🤏 {t('Almost eligible')}</h3><span className="muted">{t('Only one rule is not met')}</span></div>
          {almostEligible.map((s) => <Row key={s._id} s={s} onOpen={setOpen} />)}
        </section>
      )}

      <div className="grid-2">
        <section className="card">
          <div className="card-head"><h3>🧑‍🎓 {t('My Profile Summary')}</h3><Link className="btn btn-ghost btn-sm" to="/profile">{t('Edit Profile')}</Link></div>
          {profile ? (
            <div className="summary">
              <div className="avatar avatar-lg">{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <strong>{user.name}</strong>
                <p className="muted">{profile.category} · Income {inr(profile.income)}<br />{profile.course} · {profile.state} · {profile.marks}% marks</p>
              </div>
            </div>
          ) : <p className="muted">No profile yet.</p>}
          <div className="meter-label"><span>{t('Profile completeness')}</span><b>{completeness.percent}%</b></div>
          <div className="meter"><div style={{ width: `${completeness.percent}%` }} /></div>
          {completeness.missing.length > 0 && <p className="muted small">Missing: {completeness.missing.join(', ')}</p>}
        </section>

        <section className="card">
          <div className="card-head"><h3>📈 {t('Application Tracker')}</h3><Link to="/applications">{t('View All →')}</Link></div>
          <div className="mini-tracker">
            {STATUS_FLOW.map((st) => (
              <div key={st} className={`mini-step ${trackerCount(st) ? 'has' : ''}`}>
                <span className="mini-count">{trackerCount(st)}</span>
                <span className="mini-label">{STATUS_LABEL[st]}</span>
              </div>
            ))}
          </div>
          {trackerCount('rejected') > 0 && <p className="muted small">{trackerCount('rejected')} rejected</p>}
        </section>
      </div>

      {open && (
        <ScholarshipModal s={open} application={byScholarship[open._id]} setStatus={changed} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
