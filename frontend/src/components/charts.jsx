import { useState } from 'react';

// Hand-made SVG charts (no chart library needed).

const niceMax = (max) => {
  if (max <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
};

// Smooth line through points using horizontal-tangent cubic curves.
const smoothPath = (pts) =>
  pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${d} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }, '');

export function LineChart({ labels, series, height = 280 }) {
  const [hover, setHover] = useState(null);
  const W = 720;
  const H = height;
  const pad = { l: 38, r: 14, t: 14, b: 30 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const top = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const x = (i) => pad.l + (labels.length === 1 ? iw / 2 : (i / (labels.length - 1)) * iw);
  const y = (v) => pad.t + ih - (v / top) * ih;
  const ticks = [0, 1, 2, 3, 4].map((i) => (top / 4) * i);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - pad.l) / iw) * (labels.length - 1));
    setHover(Math.min(labels.length - 1, Math.max(0, i)));
  };

  return (
    <div className="linechart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Trend chart" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.name} id={`area${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="grid-line" strokeDasharray="3 4" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#8a88a3">{Math.round(t)}</text>
          </g>
        ))}
        {labels.map((l, i) => (
          <text key={`${l}${i}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#8a88a3">{l}</text>
        ))}
        {series.map((s, si) => {
          const pts = s.values.map((v, i) => [x(i), y(v)]);
          const line = smoothPath(pts);
          return (
            <g key={s.name}>
              {si === 0 && <path d={`${line} L ${x(labels.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`} fill={`url(#area${si})`} />}
              <path d={line} fill="none" stroke={s.color} strokeWidth="2.6" strokeLinecap="round" />
            </g>
          );
        })}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} className="hover-line" />
            {series.map((s) => <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r="4.5" className="dot" stroke={s.color} strokeWidth="2.5" />)}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="chart-tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <strong>{labels[hover]}</strong>
          {series.map((s) => <div key={s.name}><i style={{ background: s.color }} />{s.name}: <b>{s.values[hover]}</b></div>)}
        </div>
      )}
    </div>
  );
}

export function Donut({ rows, size = 190 }) {
  const total = rows.reduce((n, r) => n + r.value, 0);
  let offset = 25; // start at 12 o'clock
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ width: size, height: size }}>
        <svg viewBox="0 0 42 42" role="img" aria-label="Status breakdown">
          <circle className="donut-track" cx="21" cy="21" r="15.9155" fill="none" strokeWidth="6" />
          {total > 0 && rows.map((r) => {
            const pct = (r.value / total) * 100;
            const el = (
              <circle key={r.label} cx="21" cy="21" r="15.9155" fill="none" stroke={r.color} strokeWidth="6"
                strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offset} />
            );
            offset -= pct;
            return el;
          })}
        </svg>
        <div className="donut-center"><b>{total}</b><span>total</span></div>
      </div>
      <ul className="legend">
        {rows.map((r) => (
          <li key={r.label}>
            <i style={{ background: r.color }} />
            <span>{r.label}</span>
            <b>{total ? Math.round((r.value / total) * 100) : 0}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
