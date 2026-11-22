import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n';
import { ErrorBox, Field } from '../components/ui';
import HeroArt from '../components/HeroArt';
import LandingHeader from '../components/LandingHeader';
import { ArrowIcon, CalendarIcon, EyeIcon, GoogleG, LockIcon, MailIcon, PlayIcon, ShieldIcon, TrophyIcon, UserIcon, UsersIcon } from '../components/icons';
import { fieldErrors } from '../utils';

const home = (u) => (u.role === 'admin' ? '/admin' : '/dashboard');

const FEATURES = [
  { icon: '🛡️', label: 'Eligibility Matching' },
  { icon: '📅', label: 'Deadline Alerts' },
  { icon: '🔖', label: 'Save Favorites' },
  { icon: '📊', label: 'Track Applications' },
];
const STATS = [
  { icon: <UsersIcon />, big: '50K+', sub: 'Students Helped' },
  { icon: <TrophyIcon />, big: '10K+', sub: 'Scholarships Listed' },
  { icon: <ShieldIcon />, big: '95%', sub: 'Eligibility Accuracy' },
  { icon: <CalendarIcon />, big: 'Always On Time', sub: 'Never Miss a Deadline' },
];

// Landing-style page used by login, register and password screens.
// Student photo = frontend/public/login-girl.jpg (falls back to the drawn illustration if missing).
export function AuthShell({ title, subtitle, children, footer }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div className="lp">
      <span className="lp-wave lp-wave-a" /><span className="lp-wave lp-wave-b" />
      <LandingHeader />

      <main className="lp-main">
        <section className="lp-copy">
          <span className="lp-pill"><span className="lp-star">★</span> India's Smart Scholarship Portal</span>
          <h1>Discover Scholarships<br />made for <span className="lp-you">you.<svg viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8 Q60 -2 118 6" /></svg></span></h1>
          <p>Fill your profile once. ScholarMatch checks every scholarship's rules against it, shows what you are eligible for and reminds you before deadlines.</p>
          <ul className="lp-features">
            {FEATURES.map((f) => (<li key={f.label}><span>{f.icon}</span>{f.label}</li>))}
          </ul>
          <div className="lp-cta">
            <Link to="/scholarships" className="btn btn-primary btn-lg">Explore Scholarships <ArrowIcon /></Link>
            <Link to="/about" className="btn btn-outline btn-lg"><PlayIcon /> Watch Demo</Link>
          </div>
        </section>

        <section className="lp-visual" aria-hidden="true">
          {imgFailed ? <HeroArt /> : <img src="/login-girl.jpg" alt="" onError={() => setImgFailed(true)} />}
        </section>

        <div className="auth-card card">
          <div className="auth-card-head">
            <img src="/logo-cap.png" alt="" width="56" height="52" />
            <div><h2>{title}</h2><p className="muted">{subtitle}</p></div>
          </div>
          {children}
          <p className="auth-foot">{footer}</p>
        </div>
      </main>

      <footer className="lp-stats">
        {STATS.map((x) => (
          <div key={x.sub}><span className="lp-stat-icon">{x.icon}</span><div><b>{x.big}</b><small>{x.sub}</small></div></div>
        ))}
      </footer>
    </div>
  );
}

export function Login() {
  const { user, login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={home(user)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(form.email, form.password, role);
      navigate(location.state?.from || home(u), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t('Welcome Back!')} subtitle={t('Log in to see your matches.')} footer={<>{t('New here?')} <Link to="/register">{t('Create an account')}</Link></>}>
      <div className="lp-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={role === 'student'} className={role === 'student' ? 'on' : ''} onClick={() => setRole('student')}><UserIcon /> Student</button>
        <button type="button" role="tab" aria-selected={role === 'admin'} className={role === 'admin' ? 'on' : ''} onClick={() => setRole('admin')}><ShieldIcon /> Admin</button>
      </div>
      <form onSubmit={submit} noValidate>
        <ErrorBox message={error} />
        <label className="lp-label" htmlFor="lp-email">{t('Email Address')}</label>
        <div className="lp-input"><MailIcon /><input id="lp-email" type="email" placeholder="Enter your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required /></div>
        <label className="lp-label" htmlFor="lp-pass">{t('Password')}</label>
        <div className="lp-input"><LockIcon /><input id="lp-pass" type={show ? 'text' : 'password'} placeholder="Enter your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" required />
          <button type="button" className="lp-eye" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}><EyeIcon off={!show} /></button></div>
        <div className="forgot"><Link to="/forgot-password">{t('Forgot password?')}</Link></div>
        <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? t('Logging in…') : <>{t('Log in')} <ArrowIcon /></>}</button>
        <div className="lp-or"><span>OR</span></div>
        <button type="button" className="btn btn-outline btn-block btn-lg" onClick={() => setError('Google sign-in is not set up in this demo yet. Please use your email and password.')}><GoogleG /> Continue with Google</button>
      </form>
    </AuthShell>
  );
}

export function Register() {
  const { user, register } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={home(user)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setErrors({});
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/profile', { replace: true, state: { welcome: true } }); // new students fill their profile first
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AuthShell title={t('Create your account')} subtitle={t('It takes a minute, then add your profile once.')} footer={<>{t('Already registered?')} <Link to="/login">{t('Log in')}</Link></>}>
      <form onSubmit={submit} noValidate>
        <ErrorBox message={error} />
        <Field label={t('Full name')} error={errors.name}><input value={form.name} onChange={set('name')} autoComplete="name" required /></Field>
        <Field label={t('Email')} error={errors.email}><input type="email" value={form.email} onChange={set('email')} autoComplete="email" required /></Field>
        <Field label={t('Password')} error={errors.password} hint="At least 8 characters, with a letter and a number">
          <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" required />
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? t('Creating…') : t('Create account')}</button>
      </form>
    </AuthShell>
  );
}
