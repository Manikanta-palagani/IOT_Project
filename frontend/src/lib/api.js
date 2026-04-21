const apiBase = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')).replace(/\/$/, '');
const socketUrl = (import.meta.env.VITE_SOCKET_URL || '').replace(/\/$/, '');

const request = async (path, options = {}) => {
  const token = localStorage.getItem('security-token');

  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
};

export { apiBase, request, socketUrl };