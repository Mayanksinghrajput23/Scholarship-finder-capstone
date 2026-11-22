import { useState } from 'react';
import { useLang } from '../i18n';

// Call once before rendering: saved choice, otherwise the OS preference.
export function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem('sm_theme'); } catch { /* ignore */ }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = saved || (prefersDark ? 'dark' : 'light');
}

export function ThemeToggle() {
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark');
  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('sm_theme', next); } catch { /* ignore */ }
    setDark(!dark);
  };
  return (
    <button className="icon-btn" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
      {dark ? '☀️' : '🌙'}
    </button>
  );
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <button className="lang-btn" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} aria-label="Change language" title="English / हिन्दी">
      {lang === 'en' ? 'हिं' : 'EN'}
    </button>
  );
}
