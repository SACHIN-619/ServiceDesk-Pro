const API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = API_URL ? `${API_URL.replace(/\/$/, '')}/api` : '/api';

export const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('servicedesk_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) {
      // Token is invalid/expired
      localStorage.removeItem('servicedesk_token');
      localStorage.removeItem('servicedesk_role');
    }
    throw new Error(data.message || `API Request Failed (${response.status})`);
  }

  return data;
};

// Auth API helpers
export const registerUser = async (userData) => {
  return fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const loginUser = async (email, password) => {
  return fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

