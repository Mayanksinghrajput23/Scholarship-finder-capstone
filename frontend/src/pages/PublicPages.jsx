import { Link } from 'react-router-dom';
import LandingHeader from '../components/LandingHeader';

function PublicShell({ title, intro, children }) {
  return (
    <div className="lp">
      <span className="lp-wave lp-wave-a" /><span className="lp-wave lp-wave-b" />
      <LandingHeader />
      <main className="lp-page">
        <div className="card lp-page-card">
          <h1>{title}</h1>
          {intro && <p className="lp-intro">{intro}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}

export function About() {
  return (
    <PublicShell title="About ScholarMatch" intro="A scholarship finder that works backwards from you: tell it who you are once, and it tells you what you can apply for.">
      <h3 id="how">How it works</h3>
      <ol className="lp-steps">
        <li><b>Create your profile</b> – category, family income, course, state and marks.</li>
        <li><b>Get matched</b> – every scholarship's rules are checked against your profile and you see the exact rule that matched, or the one that did not.</li>
        <li><b>Apply and track</b> – save a scholarship, apply on the official link and follow it from Applied to Paid.</li>
        <li><b>Never miss a date</b> – you are notified in real time when a deadline is within 7 days.</li>
      </ol>
      <p className="muted">Scholarship names are taken from the National Scholarship Portal; amounts and rules in this demo are sample data. Always confirm details on the official site before applying.</p>
      <p><Link to="/register" className="btn btn-primary">Create your account</Link></p>
    </PublicShell>
  );
}

const FAQS = [
  ['Is ScholarMatch free?', 'Yes. Creating a profile, finding matches and tracking applications cost nothing.'],
  ['How does it decide I am eligible?', 'Each scholarship lists rules such as category, maximum family income, course, state and minimum marks. Your profile is compared with every rule and the result shows which ones you pass.'],
  ['What does “almost eligible” mean?', 'You fail exactly one rule, for example your marks are a little low. It helps you see what to improve.'],
  ['Where do I actually apply?', 'The Apply Now button opens the scholarship\'s official page. ScholarMatch then helps you track the application status.'],
  ['When do I get a deadline reminder?', 'When a bookmarked or applied scholarship closes within 7 days you get a notification inside the app, instantly if you are online.'],
  ['I forgot my password.', 'Use “Forgot password?” on the login page to get a reset link.'],
];

export function Faqs() {
  return (
    <PublicShell title="Frequently asked questions">
      <div className="lp-faq">
        {FAQS.map(([q, a]) => (<details key={q}><summary>{q}</summary><p>{a}</p></details>))}
      </div>
    </PublicShell>
  );
}

export function Contact() {
  return (
    <PublicShell title="Contact" intro="ScholarMatch is a capstone project. Questions, bugs or ideas are welcome.">
      <ul className="lp-contact">
        <li><b>Email</b> support@scholarmatch.test</li>
        <li><b>Hours</b> Mon – Sat, 10:00 – 18:00 IST</li>
      </ul>
      <p className="muted">This address is a placeholder for the demo.</p>
    </PublicShell>
  );
}
