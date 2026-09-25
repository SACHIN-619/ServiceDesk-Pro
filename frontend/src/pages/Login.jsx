import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Shield, Sparkles, Lock, Mail, User, Phone, Building, CheckCircle2, ArrowRight, AlertCircle, Info } from 'lucide-react';
import { registerUser } from '../services/api';

const Login = () => {
  const { login, switchRole } = useAuth();
  const { showToast } = useNotification();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [loading, setLoading] = useState(false);

  // Sign In State (clean state for live login)
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up State
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'Engineering',
    phone: ''
  });
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [signUpMessage, setSignUpMessage] = useState('');

  const demoAccounts = [
    { role: 'System Admin', email: 'admin@servicedesk.com', pass: 'admin123', key: 'ADMIN', color: '#8b5cf6', icon: '👑' },
    { role: 'IT Manager', email: 'manager@servicedesk.com', pass: 'manager123', key: 'IT_MANAGER', color: '#3b82f6', icon: '👨‍💼' },
    { role: 'Technician', email: 'tech@servicedesk.com', pass: 'tech123', key: 'TECHNICIAN', color: '#06b6d4', icon: '🧑‍💻' },
    { role: 'Employee', email: 'employee@servicedesk.com', pass: 'employee123', key: 'EMPLOYEE', color: '#10b981', icon: '👤' },
    { role: 'Asset Manager', email: 'assetmanager@servicedesk.com', pass: 'asset123', key: 'ASSET_MANAGER', color: '#f59e0b', icon: '🖥️' }
  ];

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(signInEmail, signInPassword);
      showToast('Welcome back to ServiceDesk Pro', 'success');
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (signUpData.password !== signUpData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (signUpData.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({
        name: signUpData.name,
        email: signUpData.email,
        password: signUpData.password,
        department: signUpData.department,
        phone: signUpData.phone
      });
      setSignUpSuccess(true);
      setSignUpMessage(res.message || 'Registration submitted for administrator review.');
      showToast('Registration submitted successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demo) => {
    setSignInEmail(demo.email);
    setSignInPassword(demo.pass);
    showToast(`Filled credentials for ${demo.role}`, 'info');
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: 520,
        width: '100%',
        padding: 36,
        borderRadius: 20,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            width: 58,
            height: 58,
            borderRadius: 16,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)',
            marginBottom: 14
          }}>
            <Shield size={32} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
            ServiceDesk <span style={{ color: '#38bdf8' }}>PRO</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 6 }}>
            Enterprise ITSM, AI Triage & Asset Lifecycle Portal
          </p>
        </div>

        {/* Tab Navigation (Sign In vs Sign Up) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: 4,
          borderRadius: 12,
          marginBottom: 26,
          border: '1px solid var(--glass-border)'
        }}>
          <button
            type="button"
            onClick={() => { setMode('signin'); setSignUpSuccess(false); }}
            style={{
              padding: '10px 16px',
              borderRadius: 9,
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: mode === 'signin' ? 'var(--accent-primary-gradient)' : 'transparent',
              color: mode === 'signin' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: mode === 'signin' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setSignUpSuccess(false); }}
            style={{
              padding: '10px 16px',
              borderRadius: 9,
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: mode === 'signup' ? 'var(--accent-primary-gradient)' : 'transparent',
              color: mode === 'signup' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: mode === 'signup' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
            }}
          >
            Create Account
          </button>
        </div>

        {/* MODE 1: SIGN IN */}
        {mode === 'signin' && (
          <div>
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} color="#3b82f6" /> Work Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={14} color="#3b82f6" /> Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: '0.95rem', marginTop: 8 }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In to ServiceDesk Pro'} <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* MODE 2: SIGN UP */}
        {mode === 'signup' && (
          <div>
            {signUpSuccess ? (
              <div style={{
                textAlign: 'center',
                padding: '24px 16px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 14
              }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12
                }}>
                  <CheckCircle2 size={30} color="#10b981" />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6ee7b7', margin: 0 }}>
                  Registration Submitted!
                </h3>
                <p style={{ color: '#e2e8f0', fontSize: '0.88rem', margin: '12px 0 20px 0', lineHeight: 1.5 }}>
                  {signUpMessage}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 8, textAlign: 'left', marginBottom: 20 }}>
                  ℹ <strong>Approval Workflow:</strong> An authorized System Administrator must approve your account (<code>PENDING</code> $\rightarrow$ <code>ACTIVE</code>) before you can sign in.
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => { setMode('signin'); setSignUpSuccess(false); }}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Security Model Alert */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  padding: '12px 14px',
                  borderRadius: 10,
                  fontSize: '0.8rem',
                  color: '#93c5fd'
                }}>
                  <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Employee Self-Registration:</strong> New accounts are assigned the <code>EMPLOYEE</code> role in <code>PENDING</code> status. Privileged roles (Manager, Tech, Admin) are provisioned internally.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={14} color="#38bdf8" /> Full Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jane Doe"
                    value={signUpData.name}
                    onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={14} color="#38bdf8" /> Work Email
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="jane.doe@company.com"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building size={14} color="#38bdf8" /> Department
                    </label>
                    <select
                      className="form-select"
                      value={signUpData.department}
                      onChange={(e) => setSignUpData({ ...signUpData, department: e.target.value })}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="Finance">Finance</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Sales & Marketing">Sales & Marketing</option>
                      <option value="Legal & Operations">Legal & Operations</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={14} color="#38bdf8" /> Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+1 (555) 000-0000"
                      value={signUpData.phone}
                      onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Lock size={14} color="#38bdf8" /> Password
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Min 6 characters"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Lock size={14} color="#38bdf8" /> Confirm Password
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Repeat password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: '0.95rem', marginTop: 6 }}
                  disabled={loading}
                >
                  {loading ? 'Submitting Registration...' : 'Create Employee Account'} <ArrowRight size={18} />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

