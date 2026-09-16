const API_BASE = '/api';

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
