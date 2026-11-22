import { useState } from 'react';
import HeroArt from './HeroArt';

// Shows /login-hero.jpg (a real photo you add to frontend/public). If the file is missing, falls back to the drawn illustration.
export default function HeroPhoto() {
  const [failed, setFailed] = useState(false);
  if (failed) return <HeroArt />;
  return (
    <img
      className="hero-photo"
      src="/login-hero.jpg"
      alt="A smiling student with books"
      onError={() => setFailed(true)}
    />
  );
}
