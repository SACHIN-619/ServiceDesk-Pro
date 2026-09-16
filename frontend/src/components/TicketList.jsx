import React, { useState } from 'react';
import { Search, Filter, Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

const TicketList = ({ tickets, onSelectTicket, loading }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketId.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.requester?.name && t.requester.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'BREACHED'
        ? t.slaResponseBreached || t.slaResolutionBreached
        : t.status === statusFilter;

    const matchesPriority = priorityFilter === 'ALL' ? true : t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="glass-panel" style={{ padding: 20 }}>
      {/* Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        {/* Search */}
        <div style={{ position: 'relative', width: 320 }}>
          <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 38, width: '100%' }}
            placeholder="Search Ticket ID, title, requester..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['ALL', 'OPEN', 'IN_PROGRESS', 'BREACHED', 'RESOLVED'].map((st) => (
              <button
                key={st}
                className="role-btn"
                style={{
                  background: statusFilter === st ? 'var(--accent-primary-gradient)' : 'rgba(255,255,255,0.05)',
                  color: statusFilter === st ? '#ffffff' : 'var(--text-muted)'
                }}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'BREACHED' ? '⚠️ Breached' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <select
            className="form-select"
            style={{ width: 140 }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Summary & Category</th>
              <th>Requester</th>
              <th>Priority</th>
              <th>Status</th>
              <th>SLA Target</th>
              <th>Assigned To</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                  Loading Tickets...
                </td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                  No tickets found matching filters.
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => (
                <tr key={ticket._id} onClick={() => onSelectTicket(ticket._id)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 800, color: '#3b82f6' }}>
                    #{ticket.ticketId}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: 2 }}>
                      {ticket.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Category: {ticket.category}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>
                      {ticket.requester?.name || 'Employee'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {ticket.department}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${ticket.priority.toLowerCase()}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${ticket.status.toLowerCase()}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td>
                    {ticket.slaResolutionBreached ? (
                      <span className="badge badge-breach">Overdue</span>
                    ) : ticket.resolutionDeadline ? (
                      <div style={{ fontSize: '0.78rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {new Date(ticket.resolutionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>On Track</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: ticket.assignedTechnician ? '#cbd5e1' : '#f97316' }}>
                      {ticket.assignedTechnician?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                      View <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketList;
