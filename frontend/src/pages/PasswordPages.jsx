import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useLang } from '../i18n';
import { AuthShell } from './AuthPages';
import { ErrorBox, Field } from '../components/ui';
import { fieldErrors } from '../utils';

export function ForgotPassword() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const r = await api('/auth/forgot-password', { method: 'POST', body: { email } });
      setResult(r.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t('Reset your password')} subtitle="Enter your email and we will generate a reset link." footer={<Link to="/login">{t('Back to login')}</Link>}>
      {result ? (
        <div>
          <div className="alert alert-info">{result.message}</div>
          {result.devResetLink && (
            <div className="alert alert-warn">
              <strong>Development mode:</strong> no email service is connected, so here is your link (it is also printed in the backend terminal).<br />
              <a href={result.devResetLink}>Open reset link</a>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <ErrorBox message={error} />
          <Field label={t('Email')}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? '…' : t('Send reset link')}</button>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPassword() {
  const { t } = useLang();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setErrors({});
    if (form.password !== form.confirm) { setErrors({ confirm: 'Passwords do not match' }); return; }
    setBusy(true);
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token, password: form.password } });
      navigate('/login', { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t('Reset your password')} subtitle="Choose a new password for your account." footer={<Link to="/login">{t('Back to login')}</Link>}>
      {!token ? <div className="alert alert-error">This reset link is incomplete. Request a new one from the login page.</div> : (
        <form onSubmit={submit} noValidate>
          <ErrorBox message={error} />
          <Field label={t('New password')} error={errors.password} hint="At least 8 characters, with a letter and a number">
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
          </Field>
          <Field label={t('Confirm password')} error={errors.confirm}>
            <input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} autoComplete="new-password" />
          </Field>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? '…' : t('Update password')}</button>
        </form>
      )}
    </AuthShell>
  );
}
