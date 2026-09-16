import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import Asset from '../models/Asset.js';

export const getDashboardAnalytics = async (req, res) => {
  try {
    const role = req.user.role;
    const now = new Date();

    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'REOPENED'] } });
    const resolvedTickets = await Ticket.countDocuments({ status: { $in: ['RESOLVED', 'CLOSED'] } });
    const slaBreaches = await Ticket.countDocuments({ $or: [{ slaResponseBreached: true }, { slaResolutionBreached: true }] });

    const categoryStats = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const priorityStats = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const technicians = await User.find({ role: 'TECHNICIAN' }).select('name avatar department');
    const techWorkload = await Promise.all(
      technicians.map(async (tech) => {
        const assignedCount = await Ticket.countDocuments({ assignedTechnician: tech._id, status: { $nin: ['CLOSED', 'RESOLVED'] } });
        const resolvedCount = await Ticket.countDocuments({ assignedTechnician: tech._id, status: { $in: ['RESOLVED', 'CLOSED'] } });
        return {
          _id: tech._id,
          name: tech.name,
          avatar: tech.avatar,
          department: tech.department,
          assignedCount,
          resolvedCount
        };
      })
    );

    const assetSummary = {
      total: await Asset.countDocuments(),
      inStock: await Asset.countDocuments({ status: 'IN_STOCK' }),
      assigned: await Asset.countDocuments({ status: 'ASSIGNED' }),
      underRepair: await Asset.countDocuments({ status: 'UNDER_REPAIR' })
    };

    const unassignedTickets = await Ticket.countDocuments({ status: 'OPEN', assignedTechnician: null });
    const slaAtRisk = await Ticket.countDocuments({
      status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
      slaResolutionBreached: false,
      resolutionDeadline: { $gt: now, $lt: new Date(now.getTime() + 2 * 60 * 60 * 1000) }
    });

    // Dynamic Monthly Trends Generation from Database
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthLabel = monthNames[startOfMonth.getMonth()];

      const monthTickets = await Ticket.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      const monthResolved = await Ticket.countDocuments({
        resolvedAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      const monthBreaches = await Ticket.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        $or: [{ slaResponseBreached: true }, { slaResolutionBreached: true }]
      });

      const compliance = monthTickets > 0 ? Math.max(70, Math.round(((monthTickets - monthBreaches) / monthTickets) * 100)) : 100;

      monthlyTrends.push({
        month: monthLabel,
        tickets: monthTickets,
        resolved: monthResolved,
        slaCompliance: compliance
      });
    }

    res.json({
      role,
      summary: {
        totalTickets,
        openTickets,
        resolvedTickets,
        slaBreaches,
        unassignedTickets,
        slaAtRisk
      },
      categoryStats: categoryStats.map(c => ({ name: c._id || 'General IT', value: c.count })),
      priorityStats: priorityStats.map(p => ({ name: p._id, count: p.count })),
      techWorkload,
      assetSummary,
      monthlyTrends
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
