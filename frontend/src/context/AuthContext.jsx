import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

const AuthContext = createContext();

export const DEMO_CREDENTIALS = {
  ADMIN: { email: 'admin@servicedesk.com', password: 'admin123', label: '👑 Admin' },
  IT_MANAGER: { email: 'manager@servicedesk.com', password: 'manager123', label: '👨‍💼 IT Manager' },
  TECHNICIAN: { email: 'tech@servicedesk.com', password: 'tech123', label: '🧑‍💻 Technician' },
  EMPLOYEE: { email: 'employee@servicedesk.com', password: 'employee123', label: '👤 Employee' },
  ASSET_MANAGER: { email: 'assetmanager@servicedesk.com', password: 'asset123', label: '🖥️ Asset Mgr' }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(localStorage.getItem('servicedesk_role') || 'EMPLOYEE');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoggedInUser();
  }, []);

  const checkLoggedInUser = async () => {
    const token = localStorage.getItem('servicedesk_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchAPI('/auth/me');
      setUser(data);
      setCurrentRole(data.role);
      localStorage.setItem('servicedesk_role', data.role);
    } catch (err) {
      console.warn('Authentication check failed:', err.message);
      localStorage.removeItem('servicedesk_token');
      localStorage.removeItem('servicedesk_role');
      setUser(null);
      setCurrentRole('EMPLOYEE');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('servicedesk_token', data.token);
      localStorage.setItem('servicedesk_role', data.role);
      setUser(data);
      setCurrentRole(data.role);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const switchRole = async (roleKey) => {
    const target = DEMO_CREDENTIALS[roleKey];
    if (target) {
      try {
        return await login(target.email, target.password);
      } catch (err) {
        console.error(`Failed to switch to role ${roleKey}:`, err.message);
        throw err;
      }
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      return response;
    } catch (err) {
      throw err;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const updated = await fetchAPI('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      setUser(prev => ({ ...prev, ...updated }));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('servicedesk_token');
    localStorage.removeItem('servicedesk_role');
    setUser(null);
    setCurrentRole('EMPLOYEE');
  };

  return (
    <AuthContext.Provider value={{
      user,
      currentRole: user?.role || currentRole,
      switchRole,
      login,
      register,
      updateProfile,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
