import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { X, HardDrive } from 'lucide-react';

const AssetModal = ({ isOpen, onClose, onAssetCreated }) => {
  const { showToast } = useNotification();

  const [name, setName] = useState('');
  const [type, setType] = useState('Laptop');
  const [brand, setBrand] = useState('Dell');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [cost, setCost] = useState(1200);
  const [specifications, setSpecifications] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const data = await fetchAPI('/users');
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !model || !serialNumber) {
      showToast('Please fill required fields (Name, Model, Serial Number)', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const asset = await fetchAPI('/assets', {
        method: 'POST',
        body: JSON.stringify({
          name,
          type,
          brand,
          model,
          serialNumber,
          cost,
          specifications,
          assignedTo: assignedTo || null
        })
      });

      showToast(`Asset ${asset.assetTag} registered successfully!`, 'success');
      onAssetCreated(asset);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to create asset', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <HardDrive size={22} color="#f59e0b" /> Register IT Asset
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Asset Title / Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Rahul Latitude Workstation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Asset Type *</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
                <option value="Server">Server</option>
                <option value="Monitor">Monitor</option>
                <option value="Printer">Printer</option>
                <option value="Mobile">Mobile Device</option>
                <option value="Software License">Software License</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Manufacturer / Brand</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Dell, Apple, HP, Cisco"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Model Name / Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Latitude 5440 or MacBook Pro 16"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unique Serial Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. DL-99887711"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assign to Employee</label>
            <select className="form-select" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">None (Keep in Stock)</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role} - {u.department})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Hardware Specifications</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Core i7, 32GB RAM, 1TB SSD"
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }} disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetModal;
