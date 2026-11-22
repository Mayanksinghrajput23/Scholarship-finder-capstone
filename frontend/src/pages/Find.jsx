import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useApplications, useMeta } from '../hooks';
import { useNotify } from '../context/NotifyContext';
import { useLang } from '../i18n';
import { Empty, ErrorBox, Pagination, Spinner } from '../components/ui';
import ScholarshipCard from '../components/ScholarshipCard';
import ScholarshipModal from '../components/ScholarshipModal';
import CompareModal from '../components/CompareModal';

const EMPTY = { q: '', category: '', course: '', state: '', type: '', income: '', sort: 'deadline' };

export default function Find() {
  const meta = useMeta();
  const { toast } = useNotify();
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState({ ...EMPTY, q: params.get('q') || '' });
  const [onlyEligible, setOnlyEligible] = useState(params.get('eligible') === '1');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pageMeta, setPageMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);
  const [compare, setCompare] = useState([]); // up to 3 scholarships chosen for comparison
  const [showCompare, setShowCompare] = useState(false);
  const { byScholarship, setStatus, remove } = useApplications();

  // Header search box navigates here with ?q= : keep the filter in sync.
  useEffect(() => {
    setFilters((f) => ({ ...f, q: params.get('q') || '' }));
    setOnlyEligible(params.get('eligible') === '1');
    setPage(1);
  }, [params]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (onlyEligible) {
        // The twist endpoint: server-side match of profile vs rules. Search/sort applied here.
        const r = await api('/scholarships/eligible');
        let list = r.data;
        const q = filters.q.trim().toLowerCase();
        if (q) list = list.filter((s) => `${s.title} ${s.provider} ${s.description}`.toLowerCase().includes(q));
        if (filters.type) list = list.filter((s) => s.type === filters.type);
        if (filters.sort === 'amount') list = [...list].sort((a, b) => b.amount - a.amount);
        setItems(list);
        setPageMeta(null);
      } else {
        const r = await api('/scholarships', { params: { ...filters, page, limit: 9 } });
        setItems(r.data);
        setPageMeta(r.meta);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page, onlyEligible]);

  // Debounce so typing in search does not fire a request per key.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const set = (k) => (e) => { setFilters({ ...filters, [k]: e.target.value }); setPage(1); };
  const reset = () => { setFilters(EMPTY); setOnlyEligible(false); setParams({}); setPage(1); };

  const toggleBookmark = async (s) => {
    const app = byScholarship[s._id];
    try {
      if (app) { await remove(app._id); toast('Removed from bookmarks'); }
      else { await setStatus(s._id, 'bookmarked'); toast('Added to bookmarks', 'success'); }
    } catch (e) { toast(e.message, 'error'); }
  };

  const toggleCompare = (s) => {
    setCompare((list) => {
      if (list.some((x) => x._id === s._id)) return list.filter((x) => x._id !== s._id);
      if (list.length >= 3) { toast('You can compare up to 3 scholarships', 'error'); return list; }
      return [...list, s];
    });
  };

  const activeCount = useMemo(() => Object.entries(filters).filter(([k, v]) => v && k !== 'sort').length + (onlyEligible ? 1 : 0), [filters, onlyEligible]);

  return (
    <>
      <div className="page-head">
        <div><h1>{t('Find Scholarships')}</h1><p className="muted">{t('Search, filter and see exactly why you are (or are not) eligible.')}</p></div>
      </div>

      <section className="card filters">
        <input className="filters-q" placeholder={t('Search by name, provider or keyword')} value={filters.q} onChange={set('q')} aria-label="Search" />
        <select value={filters.category} onChange={set('category')} aria-label="Category"><option value="">{t('Category')}</option>{meta.categories.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={filters.course} onChange={set('course')} aria-label="Course"><option value="">{t('Course')}</option>{meta.courses.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={filters.state} onChange={set('state')} aria-label="State"><option value="">{t('State')}</option>{meta.states.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={filters.type} onChange={set('type')} aria-label="Type"><option value="">{t('Merit / Welfare')}</option>{meta.types.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}</select>
        <input type="number" min="0" placeholder={t('Family income (₹)')} value={filters.income} onChange={set('income')} aria-label="Family income" />
        <select value={filters.sort} onChange={set('sort')} aria-label="Sort by">
          <option value="deadline">{t('Sort: Deadline')}</option><option value="amount">{t('Sort: Highest amount')}</option><option value="latest">{t('Sort: Newest')}</option>
        </select>
        <label className="toggle"><input type="checkbox" checked={onlyEligible} onChange={(e) => { setOnlyEligible(e.target.checked); setPage(1); }} /> {t('Only eligible for me')}</label>
        {activeCount > 0 && <button className="btn btn-ghost btn-sm" onClick={reset}>{t('Clear')} ({activeCount})</button>}
      </section>

      <ErrorBox message={error} />
      {loading && items.length === 0 ? <Spinner /> : items.length === 0 && !error ? (
        <Empty icon="🔍" title={t('No scholarships found')}>Try removing a filter{onlyEligible ? ' or turning off “Only eligible for me”' : ''}.</Empty>
      ) : (
        <div className={`grid-cards ${loading ? 'dim' : ''}`}>
          {items.map((s) => (
            <ScholarshipCard key={s._id} s={s} application={byScholarship[s._id]} onOpen={setOpen} onToggleBookmark={toggleBookmark}
              compared={compare.some((x) => x._id === s._id)} onToggleCompare={toggleCompare} />
          ))}
        </div>
      )}
      <Pagination meta={pageMeta} onPage={setPage} />

      {compare.length > 0 && (
        <div className="compare-bar">
          <span>⚖️ {t('Compare')}: <b>{compare.length}</b>/3</span>
          <button className="btn btn-primary btn-sm" disabled={compare.length < 2} onClick={() => setShowCompare(true)}>{t('Compare now')}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setCompare([])}>{t('Clear')}</button>
        </div>
      )}
      {showCompare && compare.length >= 2 && (
        <CompareModal items={compare} onClose={() => setShowCompare(false)} onRemove={(s) => { toggleCompare(s); if (compare.length <= 2) setShowCompare(false); }} />
      )}

      {open && <ScholarshipModal s={open} application={byScholarship[open._id]} setStatus={setStatus} onClose={() => setOpen(null)} />}
    </>
  );
}
