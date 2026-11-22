import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LangToggle, ThemeToggle } from './Toggles';
import { SearchIcon, UserIcon } from './icons';

const NAV = [
  { to: '/login', label: 'Home' },
  { to: '/scholarships', label: 'Scholarships' },
  { to: '/about', label: 'About' },
  { to: '/faqs', label: 'FAQs' },
  { to: '/contact', label: 'Contact' },
];

// Shared top bar of the login / register / public pages.
export default function LandingHeader() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const search = (e) => {
    e.preventDefault();
    navigate(`/scholarships${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); // protected: asks for login first
  };
  return (
    <header className="lp-head">
      <Link to="/" className="lp-brand">
        <img src="/logo-cap.png" alt="" width="48" height="44" />
        <div><div className="brand-name">Scholar<b>Match</b></div><div className="lp-tag">Find • Apply • Achieve</div></div>
      </Link>
      <div className="lp-center">
        <nav className="lp-nav" aria-label="Main">
          {NAV.map((n) => (<NavLink key={n.to} to={n.to} end>{n.label}</NavLink>))}
        </nav>
        <form className="lp-search" onSubmit={search} role="search">
          <SearchIcon />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search scholarships..." aria-label="Search scholarships" />
        </form>
      </div>
      <div className="lp-tools">
        <LangToggle /><ThemeToggle />
        <Link to="/register" className="btn btn-primary lp-reg"><UserIcon /> Register</Link>
      </div>
    </header>
  );
}
