import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Shield, Bell, Plus, User, Sparkles, LogOut, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onCreateTicketClick, onOpenAuthModal }) => {
  const { user, currentRole, switchRole, logout, updateProfile } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead, showToast } = useNotification();
  const navigate = useNavigate();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  // Profile Edit State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState({ text: '', isError: false });

  const roles = [
    { key: 'ADMIN', label: '👑 Admin', color: '#8b5cf6' },
    { key: 'IT_MANAGER', label: '👨‍💼 IT Manager', color: '#3b82f6' },
    { key: 'TECHNICIAN', label: '🧑‍💻 Technician', color: '#06b6d4' },
    { key: 'EMPLOYEE', label: '👤 Employee', color: '#10b981' },
    { key: 'ASSET_MANAGER', label: '🖥️ Asset Mgr', color: '#f59e0b' },
  ];

  const handleRoleSwitch = async (roleKey) => {
    if (roleKey === currentRole && user) return;
    setSwitchingRole(true);
    try {
      await switchRole(roleKey);
      showToast(`Switched authenticated persona to ${roleKey}`, 'info');
    } catch (err) {
      showToast(`Failed to switch role: ${err.message}`, 'error');
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await markAsRead(notif._id);
    }
    setShowNotifDropdown(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: '', isError: false });
    try {
      await updateProfile({
        name: profileName,
        phone: profilePhone,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });
      setProfileMsg({ text: 'Profile updated successfully!', isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setShowProfileModal(false), 1200);
    } catch (err) {
      setProfileMsg({ text: err.message, isError: true });
    }
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Top Interactive Role Switcher Banner */}
      <div className="role-switcher-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#a855f7" />
          <span style={{ fontWeight: 700, color: '#c084fc', letterSpacing: '0.02em' }}>
            DEV QUICK-LOGIN SWITCHER:
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Authenticates live JWT across 5 RBAC personas:
          </span>
        </div>

        <div className="role-btn-group">
          {roles.map((r) => (
            <button
              key={r.key}
              className={`role-btn ${currentRole === r.key ? 'active' : ''}`}
              disabled={switchingRole}
              onClick={() => handleRoleSwitch(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Glass Header */}
      <div className="glass-nav" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <div style={{
            background: 'var(--accent-primary-gradient)',
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
          }}>
            <Shield size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              ServiceDesk <span style={{ color: '#3b82f6' }}>PRO</span>
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, margin: 0 }}>
              Enterprise ITSM & Asset Platform
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn-primary" onClick={onCreateTicketClick}>
            <Plus size={16} /> New Ticket
          </button>

          {/* Real-Time Notification Bell Button & Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              style={{
                position: 'relative',
                cursor: 'pointer',
                padding: 10,
                borderRadius: 10,
                background: showNotifDropdown ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Notifications"
            >
              <Bell size={18} color={unreadCount > 0 ? '#3b82f6' : 'var(--text-muted)'} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(239,68,68,0.6)'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifDropdown && (
              <div style={{
                position: 'absolute',
                top: 50,
                right: 0,
                width: 360,
                maxHeight: 460,
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: 14,
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.02)'
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                    Notifications {unreadCount > 0 && <span style={{ color: '#3b82f6' }}>({unreadCount} new)</span>}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div style={{ overflowY: 'auto', flex: 1, padding: 8 }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          marginBottom: 6,
                          background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(59, 130, 246, 0.12)',
                          borderLeft: n.read ? '3px solid transparent' : '3px solid #3b82f6',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: n.read ? '#cbd5e1' : '#ffffff' }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current User Profile Badge */}
          {user ? (
            <div
              onClick={() => {
                setProfileName(user?.name || '');
                setProfilePhone(user?.phone || '');
                setShowProfileModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 12px',
                background: 'rgba(15, 23, 42, 0.7)',
                borderRadius: 30,
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              title="Click to edit profile or account settings"
            >
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt="User Avatar"
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                  {user?.name || 'User Account'}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                  {currentRole} ({user?.department || 'General'})
                </span>
              </div>
            </div>
          ) : (
            <button className="btn-primary" onClick={onOpenAuthModal}>
              Sign In
            </button>
          )}

          {/* Auth Action (Sign Out / Sign In) */}
          {user && (
            <button
              onClick={logout}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-muted)',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <User color="#3b82f6" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Account Profile Settings</h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {profileMsg.text && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 14,
                background: profileMsg.isError ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                color: profileMsg.isError ? '#f87171' : '#34d399',
                fontSize: '0.85rem',
                border: profileMsg.isError ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)'
              }}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Name</label>
                <input
                  type="text"
                  className="glass-input"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Phone Number</label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="+1 (555) 019-2831"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                />
              </div>

              <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', display: 'block', marginBottom: 8 }}>
                  Change Password
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="password"
                    className="glass-input"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    className="glass-input"
                    placeholder="New Password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowProfileModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
