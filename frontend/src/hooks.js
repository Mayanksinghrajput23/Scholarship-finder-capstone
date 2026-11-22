import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

// Dropdown values come from the backend so they can never drift apart.
let metaCache = null;
export function useMeta() {
  const [meta, setMeta] = useState(metaCache);
  useEffect(() => {
    if (metaCache) return;
    api('/meta').then((r) => {
      metaCache = r.data;
      setMeta(r.data);
    }).catch(() => {});
  }, []);
  return meta || { categories: [], courses: [], states: [], types: [], statuses: [], statusFlow: [] };
}

// The student's bookmarks/applications plus helper actions.
export function useApplications(enabled = true) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async () => {
    if (!enabled) return;
    try {
      const r = await api('/applications/mine');
      setApps(r.data);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  const byScholarship = {};
  apps.forEach((a) => {
    if (a.scholarship) byScholarship[a.scholarship._id] = a;
  });

  // Create or update the student's entry for a scholarship.
  const setStatus = async (scholarshipId, status) => {
    const existing = byScholarship[scholarshipId];
    if (existing) await api(`/applications/${existing._id}`, { method: 'PATCH', body: { status } });
    else await api('/applications', { method: 'POST', body: { scholarshipId, status } });
    await reload();
  };

  const remove = async (applicationId) => {
    await api(`/applications/${applicationId}`, { method: 'DELETE' });
    await reload();
  };

  // Optimistic update so the checkbox responds instantly; reload if the server refuses.
  const toggleChecklist = async (applicationId, index, done) => {
    setApps((list) => list.map((a) => (a._id === applicationId
      ? { ...a, checklist: a.checklist.map((c, i) => (i === index ? { ...c, done } : c)) } : a)));
    try {
      await api(`/applications/${applicationId}/checklist`, { method: 'PATCH', body: { index, done } });
    } catch (e) {
      await reload();
      throw e;
    }
  };

  return { apps, loading, byScholarship, reload, setStatus, remove, toggleChecklist };
}
