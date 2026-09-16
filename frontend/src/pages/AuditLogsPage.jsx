import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { FileText, Search, Shield, Filter } from 'lucide-react';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [search]);

  const loadLogs = async () => {
    try {
      const data = await fetchAPI(`/audit?search=${encodeURIComponent(search)}`);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Banner */}
      <div className="glass-panel" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileText size={32} color="#3b82f6" />
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
              📜 System Audit Trail & Compliance Logging
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Immutable audit record tracking system events, status transitions, SLA breaches, and asset assignments.
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', maxWidth: 400 }}>
        <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 12 }} />
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: 38, width: '100%' }}
          placeholder="Filter by actor, action, or ticket..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: 20 }}>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor / User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Target Resource</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                    Loading Audit Logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 700, color: '#f8fafc' }}>
                      {log.actorName}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' }}>
                        {log.actorRole}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#c084fc' }}>
                      {log.action}
                    </td>
                    <td style={{ fontWeight: 600, color: '#3b82f6' }}>
                      {log.target}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
