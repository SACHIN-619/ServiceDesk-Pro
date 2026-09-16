import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { HardDrive, Plus, Wrench, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import AssetModal from '../components/AssetModal';

const AssetManagerDashboard = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const data = await fetchAPI('/assets');
      setAssets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const inStock = assets.filter(a => a.status === 'IN_STOCK').length;
  const assigned = assets.filter(a => a.status === 'ASSIGNED').length;
  const underRepair = assets.filter(a => a.status === 'UNDER_REPAIR').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Banner */}
      <div className="glass-panel" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HardDrive size={32} color="#f59e0b" />
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
                🖥️ IT Asset Management & Hardware Inventory
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Track hardware & software assets across their lifecycle, record maintenance, and assign equipment.
              </p>
            </div>
          </div>
          <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }} onClick={() => setIsAssetModalOpen(true)}>
            <Plus size={18} /> Register New Asset
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="glass-panel stat-card">
          <span className="stat-title">Total IT Assets</span>
          <div className="stat-val" style={{ color: '#f59e0b' }}>{assets.length}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Units</span>
        </div>

        <div className="glass-panel stat-card">
          <span className="stat-title">Assigned to Staff</span>
          <div className="stat-val" style={{ color: '#3b82f6' }}>{assigned}</div>
          <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Active Deployment</span>
        </div>

        <div className="glass-panel stat-card">
          <span className="stat-title">In Stock Inventory</span>
          <div className="stat-val" style={{ color: '#10b981' }}>{inStock}</div>
          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Ready to Assign</span>
        </div>

        <div className="glass-panel stat-card">
          <span className="stat-title">Under Repair / Incident</span>
          <div className="stat-val" style={{ color: '#ef4444' }}>{underRepair}</div>
          <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Hardware Maintenance</span>
        </div>
      </div>

      {/* Assets Table */}
      <div className="glass-panel" style={{ padding: 20 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginBottom: 16 }}>
          📦 Enterprise IT Asset Catalog
        </h3>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Asset Name & Model</th>
                <th>Type</th>
                <th>Serial Number</th>
                <th>Assigned User</th>
                <th>Status</th>
                <th>Warranty Expiry</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                    Loading Asset Inventory...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                    No assets registered yet.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset._id}>
                    <td style={{ fontWeight: 800, color: '#f59e0b' }}>
                      {asset.assetTag}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{asset.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{asset.brand} {asset.model}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d' }}>
                        {asset.type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#cbd5e1' }}>
                      {asset.serialNumber}
                    </td>
                    <td>
                      <span style={{ color: asset.assignedTo ? '#e2e8f0' : 'var(--text-dim)' }}>
                        {asset.assignedTo?.name || 'Unassigned (In Stock)'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${asset.status === 'ASSIGNED' ? 'open' : asset.status === 'IN_STOCK' ? 'resolved' : 'critical'}`}>
                        {asset.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AssetModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onAssetCreated={(newAsset) => {
          setAssets([newAsset, ...assets]);
        }}
      />
    </div>
  );
};

export default AssetManagerDashboard;
