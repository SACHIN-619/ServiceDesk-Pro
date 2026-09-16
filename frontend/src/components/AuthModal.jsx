import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, User, Building, AlertTriangle, CheckCircle } from 'lucide-react';

const AuthModal = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('General');

  // Feedback State
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await register({
          name,
          email,
          password,
          department
        });
        setSuccessMsg(res.message || 'Registration submitted! Your account is PENDING administrator approval.');
        setName('');
        setEmail('');
        setPassword('');
      } else {
        await login(email, password);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 440, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'var(--accent-primary-gradient)',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={20} color="#fff" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              {isRegister ? 'Request Employee Account' : 'Enterprise Sign In'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 16,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            padding: '12px 14px',
            borderRadius: 8,
            marginBottom: 16,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.84rem',
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8
          }}>
            <CheckCircle size={18} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>{successMsg}</div>
          </div>
        )}

        {isRegister && (
          <div style={{
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            color: '#93c5fd',
            fontSize: '0.78rem',
            marginBottom: 16
          }}>
            ℹ️ Security Policy: New employee registrations require <strong>System Admin approval</strong> before login activation. Privileged roles (Manager/Tech/Admin) must be assigned directly by an Administrator.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isRegister && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. Rahul Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Work Email</label>
            <input
              type="email"
              className="glass-input"
              placeholder="name@servicedesk.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Password</label>
            <input
              type="password"
              className="glass-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegister && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Department</label>
              <select
                className="glass-input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="General">General</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales & Regional">Sales & Regional</option>
                <option value="Finance">Finance</option>
                <option value="Human Resources">Human Resources</option>
                <option value="IT Operations">IT Operations</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 10, padding: '12px', justifyContent: 'center' }}
          >
            {loading ? 'Processing...' : isRegister ? 'Submit Request' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => { setIsRegister(false); setError(''); setSuccessMsg(''); }}
                style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 700, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                onClick={() => { setIsRegister(true); setError(''); setSuccessMsg(''); }}
                style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 700, cursor: 'pointer' }}
              >
                Request Access
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
