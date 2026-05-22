const BASE_URL = 'https://api.taxdigital.uk';

// ── Token management ──────────────────────────────────────────────
export function getToken() {
  return localStorage.getItem('td_token');
}

export function setToken(token) {
  localStorage.setItem('td_token', token);
}

export function clearToken() {
  localStorage.removeItem('td_token');
}

// ── User management ───────────────────────────────────────────────
export function getUser() {
  try {
    const raw = localStorage.getItem('td_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem('td_user', JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem('td_user');
}

// ── Logout ────────────────────────────────────────────────────────
export function logout() {
  clearToken();
  clearUser();
  window.location.href = '/login';
}

// ── Core fetch wrapper ────────────────────────────────────────────
async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 — session expired or invalid token
  if (res.status === 401) {
    clearToken();
    clearUser();
    // Only redirect if we're not already on the login page
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  // Try to parse JSON; fall back to text
  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' && (data.error || data.message)
        ? (data.error || data.message)
        : typeof data === 'string'
          ? data
          : `Request failed with status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ── Convenience methods ───────────────────────────────────────────
api.get = (path) => api(path, { method: 'GET' });

api.post = (path, body) =>
  api(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });

api.put = (path, body) =>
  api(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

api.del = (path) => api(path, { method: 'DELETE' });

export default api;
