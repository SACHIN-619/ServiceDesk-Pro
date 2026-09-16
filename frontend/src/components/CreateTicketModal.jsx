import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { X, Sparkles, AlertCircle, CheckCircle, Bot } from 'lucide-react';

const CreateTicketModal = ({ isOpen, onClose, onTicketCreated }) => {
  const { showToast } = useNotification();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assetId, setAssetId] = useState('');
  const [assets, setAssets] = useState([]);
  
  const [aiInsight, setAiInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAssets();
    }
  }, [isOpen]);

  const loadAssets = async () => {
    try {
      const data = await fetchAPI('/assets');
      setAssets(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger live AI Classification preview when title or description changes
  useEffect(() => {
    if (title.length > 5 || description.length > 10) {
      const timer = setTimeout(() => {
        runAIClassification();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [title, description]);

  const runAIClassification = async () => {
    setAiLoading(true);
    try {
      const insight = await fetchAPI('/ai/classify', {
        method: 'POST',
        body: JSON.stringify({ title, description })
      });
      setAiInsight(insight);
      if (!category && insight.category) setCategory(insight.category);
      if (insight.priority) setPriority(insight.priority);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Please fill out ticket title and description', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const created = await fetchAPI('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: category || aiInsight?.category || 'General IT',
          priority: priority || aiInsight?.priority || 'Medium',
          assetId: assetId || null
        })
      });

      showToast(`Ticket #${created.ticketId} created successfully!`, 'success');
      onTicketCreated(created);
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority('Medium');
      setAssetId('');
      setAiInsight(null);
    } catch (err) {
      showToast(err.message || 'Failed to create ticket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Bot size={22} color="#3b82f6" /> Create New Support Ticket
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Ticket Title / Summary *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Laptop connected to Wi-Fi but cannot access VPN tunnel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description *</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Describe what happened, error codes, symptoms, and impact..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* AI Auto-Classification Insight Panel */}
          {(aiInsight || aiLoading) && (
            <div className="ai-glow-card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} /> AI Ticket Classifier Insight {aiLoading && '(Analyzing...)'}
                </span>
                {aiInsight && (
                  <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' }}>
                    {aiInsight.isAiGenerated ? 'Groq LLM' : 'Heuristic'} ({(aiInsight.confidence * 100).toFixed(0)}% confidence)
                  </span>
                )}
              </div>

              {aiInsight && (
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div><strong>Suggested Category:</strong> {aiInsight.category}</div>
                  <div><strong>Predicted Priority:</strong> <span className={`badge badge-${aiInsight.priority.toLowerCase()}`}>{aiInsight.priority}</span></div>
                  <div><strong>Probable Cause:</strong> {aiInsight.probableIssue}</div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Auto-Detect ({aiInsight?.category || 'General IT'})</option>
                <option value="Network & Connectivity">Network & Connectivity</option>
                <option value="Hardware & Devices">Hardware & Devices</option>
                <option value="Access & Identity">Access & Identity</option>
                <option value="Software & SaaS">Software & SaaS</option>
                <option value="Peripherals">Peripherals</option>
                <option value="General IT">General IT</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority (SLA Auto-Applied)</label>
              <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Low">🟢 Low (4h Resp / 24h Res)</option>
                <option value="Medium">🟡 Medium (2h Resp / 8h Res)</option>
                <option value="High">🟠 High (30m Resp / 4h Res)</option>
                <option value="Critical">🔴 Critical (15m Resp / 2h Res)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Affected Company Asset (Optional)</label>
            <select className="form-select" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
              <option value="">None / Not Asset Specific</option>
              {assets.map((ast) => (
                <option key={ast._id} value={ast._id}>
                  {ast.assetTag} - {ast.name} ({ast.brand} {ast.model})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating Ticket...' : 'Submit Support Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
