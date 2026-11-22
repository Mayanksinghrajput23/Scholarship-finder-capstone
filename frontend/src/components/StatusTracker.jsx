import { STATUS_FLOW, STATUS_LABEL } from '../utils';

// Horizontal stepper following the NSP stages. Rejected shows as a red end state.
export default function StatusTracker({ status }) {
  const idx = STATUS_FLOW.indexOf(status);
  return (
    <div className="tracker">
      {STATUS_FLOW.map((step, i) => {
        const done = status !== 'rejected' && i <= idx;
        const current = i === idx;
        return (
          <div key={step} className={`tracker-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
            <span className="tracker-dot">{done ? '✓' : i + 1}</span>
            <span className="tracker-label">{STATUS_LABEL[step]}</span>
          </div>
        );
      })}
      {status === 'rejected' && <div className="tracker-rejected">✗ Rejected</div>}
    </div>
  );
}
