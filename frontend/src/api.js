// Thin Fetch API wrapper: adds the Bearer token, and on a 401 silently uses the
// refresh token once (rotation) and retries the request.
const KEY = 'scholarmatch_tokens';

let tokens = null;
try {
  tokens = JSON.parse(localStorage.getItem(KEY));
} catch {
  tokens = null;
}

export const getAccessToken = () => (tokens ? tokens.accessToken : null);
export const hasTokens = () => Boolean(tokens);

export function setTokens(next) {
  tokens = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: tokens just live in memory */
  }
}

let refreshing = null;
function refreshTokens() {
  if (!tokens || !tokens.refreshToken) return Promise.resolve(false);
  if (!refreshing) {
    refreshing = fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const json = await res.json();
        setTokens({ accessToken: json.data.accessToken, refreshToken: json.data.refreshToken });
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

function send(path, { method, body, params }) {
  let url = `/api${path}`;
  if (params) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined && v !== false) sp.append(k, v);
    });
    const qs = sp.toString();
    if (qs) url += `?${qs}`;
  }
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(tokens && tokens.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function api(path, opts = {}) {
  const options = { method: 'GET', ...opts };
  let res = await send(path, options);

  if (res.status === 401 && !path.startsWith('/auth/')) {
    if (await refreshTokens()) {
      res = await send(path, options);
    } else {
      setTokens(null);
      window.dispatchEvent(new Event('auth:expired'));
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.message || 'Something went wrong. Please try again.');
    err.status = res.status;
    err.errors = json.errors || [];
    throw err;
  }
  return json;
}

// Download a file from an authenticated endpoint (e.g. CSV export).
export async function download(path, filename, params) {
  let res = await send(path, { method: 'GET', params });
  if (res.status === 401 && (await refreshTokens())) res = await send(path, { method: 'GET', params });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || 'Download failed');
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
