// Original illustration inspired by the "scholarship guide" banner layout:
// a smiling student with books, floating rupee coins, a graduation cap and a certificate.
const Coin = ({ x, y, r = 16 }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#f5b83d" />
    <circle cx={x} cy={y} r={r - 3.5} fill="#ffd36b" stroke="#e39b1b" strokeWidth="1.5" />
    <text x={x} y={y + r * 0.36} textAnchor="middle" fontSize={r * 1.05} fontWeight="800" fill="#c47a0c">₹</text>
  </g>
);

export default function HeroArt() {
  const skin = '#d9a074';
  const skinShade = '#c68a5e';
  return (
    <svg className="edu-art" viewBox="0 0 540 420" role="img" aria-label="A smiling student holding books, with rupee coins, a graduation cap and a certificate floating around" fontFamily="Inter, system-ui, sans-serif">
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dff0ff" />
          <stop offset="100%" stopColor="#f3f0ff" />
        </linearGradient>
        <clipPath id="hero-clip"><rect x="0" y="0" width="540" height="420" rx="26" /></clipPath>
        <filter id="hero-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#1e1250" floodOpacity="0.2" />
        </filter>
      </defs>

      <g clipPath="url(#hero-clip)">
        <rect width="540" height="420" fill="url(#hero-sky)" />
        <circle cx="490" cy="40" r="60" fill="#ffe08a" opacity="0.8" />
        <path d="M0 340 Q140 290 280 330 T540 320 V420 H0 Z" fill="#cfe3ff" />

        {/* college building */}
        <g opacity="0.95">
          <rect x="30" y="250" width="230" height="95" fill="#f5f1ea" />
          <path d="M20 250 L145 205 L270 250 Z" fill="#e8e1d6" />
          <rect x="125" y="222" width="40" height="28" fill="#f5f1ea" />
          <path d="M120 222 L145 204 L170 222 Z" fill="#c9bfae" />
          {[48, 78, 108, 150, 180, 210].map((x) => (
            <g key={x}>
              <rect x={x} y="268" width="16" height="30" rx="2" fill="#7fa6d6" />
              <rect x={x} y="268" width="16" height="30" rx="2" fill="none" stroke="#fff" strokeWidth="1.5" />
            </g>
          ))}
          <rect x="132" y="302" width="26" height="43" rx="3" fill="#8a6a4a" />
          <rect x="20" y="343" width="250" height="6" fill="#d9d0c2" />
        </g>
        {/* trees */}
        <circle cx="288" cy="318" r="22" fill="#6cc08b" />
        <circle cx="270" cy="330" r="16" fill="#58b07a" />
        <circle cx="14" cy="322" r="22" fill="#6cc08b" />

        {/* backpack behind */}
        <path d="M232 214 Q232 176 262 170 H338 Q368 176 368 214 V330 H232 Z" fill="#1f3a7a" />

        {/* body: white shirt */}
        <path d="M222 420 L226 252 Q230 214 270 204 H330 Q370 214 374 252 L378 420 Z" fill="#ffffff" />
        <path d="M270 204 L300 250 L330 204 Q300 196 270 204 Z" fill="#e9eef7" />
        <path d="M284 204 L300 232 L316 204 Z" fill="#d6dff0" />
        <path d="M300 232 L300 420" stroke="#e1e7f2" strokeWidth="2" />
        {[262, 296, 330, 364].map((y) => <circle key={y} cx="300" cy={y} r="2.4" fill="#c7d1e6" />)}

        {/* backpack straps */}
        <path d="M252 208 Q246 290 258 372" fill="none" stroke="#1f3a7a" strokeWidth="16" strokeLinecap="round" />
        <path d="M348 208 Q354 290 342 372" fill="none" stroke="#1f3a7a" strokeWidth="16" strokeLinecap="round" />

        {/* neck + head */}
        <path d="M283 160 H317 V210 Q300 222 283 210 Z" fill={skinShade} />
        <ellipse cx="265" cy="128" rx="6" ry="10" fill={skinShade} />
        <ellipse cx="335" cy="128" rx="6" ry="10" fill={skinShade} />
        <ellipse cx="300" cy="124" rx="36" ry="43" fill={skin} />
        {/* hair */}
        <path d="M262 124 Q252 70 300 66 Q350 70 338 124 Q334 98 318 90 Q290 100 262 124 Z" fill="#17131f" />
        <path d="M262 112 Q264 82 292 74 Q272 86 270 118 Z" fill="#17131f" />
        {/* face (looking up-right) */}
        <path d="M284 116 Q291 111 298 115" fill="none" stroke="#17131f" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M312 115 Q319 111 326 116" fill="none" stroke="#17131f" strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="292" cy="125" rx="3.3" ry="4" fill="#17131f" />
        <ellipse cx="319" cy="125" rx="3.3" ry="4" fill="#17131f" />
        <circle cx="293.2" cy="123.6" r="1.1" fill="#fff" />
        <circle cx="320.2" cy="123.6" r="1.1" fill="#fff" />
        <path d="M306 128 Q303 140 309 142" fill="none" stroke={skinShade} strokeWidth="2" strokeLinecap="round" />
        <path d="M288 150 Q304 166 322 148 Q304 156 288 150 Z" fill="#fff" stroke="#9c5a45" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="281" cy="140" r="6" fill="#e58c7a" opacity="0.3" />
        <circle cx="330" cy="140" r="6" fill="#e58c7a" opacity="0.3" />

        {/* notebook + book held in front */}
        <g transform="rotate(-8 330 300)">
          <rect x="300" y="262" width="82" height="112" rx="6" fill="#f2b630" />
          <rect x="304" y="262" width="78" height="108" rx="5" fill="#264d9c" />
          <rect x="316" y="278" width="40" height="5" rx="2.5" fill="#8fb0ee" />
          <rect x="316" y="290" width="28" height="4" rx="2" fill="#5f84cf" />
          {[272, 284, 296, 308, 320].map((y) => <circle key={y} cx="304" cy={y + 8} r="3" fill="#dfe6f5" />)}
        </g>
        {/* forearm + hands */}
        <path d="M232 340 Q250 300 290 322" fill="none" stroke="#fff" strokeWidth="30" strokeLinecap="round" />
        <path d="M368 352 Q360 320 340 330" fill="none" stroke="#fff" strokeWidth="26" strokeLinecap="round" />
        <circle cx="300" cy="326" r="11" fill={skin} />
        <circle cx="344" cy="338" r="10" fill={skin} />
        {/* sleeve cuffs */}
        <rect x="224" y="352" width="30" height="62" rx="12" fill="#fff" opacity="0" />

        {/* floating decor */}
        <g filter="url(#hero-shadow)">
          {/* grad cap */}
          <path d="M92 118 L148 94 L204 118 L148 142 Z" fill="#203d82" />
          <path d="M118 130 V152 Q148 168 178 152 V130 L148 142 Z" fill="#2c4fa3" />
          <path d="M204 118 V150" stroke="#f5b83d" strokeWidth="3" strokeLinecap="round" />
          <circle cx="204" cy="154" r="5" fill="#f5b83d" />
        </g>
        <g filter="url(#hero-shadow)">
          {/* certificate */}
          <g transform="rotate(8 440 176)">
            <rect x="388" y="140" width="104" height="72" rx="6" fill="#fffdf7" stroke="#e7d9a8" strokeWidth="2" />
            <rect x="402" y="154" width="54" height="5" rx="2.5" fill="#8fb0ee" />
            <rect x="402" y="167" width="72" height="4" rx="2" fill="#cdd7ee" />
            <rect x="402" y="177" width="60" height="4" rx="2" fill="#cdd7ee" />
            <circle cx="468" cy="196" r="11" fill="#f5b83d" />
            <path d="M462 205 L458 220 L468 214 L478 220 L474 205 Z" fill="#e39b1b" />
          </g>
        </g>
        <g filter="url(#hero-shadow)">
          {/* stacked books */}
          <rect x="70" y="190" width="70" height="16" rx="3" fill="#3a6fd8" />
          <rect x="76" y="174" width="62" height="16" rx="3" fill="#f2b630" />
          <rect x="66" y="158" width="66" height="16" rx="3" fill="#e5586b" />
          <rect x="76" y="162" width="40" height="3" rx="1.5" fill="#fff" opacity="0.7" />
        </g>
        <Coin x={190} y={218} r={17} />
        <Coin x={420} y={86} r={19} />
        <Coin x={486} y={262} r={15} />
        <Coin x={40} y={90} r={12} />

        {/* info chips */}
        <g filter="url(#hero-shadow)">
          <rect x="22" y="352" width="168" height="48" rx="14" fill="#fff" />
        </g>
        <circle cx="46" cy="376" r="12" fill="#e3f7ec" />
        <path d="M40 376 L45 381 L53 371" fill="none" stroke="#12a05c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <text x="66" y="373" fontSize="12.5" fontWeight="800" fill="#1d1b34">12 scholarships</text>
        <text x="66" y="389" fontSize="10.5" fontWeight="600" fill="#12a05c">you are eligible for</text>

        <g filter="url(#hero-shadow)">
          <rect x="378" y="350" width="146" height="48" rx="14" fill="#fff" />
        </g>
        <rect x="390" y="362" width="104" height="24" rx="12" fill="#fde7e7" />
        <text x="442" y="378" textAnchor="middle" fontSize="11" fontWeight="700" fill="#d63a3a">Closes in 3 days</text>
      </g>
    </svg>
  );
}
