import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, getAccessToken } from '../api';
import { useAuth } from './AuthContext';

const NotifyContext = createContext(null);
export const useNotify = () => useContext(NotifyContext);

// Toasts (any page can call toast()) + notifications: loaded from MongoDB on login,
// and new ones arrive live through Socket.IO.
export function NotifyProvider({ children }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [items, setItems] = useState([]);
  const idRef = useRef(0);
  const itemsRef = useRef([]);
  itemsRef.current = items;

  const toast = useCallback((message, type = 'info') => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return undefined;
    }
    api('/notifications').then((r) => setItems(r.data)).catch(() => {});

    // auth as a function: evaluated on every (re)connect so a refreshed token is used.
    const socket = io('/', { auth: (cb) => cb({ token: getAccessToken() }) });
    let retried = false;

    socket.on('notification', (n) => {
      setItems((list) => [n, ...list.filter((x) => x._id !== n._id)].slice(0, 50));
      toast(n.message, n.type === 'reminder' ? 'warn' : 'success');
    });
    socket.on('connect_error', async (err) => {
      // Expired access token: any API call refreshes it, then reconnect once.
      if (err.message === 'Unauthorized' && !retried) {
        retried = true;
        try {
          await api('/auth/me');
          socket.connect();
        } catch {
          /* session is gone: AuthContext handles it */
        }
      }
    });
    return () => socket.disconnect();
  }, [user, toast]);

  const markAllRead = useCallback(() => {
    if (!itemsRef.current.some((n) => !n.read)) return;
    setItems((l) => l.map((n) => ({ ...n, read: true })));
    api('/notifications/read-all', { method: 'PATCH' }).catch(() => {});
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    api('/notifications', { method: 'DELETE' }).catch(() => {});
  }, []);

  const unread = items.filter((n) => !n.read).length;
  const value = useMemo(() => ({ toast, items, unread, markAllRead, clearAll }), [toast, items, unread, markAllRead, clearAll]);

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
        ))}
      </div>
    </NotifyContext.Provider>
  );
}
