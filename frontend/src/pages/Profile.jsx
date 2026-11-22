import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useMeta } from '../hooks';
import { useNotify } from '../context/NotifyContext';
import { useLang } from '../i18n';
import { ErrorBox, Field, Spinner } from '../components/ui';
import { fieldErrors, profileCompleteness } from '../utils';

const BLANK = { category: '', income: '', course: '', state: '', marks: '' };

export default function Profile() {
  const meta = useMeta();
  const { toast } = useNotify();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    api('/profile')
      .then((r) => setForm({ category: r.data.category, income: String(r.data.income), course: r.data.course, state: r.data.state, marks: String(r.data.marks) }))
      .catch((e) => { if (e.status === 404) setIsNew(true); else setError(e.message); })
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setError('');
    // Client-side checks for instant feedback; the server validates again.
    const local = {};
    if (!form.category) local.category = 'Select your category';
    if (form.income === '' || Number(form.income) < 0) local.income = 'Enter your annual family income (0 or more)';
    if (!form.course) local.course = 'Select your course';
    if (!form.state) local.state = 'Select your state';
    if (form.marks === '' || Number(form.marks) < 0 || Number(form.marks) > 100) local.marks = 'Marks must be between 0 and 100';
    if (Object.keys(local).length) { setErrors(local); return; }

    setSaving(true);
    try {
      await api('/profile', { method: 'PUT', body: { ...form, income: Number(form.income), marks: Number(form.marks) } });
      toast('Profile saved. Your matches are updated.', 'success');
      navigate('/dashboard');
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;
  const { percent } = profileCompleteness(form);

  return (
    <>
      <div className="page-head"><div><h1>{t('Student Profile')}</h1><p className="muted">{t('Fill this once. We use it to match you with scholarships.')}</p></div></div>
      {(isNew || location.state?.welcome) && <div className="alert alert-info">Welcome! Add your details so ScholarMatch can find your eligible scholarships.</div>}
      <form className="card form-card" onSubmit={submit} noValidate>
        <ErrorBox message={error} />
        <div className="meter-label"><span>{t('Completeness')}</span><b>{percent}%</b></div>
        <div className="meter"><div style={{ width: `${percent}%` }} /></div>

        <div className="form-grid">
          <Field label={t('Category')} error={errors.category}>
            <select value={form.category} onChange={set('category')}><option value="">{t('Select category')}</option>{meta.categories.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label={t('Annual family income (₹)')} error={errors.income} hint="Total yearly income of your family">
            <input type="number" min="0" value={form.income} onChange={set('income')} placeholder="e.g. 400000" />
          </Field>
          <Field label={t('Course')} error={errors.course}>
            <select value={form.course} onChange={set('course')}><option value="">{t('Select course')}</option>{meta.courses.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label={t('State')} error={errors.state}>
            <select value={form.state} onChange={set('state')}><option value="">{t('Select state')}</option>{meta.states.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label={t('Marks (%)')} error={errors.marks} hint="Latest percentage">
            <input type="number" min="0" max="100" step="0.1" value={form.marks} onChange={set('marks')} placeholder="e.g. 85" />
          </Field>
        </div>
        <div className="form-actions"><button className="btn btn-primary" disabled={saving}>{saving ? t('Saving…') : t('Save profile')}</button></div>
      </form>
    </>
  );
}
