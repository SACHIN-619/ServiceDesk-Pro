import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import {
  Shield,
  Sparkles,
  Bot,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Cpu,
  Database,
  Radio,
  FileCheck,
  RotateCcw,
  Users,
  HardDrive,
  BookOpen,
  Activity
} from 'lucide-react';

const HomePage = () => {
  const { currentRole, user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    slaCompliance: 98,
    totalAssets: 0,
    kbArticles: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverviewStats = async () => {
      try {
        const [tickets, assets, articles] = await Promise.all([
          fetchAPI('/tickets').catch(() => []),
          fetchAPI('/assets').catch(() => []),
          fetchAPI('/kb').catch(() => [])
        ]);

        const open = tickets.filter(t => ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(t.status)).length;
        const resolved = tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length;
        const breached = tickets.filter(t => t.slaResponseBreached || t.slaResolutionBreached).length;
        const compliance = tickets.length > 0 ? Math.round(((tickets.length - breached) / tickets.length) * 100) : 100;

        setStats({
          totalTickets: tickets.length,
          openTickets: open,
          resolvedTickets: resolved,
          slaCompliance: compliance,
          totalAssets: assets.length,
          kbArticles: articles.length
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOverviewStats();
  }, []);

  const workflowSteps = [
    {
      step: '01',
      title: 'Ticket Submission',
      role: 'Employee / Requester',
      icon: Users,
      color: '#10b981',
      desc: 'Employee submits incident with title, description, and optional hardware asset tag.'
    },
    {
      step: '02',
      title: 'AI Triage & Classification',
      role: 'Groq LLM (LLaMA 3.3)',
      icon: Bot,
      color: '#c084fc',
      desc: 'Groq AI auto-classifies category, priority level, probable root cause, and confidence.'
    },
    {
      step: '03',
      title: 'Dynamic SLA Calculation',
      role: 'MongoDB SLA Engine',
      icon: Clock,
      color: '#38bdf8',
      desc: 'Calculates response & resolution deadlines based on configurable MongoDB SLA policies.'
    },
    {
      step: '04',
      title: 'Manager Dispatch',
      role: 'IT Manager',
      icon: Layers,
      color: '#3b82f6',
      desc: 'IT Manager reviews queue, balances workload, and assigns ticket via real-time Socket.IO.'
    },
    {
      step: '05',
      title: 'Grounded RAG Troubleshooting',
      role: 'Technician',
      icon: BookOpen,
      color: '#f59e0b',
      desc: 'Technician views grounded KB solutions, logs technical work notes, and marks RESOLVED.'
    },
    {
      step: '06',
      title: 'Resolution Verification',
      role: 'Employee / Admin',
      icon: CheckCircle2,
      color: '#10b981',
      desc: 'Employee verifies fix $\\rightarrow$ clicks "Confirm & Close" or "Reopen Ticket" if issue persists.'
    },
    {
      step: '07',
      title: 'Asset & Audit Trace',
      role: 'System / Asset Manager',
      icon: Database,
      color: '#ec4899',
      desc: 'Hardware status updates, maintenance history is linked, and immutable audit logs record actions.'
    }
  ];

  const roleCards = [
    {
      role: 'System Administrator',
      key: 'ADMIN',
      icon: '👑',
      color: '#8b5cf6',
      responsibilities: [
        'User approvals (PENDING $\\rightarrow$ ACTIVE)',
        'SLA policy deadline configuration',
        'System audit trail inspection',
        'Global analytics & system health'
      ],
      route: '/users'
    },
    {
      role: 'IT Manager',
      key: 'IT_MANAGER',
      icon: '👨‍💼',
      color: '#3b82f6',
      responsibilities: [
        'Ticket command & dispatch queue',
        'Technician workload balancing',
        'SLA breach risk monitoring',
        'Operational reporting'
      ],
      route: '/tickets'
    },
    {
      role: 'Technician',
      key: 'TECHNICIAN',
      icon: '🧑‍💻',
      color: '#06b6d4',
      responsibilities: [
        'Assigned ticket troubleshooting',
        'Grounded RAG Knowledge Base consultation',
        'Technical work log recording',
        'Marking incidents RESOLVED'
      ],
      route: '/tickets'
    },
    {
      role: 'Employee (Requester)',
      key: 'EMPLOYEE',
      icon: '👤',
      color: '#10b981',
      responsibilities: [
        'Self-service incident creation',
        'Ticket tracking & real-time updates',
        'Knowledge Base self-help',
        'Verification: Confirm & Close or Reopen'
      ],
      route: '/tickets'
    },
    {
      role: 'Asset Manager',
      key: 'ASSET_MANAGER',
      icon: '🖥️',
      color: '#f59e0b',
      responsibilities: [
        'Hardware & software inventory',
        'Employee device assignment',
        'Maintenance & repair tracking',
        'Linked incident history analysis'
      ],
      route: '/assets'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 40 }}>
      {/* Hero Banner */}
      <div className="glass-panel" style={{
        padding: '36px 32px',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: 800 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59, 130, 246, 0.15)', padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: 16 }}>
            <Sparkles size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#93c5fd' }}>
              Full-Stack ITSM & Asset Management Architecture
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 12px 0', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            ServiceDesk <span style={{ color: '#38bdf8' }}>PRO</span> Workflow
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
            An enterprise-grade IT Service Management platform featuring Groq LLM ticket auto-triage, grounded Knowledge Base RAG recommendations, dynamic SLA breach calculation, and full IT asset lifecycle tracking.
          </p>
        </div>

        {/* Live Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginTop: 28 }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Incidents</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
              {stats.totalTickets}
            </div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Queue</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
              {stats.openTickets}
            </div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Resolved</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
              {stats.resolvedTickets}
            </div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>SLA Compliance</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stats.slaCompliance >= 90 ? '#34d399' : '#f87171', marginTop: 4 }}>
              {stats.slaCompliance}%
            </div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Managed Assets</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#c084fc', marginTop: 4 }}>
              {stats.totalAssets}
            </div>
          </div>
        </div>
      </div>

      {/* Real Flow Pipeline (The 7-Step Lifecycle) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              🔄 Real End-to-End Service Desk Flow
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              How tickets, AI triage, SLA policies, and human roles interact dynamically in real time
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {workflowSteps.map((ws, i) => {
            const Icon = ws.icon;
            return (
              <div
                key={ws.step}
                className="glass-panel"
                style={{
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `3px solid ${ws.color}`,
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: ws.color, opacity: 0.8 }}>
                      {ws.step}
                    </span>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${ws.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={20} color={ws.color} />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 4px 0' }}>
                    {ws.title}
                  </h3>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ws.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {ws.role}
                  </span>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, marginTop: 10 }}>
                    {ws.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Responsibility Matrix */}
      <div>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            👥 Role Responsibility & Security Matrix
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Enforced at the backend API level via JWT Role-Based Access Control (RBAC)
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {roleCards.map((rc) => (
            <div
              key={rc.key}
              className="glass-panel"
              style={{
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid var(--glass-border)',
                borderRadius: 14
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: '1.6rem' }}>{rc.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                      {rc.role}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: rc.color, fontWeight: 700 }}>
                      ROLE: {rc.key}
                    </span>
                  </div>
                </div>

                <ul style={{ paddingLeft: 18, margin: '0 0 16px 0', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  {rc.responsibilities.map((resp, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate(rc.route)}
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem', padding: '8px 12px' }}
              >
                Access {rc.role} View <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack & Architecture Highlights */}
      <div className="glass-panel" style={{ padding: 24, borderRadius: 16 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Cpu size={20} color="#38bdf8" /> Technology & Infrastructure Stack
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, fontSize: '0.85rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: 14, borderRadius: 10 }}>
            <strong style={{ color: '#38bdf8' }}>Backend Core</strong>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.8rem' }}>
              Node.js, Express.js, MongoDB Mongoose, JWT & Bcrypt password security.
            </p>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: 14, borderRadius: 10 }}>
            <strong style={{ color: '#c084fc' }}>AI & Grounded RAG</strong>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.8rem' }}>
              Groq LLaMA 3.3 70B LLM integration, MongoDB text indexed search with strict grounding.
            </p>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: 14, borderRadius: 10 }}>
            <strong style={{ color: '#10b981' }}>Real-Time & SLA Engine</strong>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.8rem' }}>
              Socket.IO bi-directional event bus + node-cron SLA breach detection & persistent notifications.
            </p>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: 14, borderRadius: 10 }}>
            <strong style={{ color: '#f59e0b' }}>Frontend UI</strong>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.8rem' }}>
              React 18, Vite, Lucide Icons, Recharts dynamic ITSM analytics, Glassmorphism design system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
