import { useState } from 'react';
import { api } from '../api';
import { ErrorBox, Modal } from './ui';

const COLUMNS = ['title', 'provider', 'type', 'amount', 'lastDate', 'categories', 'maxIncome', 'courses', 'states', 'minMarks', 'prerequisites', 'applyLink', 'description'];

// Minimal CSV parser: quoted fields, commas and line breaks inside quotes, "" as an escaped quote.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

function downloadTemplate() {
  const sample = [
    COLUMNS.join(','),
    'Sample Merit Scholarship,Sample Trust,merit,25000,2027-03-31,OBC|SC,300000,Engineering|Science,Bihar|Assam,60,Income certificate|Marksheet,https://example.com,Short description',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([sample], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'scholarship-import-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportModal({ onClose, onDone }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const onFile = async (e) => {
    setError('');
    setResult(null);
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const parsed = parseCsv(await file.text());
    if (parsed.length < 2) { setRows([]); setError('The file has no data rows.'); return; }
    const header = parsed[0].map((h) => h.trim());
    const missing = ['title', 'provider', 'type', 'amount', 'lastDate'].filter((c) => !header.includes(c));
    if (missing.length) { setRows([]); setError(`Missing required column(s): ${missing.join(', ')}. Use the template.`); return; }
    setRows(parsed.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] || '').trim()]))));
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await api('/scholarships/bulk', { method: 'POST', body: { items: rows } });
      setResult(r.data);
      if (r.data.created) onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Import scholarships from CSV" onClose={onClose} wide>
      <p className="muted">Columns: <code>{COLUMNS.join(', ')}</code>. Separate several categories, courses, states or documents with <code>|</code>. Dates as <code>YYYY-MM-DD</code>. Up to 200 rows.</p>
      <div className="import-row">
        <button className="btn btn-ghost btn-sm" onClick={downloadTemplate}>⬇ Download template</button>
        <input type="file" accept=".csv,text/csv" onChange={onFile} aria-label="CSV file" />
      </div>
      <ErrorBox message={error} />

      {rows.length > 0 && !result && (
        <>
          <p><b>{rows.length}</b> row(s) found in {fileName}. Preview:</p>
          <div className="table-wrap flush">
            <table className="table table-compact">
              <thead><tr><th>Title</th><th>Provider</th><th>Type</th><th>Amount</th><th>Last date</th></tr></thead>
              <tbody>{rows.slice(0, 5).map((r, i) => <tr key={i}><td>{r.title}</td><td>{r.provider}</td><td>{r.type}</td><td>{r.amount}</td><td>{r.lastDate}</td></tr>)}</tbody>
            </table>
          </div>
          {rows.length > 5 && <p className="muted small">…and {rows.length - 5} more</p>}
        </>
      )}

      {result && (
        <div>
          <div className={`alert ${result.failed.length ? 'alert-warn' : 'alert-info'}`}>
            <b>{result.created}</b> scholarship(s) imported{result.failed.length ? `, ${result.failed.length} row(s) skipped:` : '.'}
          </div>
          {result.failed.map((f) => (
            <div key={f.row} className="import-fail"><b>Row {f.row}{f.title ? ` (${f.title})` : ''}:</b> {f.errors.join('; ')}</div>
          ))}
        </div>
      )}

      <div className="modal-actions"><div className="spacer" />
        <button className="btn btn-ghost" onClick={onClose}>{result ? 'Close' : 'Cancel'}</button>
        {!result && <button className="btn btn-primary" disabled={busy || rows.length === 0} onClick={submit}>{busy ? 'Importing…' : `Import ${rows.length || ''} row(s)`}</button>}
      </div>
    </Modal>
  );
}
