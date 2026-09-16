import Asset from '../models/Asset.js';
import Ticket from '../models/Ticket.js';
import AuditLog from '../models/AuditLog.js';

const generateAssetTag = async (type = 'Laptop') => {
  const prefixMap = {
    Laptop: 'LAP',
    Desktop: 'DSK',
    Server: 'SVR',
    Monitor: 'MON',
    Printer: 'PRN',
    Mobile: 'MOB',
    'Software License': 'LIC',
    Peripherals: 'PER'
  };
  const prefix = prefixMap[type] || 'AST';
  const count = await Asset.countDocuments({ type });
  return `${prefix}-${2000 + count + 1}`;
};

export const getAssets = async (req, res) => {
  try {
    const { status, type, department, search, assignedTo } = req.query;
    let query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (department) query.department = department;
    if (assignedTo) query.assignedTo = assignedTo;

    if (search) {
      query.$or = [
        { assetTag: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    const assets = await Asset.find(query)
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email department avatar');

    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('assignedTo', 'name email department phone avatar');

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const linkedTickets = await Ticket.find({ asset: asset._id })
      .sort({ createdAt: -1 })
      .populate('requester', 'name')
      .populate('assignedTechnician', 'name');

    res.json({
      asset,
      linkedTickets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAsset = async (req, res) => {
  try {
    const { name, type, brand, model, serialNumber, department, purchaseDate, warrantyExpiry, cost, specifications, assignedTo } = req.body;

    const assetTag = await generateAssetTag(type);

    const asset = await Asset.create({
      assetTag,
      name,
      type,
      brand,
      model,
      serialNumber,
      department: department || 'IT',
      purchaseDate: purchaseDate || new Date(),
      warrantyExpiry: warrantyExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3),
      cost: parseFloat(cost) || 0,
      specifications: specifications || '',
      assignedTo: assignedTo || null,
      status: assignedTo ? 'ASSIGNED' : 'IN_STOCK'
    });

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'ASSET_REGISTERED',
      target: `Asset ${asset.assetTag}`,
      details: `Registered ${asset.brand} ${asset.model} (${asset.type})`
    });

    const populated = await Asset.findById(asset._id).populate('assignedTo', 'name email department');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAsset = async (req, res) => {
  try {
    const { name, status, assignedTo, department, warrantyExpiry, specifications, cost } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const oldStatus = asset.status;
    if (name) asset.name = name;
    if (status) asset.status = status;
    if (department) asset.department = department;
    if (specifications !== undefined) asset.specifications = specifications;
    if (cost !== undefined) asset.cost = cost;
    if (warrantyExpiry) asset.warrantyExpiry = warrantyExpiry;
    if (assignedTo !== undefined) asset.assignedTo = assignedTo || null;

    await asset.save();

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'ASSET_UPDATED',
      target: `Asset ${asset.assetTag}`,
      details: `Updated asset lifecycle status from ${oldStatus} to ${asset.status}`
    });

    const updated = await Asset.findById(asset._id).populate('assignedTo', 'name email department');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logAssetMaintenance = async (req, res) => {
  try {
    const { description, cost, technician } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    asset.maintenanceHistory.push({
      date: new Date(),
      description,
      cost: parseFloat(cost) || 0,
      technician: technician || req.user.name
    });

    asset.status = 'UNDER_REPAIR';

    await asset.save();

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'ASSET_MAINTENANCE_LOGGED',
      target: `Asset ${asset.assetTag}`,
      details: `Logged maintenance: ${description}`
    });

    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
