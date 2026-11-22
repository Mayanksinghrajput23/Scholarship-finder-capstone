import { useState } from 'react';
import { api, setTokens } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotifyContext';
import { useLang } from '../i18n';
import { ErrorBox, Field } from '../components/ui';
import { fieldErrors } from '../utils';

// Available to students and admins.
export default function Account() {
  const { user } = useAuth();
  const { toast } = useNotify();
  const { t } = useLang();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setErrors({});
    if (form.newPassword !== form.confirm) { setErrors({ confirm: 'Passwords do not match' }); return; }
    setBusy(true);
    try {
      const r = await api('/auth/change-password', { method: 'POST', body: { currentPassword: form.currentPassword, newPassword: form.newPassword } });
      setTokens({ accessToken: r.data.accessToken, refreshToken: r.data.refreshToken }); // the old session token was revoked
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      toast('Password changed', 'success');
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="page-head"><div><h1>{t('Account settings')}</h1><p className="muted">{user.name} · {user.email}</p></div></div>
      <form className="card form-card" onSubmit={submit} noValidate>
        <h3 style={{ marginBottom: 12 }}>{t('Change password')}</h3>
        <ErrorBox message={error} />
        <Field label={t('Current password')} error={errors.currentPassword}><input type="password" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" /></Field>
        <div className="form-grid">
          <Field label={t('New password')} error={errors.newPassword} hint="At least 8 characters, with a letter and a number"><input type="password" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" /></Field>
          <Field label={t('Confirm password')} error={errors.confirm}><input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" /></Field>
        </div>
        <div className="form-actions"><button className="btn btn-primary" disabled={busy}>{busy ? '…' : t('Change password')}</button></div>
      </form>
    </>
  );
}
