import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  X,
  Clock,
  User,
  Shield,
  MessageSquare,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  HardDrive,
  Send,
  Timer
} from 'lucide-react';

const TicketDetailModal = ({ ticketId, isOpen, onClose, onTicketUpdated }) => {
  const { currentRole, user } = useAuth();
  const { showToast } = useNotification();

  const [ticket, setTicket] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [workLogMinutes, setWorkLogMinutes] = useState(15);
  const [workLogNotes, setWorkLogNotes] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [reopenReason, setReopenReason] = useState('');

  // AI RAG State
  const [aiSolutions, setAiSolutions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (isOpen && ticketId) {
      loadTicketDetails();
      if (['ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER'].includes(currentRole)) {
        loadTechnicians();
      }
    }
  }, [isOpen, ticketId, currentRole]);

  const loadTicketDetails = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI(`/tickets/${ticketId}`);
      setTicket(data);
      if (data.assignedTechnician) {
        setSelectedTech(data.assignedTechnician._id);
      }

      // Fetch Grounded AI RAG Recommendations for this ticket
      fetchAISolutions(data.title, data.description);
    } catch (err) {
      showToast(err.message || 'Failed to load ticket details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      const data = await fetchAPI('/users/technicians');
      setTechnicians(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAISolutions = async (title, description) => {
    setAiLoading(true);
    try {
      const res = await fetchAPI('/ai/recommend', {
        method: 'POST',
        body: JSON.stringify({ title, description })
      });
      setAiSolutions(res);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus, note = '') => {
    try {
      const updated = await fetchAPI(`/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, note })
      });
      showToast(`Status updated to ${newStatus}`, 'success');
      setTicket(updated);
      if (onTicketUpdated) onTicketUpdated(updated);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAssignTechnician = async (techId) => {
    try {
      const updated = await fetchAPI(`/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ technicianId: techId })
      });
      showToast('Technician assigned successfully', 'success');
      setTicket(updated);
      if (onTicketUpdated) onTicketUpdated(updated);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const updated = await fetchAPI(`/tickets/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: commentText, isInternal: isInternalComment })
      });
      showToast('Comment added', 'success');
      setTicket(updated);
      setCommentText('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAddWorkLog = async (e) => {
    e.preventDefault();
    if (!workLogNotes.trim()) return;

    try {
      const updated = await fetchAPI(`/tickets/${ticketId}/worklog`, {
        method: 'POST',
        body: JSON.stringify({ timeSpentMinutes: workLogMinutes, notes: workLogNotes })
      });
      showToast(`Logged ${workLogMinutes} mins of work`, 'success');
      setTicket(updated);
      setWorkLogNotes('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (!isOpen) return null;

  const isStaffRole = ['TECHNICIAN', 'IT_MANAGER', 'ADMIN', 'SYSTEM_ADMIN'].includes(currentRole);
  const isManagerOrAdmin = ['IT_MANAGER', 'ADMIN', 'SYSTEM_ADMIN'].includes(currentRole);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 880, width: '100%' }} onClick={(e) => e.stopPropagation()}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading Ticket Details...
          </div>
        ) : !ticket ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
            Ticket Not Found or Access Unauthorized
          </div>
        ) : (
          <div>
            {/* Header Title & Badges */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#3b82f6' }}>
                    #{ticket.ticketId}
                  </span>
                  <span className={`badge badge-${ticket.priority.toLowerCase()}`}>
                    {ticket.priority}
                  </span>
                  <span className={`badge badge-${ticket.status.toLowerCase()}`}>
                    {ticket.status}
                  </span>
                  {(ticket.slaResponseBreached || ticket.slaResolutionBreached) && (
                    <span className="badge badge-breach">
                      ⚠ SLA BREACHED
                    </span>
                  )}
                  {ticket.aiClassification && (
                    <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                      {ticket.aiClassification.isAiGenerated ? '🤖 Groq LLM Classified' : '⚡ Heuristic Classified'}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  {ticket.title}
                </h2>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
              {/* Left Main Pane */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Description */}
                <div className="glass-panel" style={{ padding: 16 }}>
                  <h4 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Problem Description
                  </h4>
                  <p style={{ fontSize: '0.92rem', color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                    {ticket.description}
                  </p>
                </div>

                {/* AI RAG Knowledge-Base Recommendations Box */}
                <div className="ai-glow-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#c084fc' }}>
                      <Sparkles size={18} /> Grounded RAG Knowledge Recommendations
                    </div>
                    {aiSolutions && (
                      <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.25)', color: '#e9d5ff' }}>
                        {aiSolutions.isAiGenerated ? 'Groq LLM Synthesized' : 'Knowledge Base Matched'}
                      </span>
                    )}
                  </div>

                  {aiLoading ? (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Querying Knowledge Base and synthesizing grounded steps...
                    </p>
                  ) : aiSolutions?.articles?.length > 0 ? (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Referenced Source Articles:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                          {aiSolutions.articles.map(art => (
                            <div
                              key={art._id}
                              style={{
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: '#38bdf8',
                                background: 'rgba(56, 189, 248, 0.12)',
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              📖 {art.title}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {aiSolutions.suggestedResolutionSteps?.map((step, i) => (
                          <div key={i} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: 8, borderLeft: '3px solid #a855f7' }}>
                            {step}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                      ℹ️ No matching knowledge base articles found for this issue in the internal repository.
                    </p>
                  )}
                </div>

                {/* Technician Work Log Form (Tech/Manager/Admin) */}
                {isStaffRole && (
                  <div className="glass-panel" style={{ padding: 16 }}>
                    <h4 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Timer size={16} color="#06b6d4" /> Add Technician Work Log
                    </h4>
                    <form onSubmit={handleAddWorkLog} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input
                          type="number"
                          className="form-input"
                          style={{ width: 120 }}
                          placeholder="Mins"
                          value={workLogMinutes}
                          onChange={(e) => setWorkLogMinutes(e.target.value)}
                        />
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 1 }}
                          placeholder="Describe technical troubleshooting action..."
                          value={workLogNotes}
                          onChange={(e) => setWorkLogNotes(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="btn-secondary" style={{ alignSelf: 'flex-end', fontSize: '0.8rem' }}>
                        Log Time
                      </button>
                    </form>

                    {ticket.workLogs?.length > 0 && (
                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>Logged Work:</span>
                        {ticket.workLogs.map((wl, i) => (
                          <div key={i} style={{ fontSize: '0.78rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: 6 }}>
                            ⏱️ <strong>{wl.timeSpentMinutes} mins</strong> by {wl.technician?.name || 'Technician'} — {wl.notes} ({new Date(wl.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Comments & Activity Timeline */}
                <div className="glass-panel" style={{ padding: 16 }}>
                  <h4 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={16} color="#3b82f6" /> Activity & Conversation Log
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                    {ticket.comments?.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>No comments yet.</p>
                    ) : (
                      ticket.comments?.map((c, idx) => (
                        <div key={idx} style={{
                          padding: 12,
                          borderRadius: 10,
                          background: c.isInternal ? 'rgba(234, 179, 8, 0.1)' : 'rgba(15, 23, 42, 0.6)',
                          border: c.isInternal ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid var(--glass-border)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                              {c.author?.name || 'Staff User'} {c.isInternal && <span style={{ color: '#fde047', fontSize: '0.7rem' }}>(INTERNAL NOTE)</span>}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>{c.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Input */}
                  <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="Type a comment or response..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {isStaffRole && (
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="checkbox"
                            checked={isInternalComment}
                            onChange={(e) => setIsInternalComment(e.target.checked)}
                          />
                          Internal Staff Note Only
                        </label>
                      )}
                      <button type="submit" className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px', marginLeft: 'auto' }}>
                        <Send size={14} /> Send
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Sidebar Metadata Pane */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Status & Lifecycle Actions */}
                <div className="glass-panel" style={{ padding: 16 }}>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>
                    Status & Actions
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Staff status actions */}
                    {isStaffRole && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                      <>
                        <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleStatusUpdate('IN_PROGRESS')}>
                          Mark In Progress
                        </button>
                        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#10b981' }} onClick={() => handleStatusUpdate('RESOLVED', 'Issue resolved by technician.')}>
                          <CheckCircle size={16} /> Mark Resolved
                        </button>
                      </>
                    )}

                    {/* Employee & Admin resolution verification actions */}
                    {ticket.status === 'RESOLVED' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(user?.role === 'EMPLOYEE' || user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN' || user?.role === 'IT_MANAGER') ? (
                          <>
                            <div style={{ fontSize: '0.78rem', color: '#6ee7b7', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                              ℹ Technician has marked this resolved. Please verify the fix.
                            </div>
                            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#10b981' }} onClick={() => handleStatusUpdate('CLOSED', 'Confirmed and closed by user.')}>
                              <CheckCircle size={16} /> Confirm & Close Ticket
                            </button>
                            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', color: '#f472b6', borderColor: '#ec4899' }} onClick={() => handleStatusUpdate('REOPENED', 'Issue re-occurred after resolution.')}>
                              Reopen Ticket
                            </button>
                          </>
                        ) : (
                          <div style={{ fontSize: '0.8rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            ⏳ <strong>Pending Requester Verification:</strong> Waiting for Employee to verify resolution and Confirm & Close.
                          </div>
                        )}
                      </div>
                    )}

                    {ticket.status === 'CLOSED' && (
                      <div style={{ textAlign: 'center', padding: 8, color: '#94a3b8', fontSize: '0.82rem', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                        ✅ Ticket Closed & Archived
                      </div>
                    )}
                  </div>
                </div>

                {/* SLA Timers */}
                <div className="glass-panel" style={{ padding: 16 }}>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={16} color="#3b82f6" /> SLA Timers
                  </h4>
                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <div style={{ color: 'var(--text-dim)' }}>Response Deadline:</div>
                      <div style={{ fontWeight: 700, color: ticket.slaResponseBreached ? '#ef4444' : '#6ee7b7' }}>
                        {ticket.responseDeadline ? new Date(ticket.responseDeadline).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-dim)' }}>Resolution Deadline:</div>
                      <div style={{ fontWeight: 700, color: ticket.slaResolutionBreached ? '#ef4444' : '#6ee7b7' }}>
                        {ticket.resolutionDeadline ? new Date(ticket.resolutionDeadline).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technician Assignment (Manager/Admin) */}
                {isManagerOrAdmin && (
                  <div className="glass-panel" style={{ padding: 16 }}>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                      Assigned Technician
                    </h4>
                    <select
                      className="form-select"
                      style={{ width: '100%' }}
                      value={selectedTech}
                      onChange={(e) => {
                        setSelectedTech(e.target.value);
                        handleAssignTechnician(e.target.value);
                      }}
                    >
                      <option value="">Unassigned</option>
                      {technicians.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name} ({t.department})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Requester Profile */}
                <div className="glass-panel" style={{ padding: 16 }}>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                    Requester
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 700 }}>
                    {ticket.requester?.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {ticket.requester?.email}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
                    Dept: {ticket.department}
                  </div>
                </div>

                {/* Linked Asset */}
                {ticket.asset && (
                  <div className="glass-panel" style={{ padding: 16 }}>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HardDrive size={16} color="#f59e0b" /> Affected Asset
                    </h4>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>
                      {ticket.asset.assetTag}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                      {ticket.asset.brand} {ticket.asset.model}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetailModal;
