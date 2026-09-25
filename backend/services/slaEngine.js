import mongoose from 'mongoose';
import SLAPolicy from '../models/SLAPolicy.js';
import Ticket from '../models/Ticket.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { createAndEmitNotification } from './socketService.js';

export const DEFAULT_SLA_HOURS = {
  Critical: { response: 0.25, resolution: 2 },
  High: { response: 0.5, resolution: 4 },
  Medium: { response: 2, resolution: 8 },
  Low: { response: 4, resolution: 24 }
};

export const calculateDeadlines = async (priority = 'Medium', createdAt = new Date()) => {
  const baseTime = new Date(createdAt).getTime();
  let responseHours = DEFAULT_SLA_HOURS[priority]?.response || 2;
  let resolutionHours = DEFAULT_SLA_HOURS[priority]?.resolution || 8;

  try {
    const policy = await SLAPolicy.findOne({ priority, active: true });
    if (policy) {
      responseHours = policy.responseSLAHours;
      resolutionHours = policy.resolutionSLAHours;
    }
  } catch (err) {
    console.error('Error fetching SLA policy, using default:', err.message);
  }

  const responseDeadline = new Date(baseTime + responseHours * 60 * 60 * 1000);
  const resolutionDeadline = new Date(baseTime + resolutionHours * 60 * 60 * 1000);

  return { responseDeadline, resolutionDeadline };
};

export const checkSLABreaches = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }
  const now = new Date();

  try {
    // 1. Check Response SLA Breaches (Unresponded open tickets past responseDeadline)
    const responseBreaches = await Ticket.find({
      status: { $in: ['OPEN'] },
      respondedAt: null,
      responseDeadline: { $lt: now },
      slaResponseBreached: false
    });

    for (const ticket of responseBreaches) {
      ticket.slaResponseBreached = true;
      await ticket.save();

      await AuditLog.create({
        actorName: 'SLA Monitoring Engine',
        actorRole: 'SYSTEM',
        action: 'SLA_RESPONSE_BREACHED',
        target: `Ticket #${ticket.ticketId}`,
        details: `Ticket #${ticket.ticketId} (${ticket.priority} priority) failed response SLA deadline.`
      });

      const managers = await User.find({ role: { $in: ['IT_MANAGER', 'ADMIN', 'SYSTEM_ADMIN'] } });
      for (const mgr of managers) {
        await createAndEmitNotification({
          recipient: mgr._id,
          title: `⚠ SLA Response Breach: #${ticket.ticketId}`,
          message: `Ticket "${ticket.title}" (${ticket.priority}) has breached its response SLA!`,
          link: `/tickets/${ticket._id}`,
          type: 'SLA_BREACH'
        });
      }
    }

    // 2. Check Resolution SLA Breaches (Unresolved tickets past resolutionDeadline)
    const resolutionBreaches = await Ticket.find({
      status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'REOPENED'] },
      resolvedAt: null,
      resolutionDeadline: { $lt: now },
      slaResolutionBreached: false
    });

    for (const ticket of resolutionBreaches) {
      ticket.slaResolutionBreached = true;
      await ticket.save();

      await AuditLog.create({
        actorName: 'SLA Monitoring Engine',
        actorRole: 'SYSTEM',
        action: 'SLA_RESOLUTION_BREACHED',
        target: `Ticket #${ticket.ticketId}`,
        details: `Ticket #${ticket.ticketId} (${ticket.priority} priority) failed resolution SLA deadline.`
      });

      const managers = await User.find({ role: { $in: ['IT_MANAGER', 'ADMIN', 'SYSTEM_ADMIN'] } });
      for (const mgr of managers) {
        await createAndEmitNotification({
          recipient: mgr._id,
          title: `🔥 SLA Resolution Breach: #${ticket.ticketId}`,
          message: `Critical SLA Breach! Ticket #${ticket.ticketId} remains unresolved past deadline.`,
          link: `/tickets/${ticket._id}`,
          type: 'SLA_BREACH'
        });
      }

      // Also notify assigned technician if any
      if (ticket.assignedTechnician) {
        await createAndEmitNotification({
          recipient: ticket.assignedTechnician,
          title: `🔥 SLA Resolution Breach: #${ticket.ticketId}`,
          message: `Ticket #${ticket.ticketId} assigned to you has breached its resolution SLA!`,
          link: `/tickets/${ticket._id}`,
          type: 'SLA_BREACH'
        });
      }
    }
  } catch (error) {
    console.error('Error running SLA breach monitor:', error.message);
  }
};
