import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { Plus, Ticket, BookOpen, CheckCircle, Search, HelpCircle } from 'lucide-react';
import TicketList from '../components/TicketList';

const EmployeeDashboard = ({ onSelectTicket, onCreateTicketClick }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyTickets();
  }, []);

  const loadMyTickets = async () => {
    try {
      const data = await fetchAPI('/tickets');
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = tickets.filter(t => !['CLOSED'].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero Welcome Banner */}
      <div className="glass-panel" style={{ padding: 28, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>
              👋 Welcome to IT Self-Service Portal
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Report hardware/software issues, track ticket progress, and search internal troubleshooting guides.
            </p>
          </div>
          <button className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }} onClick={onCreateTicketClick}>
            <Plus size={20} /> Create Support Ticket
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="glass-panel stat-card">
          <span className="stat-title">My Total Tickets</span>
          <div className="stat-val" style={{ color: '#3b82f6' }}>{tickets.length}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created Requests</span>
        </div>

        <div className="glass-panel stat-card">
          <span className="stat-title">Active In Progress</span>
          <div className="stat-val" style={{ color: '#f97316' }}>{activeCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#f97316' }}>Being Processed</span>
        </div>

        <div className="glass-panel stat-card">
          <span className="stat-title">Resolved & Confirmed</span>
          <div className="stat-val" style={{ color: '#10b981' }}>{resolvedCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Completed</span>
        </div>
      </div>

      {/* Ticket List */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>
          📂 My Support Tickets History
        </h3>
        <TicketList tickets={tickets} onSelectTicket={onSelectTicket} loading={loading} />
      </div>
    </div>
  );
};

export default EmployeeDashboard;
