import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import {
  Shield,
  Clock,
  AlertTriangle,
  Users,
  CheckCircle,
  Edit3,
  Save,
  UserCheck,
  TrendingUp,
  Sliders,
  Filter,
  BarChart2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import TicketList from '../components/TicketList';

const ITManagerDashboard = ({ onSelectTicket }) => {
  const { showToast } = useNotification();
  const [data, setData] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tickets' | 'workload' | 'sla'
  const [ticketFilter, setTicketFilter] = useState('ALL'); // 'ALL' | 'UNASSIGNED' | 'AT_RISK' | 'BREACHED'

  // SLA Policy Management State
  const [slaPolicies, setSlaPolicies] = useState([]);
  const [editingPolicyId, setEditingPolicyId] = useState(null);
  const [editResponseHours, setEditResponseHours] = useState('');
  const [editResolutionHours, setEditResolutionHours] = useState('');
  const [checkingBreaches, setCheckingBreaches] = useState(false);

  // Quick Dispatch State
  const [assigningTicketId, setAssigningTicketId] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState('');

  useEffect(() => {
    loadManagerData();
    loadSLAPolicies();
    loadTechnicians();
  }, []);

  const loadManagerData = async () => {
    try {
      const [analytics, ticketList] = await Promise.all([
        fetchAPI('/analytics/dashboard'),
        fetchAPI('/tickets')
      ]);
      setData(analytics);
      setTickets(ticketList);
    } catch (e) {
      console.error(e);
      showToast('Failed to load manager operations data', 'error');
    } finally {
      setLoading(false);
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

  const loadTechnicians = async () => {
    try {
      const allUsers = await fetchAPI('/users');
      const techs = allUsers.filter(u => u.role === 'TECHNICIAN' && u.status === 'ACTIVE');
      setTechnicians(techs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePolicy = async (id) => {
    try {
      await fetchAPI(`/sla/policies/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          responseSLAHours: parseFloat(editResponseHours),
          resolutionSLAHours: parseFloat(editResolutionHours)
        })
      });
      showToast('SLA Policy target parameters updated successfully!', 'success');
      setEditingPolicyId(null);
      loadSLAPolicies();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleTriggerBreachCheck = async () => {
    setCheckingBreaches(true);
    try {
      const res = await fetchAPI('/sla/check-breaches', { method: 'POST' });
      showToast(`SLA Audit Scan Complete: ${res.breachedCount || 0} breaches flagged.`, 'info');
      loadManagerData();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setCheckingBreaches(false);
    }
  };

  const handleQuickAssign = async (ticketId, techId) => {
    if (!techId) return;
    try {
      await fetchAPI(`/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ technicianId: techId })
      });
      showToast('Technician assigned successfully!', 'success');
      setAssigningTicketId(null);
      setSelectedTechId('');
      loadManagerData();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // Filter tickets according to quick tabs
  const filteredTickets = tickets.filter(t => {
    if (ticketFilter === 'UNASSIGNED') {
      return !t.assignedTechnician && t.status === 'OPEN';
    }
    if (ticketFilter === 'AT_RISK') {
      const now = new Date();
      const deadline = t.resolutionDeadline ? new Date(t.resolutionDeadline) : null;
      return (
        ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status) &&
        !t.slaResolutionBreached &&
        deadline &&
        deadline > now &&
        deadline < new Date(now.getTime() + 2 * 60 * 60 * 1000)
      );
    }
    if (ticketFilter === 'BREACHED') {
      return t.slaResponseBreached || t.slaResolutionBreached;
    }
    return true;
  });

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading IT Manager Control Center...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Manager Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: 24,
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
          borderColor: 'rgba(59, 130, 246, 0.4)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={36} color="#3b82f6" />
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
                👨‍💼 IT Manager Operations Center
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Operational oversight: rebalance technician workloads, calibrate SLA policies, and manage ticket queues.
              </p>
            </div>
          </div>

          {/* Quick Tab Switcher */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`btn-secondary ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
              style={{ background: activeTab === 'overview' ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: '#fff' }}
            >
              <TrendingUp size={16} /> Overview
            </button>
            <button
              className={`btn-secondary ${activeTab === 'tickets' ? 'active' : ''}`}
              onClick={() => setActiveTab('tickets')}
              style={{ background: activeTab === 'tickets' ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: '#fff' }}
            >
              <Filter size={16} /> Ticket Queue ({tickets.length})
            </button>
            <button
              className={`btn-secondary ${activeTab === 'workload' ? 'active' : ''}`}
              onClick={() => setActiveTab('workload')}
              style={{ background: activeTab === 'workload' ? '#06b6d4' : 'rgba(255,255,255,0.05)', color: '#fff' }}
            >
              <Users size={16} /> Tech Workload ({data?.techWorkload?.length || 0})
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

      {/* KPI Cards (Always visible at top for high-level awareness) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div
          className="glass-panel stat-card"
          onClick={() => { setActiveTab('tickets'); setTicketFilter('UNASSIGNED'); }}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
        >
          <span className="stat-title">Unassigned Tickets</span>
          <div className="stat-val" style={{ color: '#f97316' }}>{data?.summary?.unassignedTickets || 0}</div>
          <span style={{ fontSize: '0.75rem', color: '#f97316' }}>Click to dispatch</span>
        </div>

        <div
          className="glass-panel stat-card"
          onClick={() => { setActiveTab('tickets'); setTicketFilter('AT_RISK'); }}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
        >
          <span className="stat-title">SLA At Risk</span>
          <div className="stat-val" style={{ color: '#fde047' }}>{data?.summary?.slaAtRisk || 0}</div>
          <span style={{ fontSize: '0.75rem', color: '#fde047' }}>Due within 2 Hours</span>
        </div>

        <div
          className="glass-panel stat-card"
          onClick={() => { setActiveTab('tickets'); setTicketFilter('BREACHED'); }}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
        >
          <span className="stat-title">Total SLA Breaches</span>
          <div className="stat-val" style={{ color: '#ef4444' }}>{data?.summary?.slaBreaches || 0}</div>
          <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Requires Escalation</span>
        </div>

        <div
          className="glass-panel stat-card"
          onClick={() => setActiveTab('workload')}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
        >
          <span className="stat-title">Active Technicians</span>
          <div className="stat-val" style={{ color: '#06b6d4' }}>{data?.techWorkload?.length || 0}</div>
          <span style={{ fontSize: '0.75rem', color: '#06b6d4' }}>View Workload Roster</span>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS CHARTS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
            {/* Monthly Trend Chart */}
            <div className="glass-panel" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                  📈 Ticket Volume vs Resolution Trends
                </h3>
              </div>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={data?.monthlyTrends || []}>
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <Bar dataKey="tickets" fill="#3b82f6" name="Total Incoming" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Dispatch Table for Unassigned Queue */}
            <div className="glass-panel" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                  ⚡ Quick Technician Dispatch (Unassigned)
                </h3>
                <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                  {tickets.filter(t => !t.assignedTechnician && t.status === 'OPEN').length} Pending
                </span>
              </div>
              
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {tickets.filter(t => !t.assignedTechnician && t.status === 'OPEN').length === 0 ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: '#10b981', fontSize: '0.88rem' }}>
                    <CheckCircle size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                    All incoming tickets are dispatched to technicians!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tickets.filter(t => !t.assignedTechnician && t.status === 'OPEN').slice(0, 5).map(t => (
                      <div
                        key={t._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 8,
                          border: '1px solid rgba(255,255,255,0.06)'
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1, marginRight: 12 }}>
                          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            #{t.ticketId} — {t.title}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {t.category} • <span style={{ color: t.priority === 'Critical' ? '#ef4444' : t.priority === 'High' ? '#f97316' : '#38bdf8' }}>{t.priority}</span>
                          </div>
                        </div>

                        {assigningTicketId === t._id ? (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <select
                              className="form-input"
                              style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                              value={selectedTechId}
                              onChange={(e) => setSelectedTechId(e.target.value)}
                            >
                              <option value="">Select Tech...</option>
                              {technicians.map(tech => (
                                <option key={tech._id} value={tech._id}>{tech.name}</option>
                              ))}
                            </select>
                            <button
                              className="btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              disabled={!selectedTechId}
                              onClick={() => handleQuickAssign(t._id, selectedTechId)}
                            >
                              Assign
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ padding: '4px 6px', fontSize: '0.75rem' }}
                              onClick={() => setAssigningTicketId(null)}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                            onClick={() => { setAssigningTicketId(t._id); setSelectedTechId(''); }}
                          >
                            Assign Tech
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Queue in Overview */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                📋 All Operational Tickets
              </h3>
            </div>
            <TicketList tickets={tickets} onSelectTicket={onSelectTicket} />
          </div>
        </div>
      )}

      {/* TAB 2: FILTERED TICKET QUEUE */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filter Queue:</span>
            {[
              { id: 'ALL', label: `All Tickets (${tickets.length})` },
              { id: 'UNASSIGNED', label: `Unassigned (${data?.summary?.unassignedTickets || 0})` },
              { id: 'AT_RISK', label: `SLA At Risk (${data?.summary?.slaAtRisk || 0})` },
              { id: 'BREACHED', label: `SLA Breached (${data?.summary?.slaBreaches || 0})` }
            ].map(f => (
              <button
                key={f.id}
                className={`btn-secondary ${ticketFilter === f.id ? 'active' : ''}`}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  background: ticketFilter === f.id ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                  color: '#fff'
                }}
                onClick={() => setTicketFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <TicketList tickets={filteredTickets} onSelectTicket={onSelectTicket} />
        </div>
      )}

      {/* TAB 3: TECHNICIAN WORKLOAD ROSTER */}
      {activeTab === 'workload' && (
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                🧑‍💻 Technician Workload & Capacity Roster
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                View current active tickets, resolution counts, and workload health across engineering staff.
              </p>
            </div>
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Technician</th>
                  <th>Department</th>
                  <th>Active In-Progress</th>
                  <th>Resolved Total</th>
                  <th>Workload Capacity</th>
                </tr>
              </thead>
              <tbody>
                {data?.techWorkload?.map((tech) => {
                  const loadPercent = Math.min(100, (tech.assignedCount / 8) * 100);
                  const loadColor = tech.assignedCount > 5 ? '#ef4444' : tech.assignedCount > 2 ? '#f59e0b' : '#10b981';

                  return (
                    <tr key={tech._id}>
                      <td style={{ fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={tech.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                          alt="Avatar"
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        {tech.name}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{tech.department || 'IT Operations'}</td>
                      <td>
                        <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>
                          {tech.assignedCount} Active
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>{tech.resolvedCount} Closed</span>
                      </td>
                      <td style={{ minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${loadPercent}%`, height: '100%', background: loadColor, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: loadColor }}>
                            {tech.assignedCount > 5 ? 'High Load' : tech.assignedCount > 2 ? 'Optimal' : 'Available'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SLA POLICY CALIBRATION */}
      {activeTab === 'sla' && (
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                ⏱️ Enterprise SLA Policy Configuration
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Calibrate first-response and full-resolution target deadlines enforced across all incoming service tickets.
              </p>
            </div>
            <button
              className="btn-primary"
              onClick={handleTriggerBreachCheck}
              disabled={checkingBreaches}
              style={{ background: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <AlertTriangle size={16} />
              {checkingBreaches ? 'Scanning Breaches...' : 'Scan & Flag Overdue SLAs'}
            </button>
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
                          <span style={{ fontWeight: 700, color: '#6ee7b7' }}>
                            {p.responseSLAHours}h ({p.responseSLAHours * 60}m)
                          </span>
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
                          <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                            {p.resolutionSLAHours}h
                          </span>
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
                            <Edit3 size={14} /> Edit Targets
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
    </div>
  );
};

export default ITManagerDashboard;
