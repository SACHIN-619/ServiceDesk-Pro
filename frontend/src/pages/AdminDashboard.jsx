import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Shield, Users, Clock, AlertTriangle, FileText, CheckCircle, XCircle, UserPlus, Search, Edit3, Save } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const AdminDashboard = ({ onSelectTicket }) => {
  const { showToast } = useNotification();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // User Management State
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'pending' | 'sla'
  const [userSearch, setUserSearch] = useState('');

  // SLA Policies State
  const [slaPolicies, setSlaPolicies] = useState([]);
  const [editingPolicyId, setEditingPolicyId] = useState(null);
  const [editResponseHours, setEditResponseHours] = useState('');
  const [editResolutionHours, setEditResolutionHours] = useState('');

  // Create User Modal State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password123');
  const [newUserRole, setNewUserRole] = useState('EMPLOYEE');
  const [newUserDept, setNewUserDept] = useState('General');

  useEffect(() => {
    loadAnalytics();
    loadUsers();
    loadSLAPolicies();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await fetchAPI('/analytics/dashboard');
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const allUsers = await fetchAPI('/users');
      const pending = await fetchAPI('/users/pending');
      setUsers(allUsers);
      setPendingUsers(pending);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSLAPolicies = async () => {
    try {
      const policies = await fetchAPI('/sla/policies');
      setSlaPolicies(policies);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveUser = async (userId, userName) => {
    try {
      await fetchAPI(`/users/${userId}/approve`, { method: 'PUT' });
      showToast(`User ${userName} approved successfully!`, 'success');
      loadUsers();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleRejectUser = async (userId, userName) => {
    try {
      await fetchAPI(`/users/${userId}/reject`, { method: 'PUT' });
      showToast(`User ${userName} registration request rejected.`, 'error');
      loadUsers();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await fetchAPI('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          department: newUserDept
        })
      });
      showToast(`User ${newUserName} provisioned as ${newUserRole}!`, 'success');
      setShowCreateUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      loadUsers();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleSavePolicy = async (policyId) => {
    try {
      const updated = await fetchAPI(`/sla/policies/${policyId}`, {
        method: 'PUT',
        body: JSON.stringify({
          responseSLAHours: parseFloat(editResponseHours),
          resolutionSLAHours: parseFloat(editResolutionHours)
        })
      });
      showToast(`SLA Policy for ${updated.priority} updated!`, 'success');
      setEditingPolicyId(null);
      loadSLAPolicies();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading Admin Control Center...</div>;
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.department.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={32} color="#8b5cf6" />
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                👑 System Administrator Command Center
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                Full platform governance, user provisioning, pending registration approvals, and SLA policies.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className={`btn-secondary ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
              style={{ background: activeTab === 'overview' ? '#8b5cf6' : 'rgba(255,255,255,0.05)', color: '#fff' }}
            >
              Overview & Analytics
            </button>
            <button
              className={`btn-secondary ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
              style={{ background: activeTab === 'users' ? '#8b5cf6' : 'rgba(255,255,255,0.05)', color: '#fff' }}
            >
              All Users ({users.length})
            </button>
            <button
              className={`btn-secondary ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
              style={{
                background: activeTab === 'pending' ? '#ef4444' : pendingUsers.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                borderColor: pendingUsers.length > 0 ? '#ef4444' : 'transparent'
              }}
            >
              Pending Approvals {pendingUsers.length > 0 && `(${pendingUsers.length})`}
            </button>
            <button
              className={`btn-secondary ${activeTab === 'sla' ? 'active' : ''}`}
              onClick={() => setActiveTab('sla')}
              style={{ background: activeTab === 'sla' ? '#8b5cf6' : 'rgba(255,255,255,0.05)', color: '#fff' }}
            >
              <Clock size={16} /> SLA Policies
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="glass-panel stat-card">
              <span className="stat-title">Total ITSM Tickets</span>
              <div className="stat-val" style={{ color: '#3b82f6' }}>{data?.summary?.totalTickets || 0}</div>
              <span style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>System Active</span>
            </div>

            <div className="glass-panel stat-card">
              <span className="stat-title">Pending Account Approvals</span>
              <div className="stat-val" style={{ color: pendingUsers.length > 0 ? '#ef4444' : '#10b981' }}>
                {pendingUsers.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Require Administrator Verification</span>
            </div>

            <div className="glass-panel stat-card">
              <span className="stat-title">Active Users & Techs</span>
              <div className="stat-val" style={{ color: '#10b981' }}>{users.filter(u => u.status === 'ACTIVE').length}</div>
              <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Authenticated Users</span>
            </div>

            <div className="glass-panel stat-card">
              <span className="stat-title">SLA Breaches</span>
              <div className="stat-val" style={{ color: '#ef4444' }}>{data?.summary?.slaBreaches || 0}</div>
              <span style={{ fontSize: '0.75rem', color: '#f87171' }}>Overdue Target</span>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Ticket Volume Trends */}
            <div className="glass-panel" style={{ padding: 20 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>
                📈 Ticket Volume & Resolution Trends
              </h3>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={data?.monthlyTrends || []}>
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <Bar dataKey="tickets" fill="#3b82f6" name="Total Tickets" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Technician Workload Allocation */}
            <div className="glass-panel" style={{ padding: 20 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>
                🧑‍💻 Technician Workload Allocation
              </h3>
              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Technician</th>
                      <th>Assigned</th>
                      <th>Resolved</th>
                      <th>Load Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.techWorkload?.map((tech) => (
                      <tr key={tech._id}>
                        <td style={{ fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <img src={tech.avatar} alt="Avatar" style={{ width: 26, height: 26, borderRadius: '50%' }} />
                          {tech.name}
                        </td>
                        <td style={{ fontWeight: 800, color: '#3b82f6' }}>{tech.assignedCount}</td>
                        <td style={{ fontWeight: 800, color: '#10b981' }}>{tech.resolvedCount}</td>
                        <td>
                          <span className={`badge badge-${tech.assignedCount > 5 ? 'critical' : 'low'}`}>
                            {tech.assignedCount > 5 ? 'High Load' : 'Balanced'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SLA Policies Tab */}
      {activeTab === 'sla' && (
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                ⏱️ Enterprise SLA Target Policies
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                Configure maximum permitted response and resolution times per ticket priority tier.
              </p>
            </div>
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Priority Tier</th>
                  <th>Response SLA (Hours)</th>
                  <th>Resolution SLA (Hours)</th>
                  <th>Description</th>
                  <th>Escalation Target</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slaPolicies.map((p) => {
                  const isEditing = editingPolicyId === p._id;
                  return (
                    <tr key={p._id}>
                      <td>
                        <span className={`badge badge-${p.priority.toLowerCase()}`}>
                          {p.priority}
                        </span>
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.05"
                            className="form-input"
                            style={{ width: 90 }}
                            value={editResponseHours}
                            onChange={(e) => setEditResponseHours(e.target.value)}
                          />
                        ) : (
                          <span style={{ fontWeight: 700, color: '#6ee7b7' }}>{p.responseSLAHours}h ({p.responseSLAHours * 60}m)</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.1"
                            className="form-input"
                            style={{ width: 90 }}
                            value={editResolutionHours}
                            onChange={(e) => setEditResolutionHours(e.target.value)}
                          />
                        ) : (
                          <span style={{ fontWeight: 700, color: '#38bdf8' }}>{p.resolutionSLAHours}h</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.description}</td>
                      <td style={{ color: '#c084fc', fontWeight: 600 }}>{p.escalationTarget}</td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn-primary"
                              onClick={() => handleSavePolicy(p._id)}
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            >
                              <Save size={14} /> Save
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => setEditingPolicyId(null)}
                              style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-secondary"
                            onClick={() => {
                              setEditingPolicyId(p._id);
                              setEditResponseHours(p.responseSLAHours);
                              setEditResolutionHours(p.resolutionSLAHours);
                            }}
                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Account Approvals Tab */}
      {activeTab === 'pending' && (
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              ⏳ Pending Registration Requests ({pendingUsers.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Public registrations remain PENDING until explicitly approved by System Administrator.
            </span>
          </div>

          {pendingUsers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              ✅ No pending registration requests. All user accounts are active.
            </div>
          ) : (
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Email</th>
                    <th>Requested Role</th>
                    <th>Department</th>
                    <th>Submitted Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr key={user._id}>
                      <td style={{ fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                        {user.name}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{user.email}</td>
                      <td>
                        <span className="badge badge-medium">{user.role}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{user.department}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn-primary"
                          onClick={() => handleApproveUser(user._id, user.name)}
                          style={{ padding: '6px 12px', fontSize: '0.78rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => handleRejectUser(user._id, user.name)}
                          style={{ padding: '6px 12px', fontSize: '0.78rem', borderColor: '#ef4444', color: '#f87171' }}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* All Users Directory Tab */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Users size={20} color="#8b5cf6" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Enterprise User Provisioning Directory ({users.length})
              </h3>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ paddingLeft: 36, width: 260 }}
                />
              </div>

              <button className="btn-primary" onClick={() => setShowCreateUserModal(true)}>
                <UserPlus size={16} /> Provision User
              </button>
            </div>
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                      {u.name}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td>
                      <span className={`badge badge-${u.role === 'ADMIN' ? 'critical' : u.role === 'TECHNICIAN' ? 'high' : 'medium'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.department}</td>
                    <td>
                      <span className={`badge badge-${u.status === 'ACTIVE' ? 'low' : u.status === 'PENDING' ? 'medium' : 'critical'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provision User Modal */}
      {showCreateUserModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserPlus color="#8b5cf6" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Provision Enterprise User</h3>
              </div>
              <button
                onClick={() => setShowCreateUserModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Full Name</label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. Arjun Sharma"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Work Email</label>
                <input
                  type="email"
                  className="glass-input"
                  placeholder="name@servicedesk.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Password</label>
                <input
                  type="password"
                  className="glass-input"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Assigned Role</label>
                <select
                  className="glass-input"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                >
                  <option value="EMPLOYEE">👤 EMPLOYEE</option>
                  <option value="TECHNICIAN">🧑‍💻 TECHNICIAN</option>
                  <option value="IT_MANAGER">👨‍💼 IT MANAGER</option>
                  <option value="ASSET_MANAGER">🖥️ ASSET MANAGER</option>
                  <option value="ADMIN">👑 SYSTEM ADMIN</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Department</label>
                <input
                  type="text"
                  className="glass-input"
                  value={newUserDept}
                  onChange={(e) => setNewUserDept(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
