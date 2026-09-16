import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Ticket,
  Clock,
  HardDrive,
  BookOpen,
  BarChart3,
  FileText,
  Users,
  Bot
} from 'lucide-react';

const Sidebar = () => {
  const { currentRole } = useAuth();

  const allRoles = ['ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER', 'TECHNICIAN', 'EMPLOYEE', 'ASSET_MANAGER'];
  const adminRoles = ['ADMIN', 'SYSTEM_ADMIN'];
  const managerAndAdminRoles = ['ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER'];
  const assetRoles = ['ADMIN', 'SYSTEM_ADMIN', 'ASSET_MANAGER', 'IT_MANAGER', 'TECHNICIAN'];

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: allRoles },
    { path: '/tickets', label: 'Tickets Command', icon: Ticket, roles: allRoles },
    { path: '/sla', label: 'SLA Engine', icon: Clock, roles: managerAndAdminRoles },
    { path: '/assets', label: 'Asset Management', icon: HardDrive, roles: assetRoles },
    { path: '/knowledge', label: 'Knowledge Base (RAG)', icon: BookOpen, roles: allRoles },
    { path: '/analytics', label: 'Analytics & Reports', icon: BarChart3, roles: managerAndAdminRoles },
    { path: '/audit', label: 'Audit Trail', icon: FileText, roles: managerAndAdminRoles },
    { path: '/users', label: 'Users & Roles', icon: Users, roles: adminRoles },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(currentRole));

  return (
    <aside className="glass-panel" style={{ width: 240, padding: 16, height: 'calc(100vh - 120px)', sticky: true, top: 100 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 12px' }}>
          Navigation ({currentRole})
        </span>

        {filteredNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `btn-secondary`}
              style={({ isActive }) => ({
                justifyContent: 'flex-start',
                background: isActive ? 'var(--accent-primary-gradient)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                borderColor: isActive ? 'transparent' : 'transparent',
                padding: '10px 14px',
                fontSize: '0.85rem'
              })}
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </div>

      {/* AI Assistant Callout Box */}
      <div style={{
        marginTop: 24,
        padding: 14,
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        borderRadius: 12,
        fontSize: '0.78rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#c084fc', marginBottom: 6 }}>
          <Bot size={16} /> AI Engine Active
        </div>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
          Groq LLM ticket triage & grounded RAG Knowledge Base suggestions enabled.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
