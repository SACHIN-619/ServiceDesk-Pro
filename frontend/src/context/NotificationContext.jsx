import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { fetchAPI } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadNotifications = async () => {
    if (!user || !user._id) return;
    try {
      const data = await fetchAPI('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.warn('Could not load notifications:', err.message);
    }
  };

  useEffect(() => {
    if (user && user._id) {
      loadNotifications();

      // Connect Socket.IO
      const socketHost = window.location.origin.includes('5173')
        ? 'http://localhost:5000'
        : window.location.origin;

      const socket = io(socketHost, {
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        socket.emit('register', user._id);
      });

      socket.on('notification', (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
        showToast(`🔔 ${newNotif.title}: ${newNotif.message}`, 'info');
      });

      return () => {
        socket.disconnect();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await fetchAPI(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const markAllRead = async () => {
    try {
      await fetchAPI('/notifications/mark-all-read', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        showToast,
        notifications,
        unreadCount,
        loadNotifications,
        markAsRead,
        markAllRead
      }}
    >
      {children}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: toast.type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : toast.type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: 12,
          fontWeight: 600,
          fontSize: '0.88rem',
          boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'modalFadeIn 0.2s ease-out',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {toast.type === 'error' ? '❌' : toast.type === 'success' ? '✅' : '🔔'} {toast.message}
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
