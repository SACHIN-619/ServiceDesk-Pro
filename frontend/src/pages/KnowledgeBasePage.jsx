import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { BookOpen, Search, ThumbsUp, Eye, Sparkles, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const KnowledgeBasePage = () => {
  const { currentRole } = useAuth();
  const { showToast } = useNotification();

  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // New Article Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Network & Connectivity');
  const [problem, setProblem] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [solution, setSolution] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    loadArticles();
  }, [search]);

  const loadArticles = async () => {
    try {
      const data = await fetchAPI(`/kb?search=${encodeURIComponent(search)}`);
      setArticles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteHelpful = async (id) => {
    try {
      const updated = await fetchAPI(`/kb/${id}/vote`, { method: 'POST' });
      setArticles(articles.map(a => a._id === id ? updated : a));
      if (selectedArticle?._id === id) setSelectedArticle(updated);
      showToast('Thank you for your feedback!', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    try {
      const created = await fetchAPI('/kb', {
        method: 'POST',
        body: JSON.stringify({ title, category, problem, symptoms, solution, tags })
      });
      showToast('Knowledge article published!', 'success');
      setArticles([created, ...articles]);
      setIsModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Banner */}
      <div className="glass-panel" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BookOpen size={32} color="#8b5cf6" />
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
                🧠 Knowledge Base & RAG Solution Repository
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Self-service solution guides powering ServiceDesk Pro AI ticket resolution recommendations.
              </p>
            </div>
          </div>
          {['ADMIN', 'IT_MANAGER', 'TECHNICIAN'].includes(currentRole) && (
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> Add KB Solution Article
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', maxWidth: 600 }}>
        <Search size={20} color="var(--text-dim)" style={{ position: 'absolute', left: 16, top: 14 }} />
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: 48, fontSize: '1rem', width: '100%' }}
          placeholder="Search solutions, symptoms, VPN, Wi-Fi, hardware error codes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Articles Grid & Reader */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedArticle ? '1fr 1fr' : '1fr', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading Knowledge Base...</div>
          ) : articles.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No articles found.</div>
          ) : (
            articles.map((art) => (
              <div
                key={art._id}
                className="glass-panel"
                style={{
                  padding: 16,
                  cursor: 'pointer',
                  borderColor: selectedArticle?._id === art._id ? '#8b5cf6' : 'var(--glass-border)',
                  background: selectedArticle?._id === art._id ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-card)'
                }}
                onClick={() => setSelectedArticle(art)}
              >
                <span className="badge badge-low" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', marginBottom: 8 }}>
                  {art.category}
                </span>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: 6, lineHeight: 1.4 }}>
                  {art.title}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  {art.problem.substring(0, 100)}...
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ThumbsUp size={12} /> {art.helpfulVotes} Helpful
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} /> {art.views} Views
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Article Viewer Pane */}
        {selectedArticle && (
          <div className="glass-panel" style={{ padding: 24, sticky: true, top: 100 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span className="badge badge-low" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', marginBottom: 6 }}>
                  {selectedArticle.category}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                  {selectedArticle.title}
                </h3>
              </div>
              <button onClick={() => setSelectedArticle(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: '0.88rem' }}>
              <div>
                <h5 style={{ color: '#c084fc', marginBottom: 4 }}>Problem Statement</h5>
                <p style={{ color: '#cbd5e1' }}>{selectedArticle.problem}</p>
              </div>

              {selectedArticle.symptoms && (
                <div>
                  <h5 style={{ color: '#fde047', marginBottom: 4 }}>Symptoms</h5>
                  <p style={{ color: '#cbd5e1' }}>{selectedArticle.symptoms}</p>
                </div>
              )}

              <div>
                <h5 style={{ color: '#6ee7b7', marginBottom: 4 }}>Solution Steps</h5>
                <p style={{ color: '#f8fafc', whiteSpace: 'pre-wrap', lineHeight: 1.6, background: 'rgba(15, 23, 42, 0.7)', padding: 14, borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                  {selectedArticle.solution}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
                <button className="btn-secondary" onClick={() => handleVoteHelpful(selectedArticle._id)}>
                  <ThumbsUp size={16} /> Mark Solution as Helpful ({selectedArticle.helpfulVotes})
                </button>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Author: {selectedArticle.author?.name || 'IT Specialist'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Article Creation Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 16 }}>Create Knowledge Article</h3>
            <form onSubmit={handleCreateArticle}>
              <div className="form-group">
                <label className="form-label">Article Title</label>
                <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Problem</label>
                <textarea className="form-textarea" rows={2} value={problem} onChange={(e) => setProblem(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Step-by-Step Solution</label>
                <textarea className="form-textarea" rows={4} value={solution} onChange={(e) => setSolution(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBasePage;
