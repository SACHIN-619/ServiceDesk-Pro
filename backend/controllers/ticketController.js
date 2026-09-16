import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { calculateDeadlines } from '../services/slaEngine.js';
import { classifyTicket } from '../services/aiService.js';
import { createAndEmitNotification } from '../services/socketService.js';

const generateTicketId = async () => {
  const count = await Ticket.countDocuments();
  return `SD-${1000 + count + 1}`;
};

export const createTicket = async (req, res) => {
  try {
    const { title, description, category, priority, assetId, department } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const ticketId = await generateTicketId();

    // AI Ticket Auto-Classification (Groq LLM with heuristic fallback)
    const aiInsight = await classifyTicket(title, description);

    const finalCategory = category || aiInsight.category || 'General IT';
    const finalPriority = priority || aiInsight.priority || 'Medium';

    const { responseDeadline, resolutionDeadline } = await calculateDeadlines(finalPriority, new Date());

    const ticket = await Ticket.create({
      ticketId,
      title: title.trim(),
      description: description.trim(),
      requester: req.user._id,
      department: department || req.user.department || 'General',
      category: finalCategory,
      priority: finalPriority,
      status: 'OPEN',
      asset: assetId || null,
      responseDeadline,
      resolutionDeadline,
      aiClassification: aiInsight
    });

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'TICKET_CREATED',
      target: `Ticket #${ticket.ticketId}`,
      details: `Created ticket "${ticket.title}" (${ticket.priority} priority, Category: ${ticket.category})`
    });

    // Notify IT Managers and Admins of new open ticket
    const managers = await User.find({ role: { $in: ['IT_MANAGER', 'ADMIN', 'SYSTEM_ADMIN'] } });
    for (const manager of managers) {
      await createAndEmitNotification({
        recipient: manager._id,
        title: `New Ticket #${ticket.ticketId}`,
        message: `New ${ticket.priority} priority ticket submitted by ${req.user.name}: "${ticket.title}"`,
        link: `/tickets/${ticket._id}`,
        type: 'INFO'
      });
    }

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('requester', 'name email avatar department')
      .populate('asset', 'assetTag name brand model type');

    res.status(201).json(populatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTickets = async (req, res) => {
  try {
    const { status, priority, category, search, myAssigned, page, limit } = req.query;
    let query = {};

    // Role-based scoping
    if (req.user.role === 'EMPLOYEE') {
      query.requester = req.user._id;
    } else if (req.user.role === 'TECHNICIAN' && myAssigned === 'true') {
      query.assignedTechnician = req.user._id;
    }

    if (status) {
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else if (status === 'BREACHED') {
        query.$or = [{ slaResponseBreached: true }, { slaResolutionBreached: true }];
      } else {
        query.status = status;
      }
    }

    if (priority && priority !== 'ALL') query.priority = priority;
    if (category && category !== 'ALL') query.category = category;

    if (search) {
      query.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 100;
    const skip = (pageNum - 1) * limitNum;

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('requester', 'name email avatar department')
      .populate('assignedTechnician', 'name email avatar')
      .populate('asset', 'assetTag name type brand model');

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('requester', 'name email avatar department phone')
      .populate('assignedTechnician', 'name email avatar department phone skills')
      .populate('asset', 'assetTag name brand model type serialNumber status warrantyExpiry')
      .populate('comments.author', 'name avatar role')
      .populate('workLogs.technician', 'name avatar');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // RBAC: Employee can only view their own tickets
    if (req.user.role === 'EMPLOYEE' && ticket.requester._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Role-based status transition checks
    if (req.user.role === 'EMPLOYEE') {
      if (ticket.requester.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to modify this ticket' });
      }
      if (!['CLOSED', 'REOPENED'].includes(status)) {
        return res.status(403).json({
          message: 'Employees can only confirm closure or reopen resolved tickets'
        });
      }
      if (ticket.status !== 'RESOLVED' && status === 'REOPENED') {
        return res.status(400).json({ message: 'Only resolved tickets can be reopened' });
      }
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    const now = new Date();

    if (!ticket.respondedAt && ['ASSIGNED', 'IN_PROGRESS'].includes(status)) {
      ticket.respondedAt = now;
    }

    if (status === 'RESOLVED') {
      ticket.resolvedAt = now;
      if (note) ticket.resolutionNotes = note;
    } else if (status === 'CLOSED') {
      ticket.closedAt = now;
    } else if (status === 'REOPENED') {
      ticket.reopenReason = note || 'Issue re-occurred after resolution.';
      ticket.status = 'REOPENED';
    }

    await ticket.save();

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'STATUS_UPDATED',
      target: `Ticket #${ticket.ticketId}`,
      details: `Status changed from ${oldStatus} to ${status}. ${note ? `Note: ${note}` : ''}`
    });

    // Notify ticket requester of status change
    await createAndEmitNotification({
      recipient: ticket.requester,
      title: `Ticket #${ticket.ticketId} ${status}`,
      message: `Your ticket status has been updated to "${status}". ${note ? `Note: ${note}` : ''}`,
      link: `/tickets/${ticket._id}`,
      type: status === 'RESOLVED' ? 'INFO' : 'STATUS_CHANGE'
    });

    // If ticket reopened, notify assigned technician & IT Managers
    if (status === 'REOPENED' && ticket.assignedTechnician) {
      await createAndEmitNotification({
        recipient: ticket.assignedTechnician,
        title: `Ticket #${ticket.ticketId} REOPENED`,
        message: `Requester reopened ticket: "${note || 'Issue re-occurred'}"`,
        link: `/tickets/${ticket._id}`,
        type: 'WARNING'
      });
    }

    const updated = await Ticket.findById(ticket._id)
      .populate('requester', 'name email avatar')
      .populate('assignedTechnician', 'name email avatar')
      .populate('asset', 'assetTag name brand model type');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignTicket = async (req, res) => {
  try {
    const { technicianId } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const tech = await User.findById(technicianId);
    if (!tech) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    ticket.assignedTechnician = tech._id;
    if (ticket.status === 'OPEN') {
      ticket.status = 'ASSIGNED';
    }

    if (!ticket.respondedAt) {
      ticket.respondedAt = new Date();
    }

    await ticket.save();

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'TECHNICIAN_ASSIGNED',
      target: `Ticket #${ticket.ticketId}`,
      details: `Assigned to technician ${tech.name}`
    });

    // Real-Time Notification to Technician
    await createAndEmitNotification({
      recipient: tech._id,
      title: `New Ticket Assigned: #${ticket.ticketId}`,
      message: `You have been assigned to handle ticket "${ticket.title}" (${ticket.priority} priority).`,
      link: `/tickets/${ticket._id}`,
      type: 'ASSIGNMENT'
    });

    const updated = await Ticket.findById(ticket._id)
      .populate('requester', 'name email avatar')
      .populate('assignedTechnician', 'name email avatar')
      .populate('asset', 'assetTag name brand model type');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { text, isInternal } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Employees cannot post internal notes
    const internalFlag = req.user.role === 'EMPLOYEE' ? false : !!isInternal;

    ticket.comments.push({
      author: req.user._id,
      text: text.trim(),
      isInternal: internalFlag
    });

    await ticket.save();

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'COMMENT_ADDED',
      target: `Ticket #${ticket.ticketId}`,
      details: `Added ${internalFlag ? 'internal note' : 'public comment'}`
    });

    // Notify relevant user
    const recipient = req.user._id.toString() === ticket.requester.toString()
      ? ticket.assignedTechnician
      : ticket.requester;

    if (recipient && (!internalFlag || req.user.role !== 'EMPLOYEE')) {
      await createAndEmitNotification({
        recipient,
        title: `New Comment on Ticket #${ticket.ticketId}`,
        message: `${req.user.name}: "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`,
        link: `/tickets/${ticket._id}`,
        type: 'COMMENT'
      });
    }

    const updated = await Ticket.findById(ticket._id)
      .populate('comments.author', 'name avatar role');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addWorkLog = async (req, res) => {
  try {
    const { timeSpentMinutes, notes } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const minutes = parseInt(timeSpentMinutes, 10);
    if (isNaN(minutes) || minutes <= 0) {
      return res.status(400).json({ message: 'Valid timeSpentMinutes greater than 0 is required' });
    }

    ticket.workLogs.push({
      technician: req.user._id,
      timeSpentMinutes: minutes,
      notes: notes || 'Technical troubleshooting work performed'
    });

    await ticket.save();

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'WORKLOG_ADDED',
      target: `Ticket #${ticket.ticketId}`,
      details: `Logged ${minutes} mins of work: ${notes || 'Troubleshooting'}`
    });

    const updated = await Ticket.findById(ticket._id)
      .populate('workLogs.technician', 'name avatar');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
