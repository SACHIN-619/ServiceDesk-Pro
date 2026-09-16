import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Shield, Sparkles, Lock, Mail } from 'lucide-react';

const Login = () => {
  const { login, switchRole } = useAuth();
  const { showToast } = useNotification();

  const [email, setEmail] = useState('admin@servicedesk.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      showToast('Logged in successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSelect = (roleKey, demoEmail, demoPass) => {
    switchRole(roleKey);
    setEmail(demoEmail);
    setPassword(demoPass);
    showToast(`Switched active perspective to ${roleKey}`, 'info');
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div className="glass-panel" style={{ maxWidth: 480, width: '100%', padding: 32, backdropFilter: 'blur(25px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            background: 'var(--accent-primary-gradient)',
            width: 50,
            height: 50,
            borderRadius: 14,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(59, 130, 246, 0.5)',
            marginBottom: 12
          }}>
            <Shield size={28} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
            ServiceDesk <span style={{ color: '#3b82f6' }}>PRO</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
            Enterprise ITSM & Asset Management Portal
          </p>
        </div>

        {/* Quick Role Demo Selector Buttons */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          padding: 14,
          borderRadius: 12,
          border: '1px solid var(--glass-border)',
          marginBottom: 24
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} /> Quick Demo Access (1-Click Select Role):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button type="button" className="role-btn" onClick={() => handleQuickDemoSelect('ADMIN', 'admin@servicedesk.com', 'admin123')}>
              👑 Admin
            </button>
            <button type="button" className="role-btn" onClick={() => handleQuickDemoSelect('IT_MANAGER', 'manager@servicedesk.com', 'manager123')}>
              👨‍💼 Manager
            </button>
            <button type="button" className="role-btn" onClick={() => handleQuickDemoSelect('TECHNICIAN', 'tech@servicedesk.com', 'tech123')}>
              🧑‍💻 Tech
            </button>
            <button type="button" className="role-btn" onClick={() => handleQuickDemoSelect('EMPLOYEE', 'employee@servicedesk.com', 'employee123')}>
              👤 Employee
            </button>
            <button type="button" className="role-btn" onClick={() => handleQuickDemoSelect('ASSET_MANAGER', 'assetmanager@servicedesk.com', 'asset123')}>
              🖥️ Asset Mgr
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to ServiceDesk Pro'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
