const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://job-tracker-8e22.onrender.com';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders(extra = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function apiGet(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
    if (res.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    return res;
  } catch (err) {
    console.error(`API_GET ERROR [${path}]:`, err);
    throw err;
  }
}

export async function apiPost(path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return res;
  } catch (err) {
    console.error(`API_POST ERROR [${path}]:`, err);
    throw err;
  }
}

export async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return res;
}

export async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res;
}

export async function apiUpload(path, file) {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  return res;
}

export { API_BASE };
