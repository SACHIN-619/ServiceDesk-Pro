import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res) => {
  try {
    const { action, search, limit } = req.query;
    let query = {};

    if (action) query.action = action;
    if (search) {
      query.$or = [
        { actorName: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { target: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10) || 100)
      .populate('actor', 'name role email');

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
