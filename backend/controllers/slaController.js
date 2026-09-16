import SLAPolicy from '../models/SLAPolicy.js';
import AuditLog from '../models/AuditLog.js';
import { checkSLABreaches, DEFAULT_SLA_HOURS } from '../services/slaEngine.js';

export const getSLAPolicies = async (req, res) => {
  try {
    let policies = await SLAPolicy.find({}).sort({ priority: 1 });
    
    if (policies.length === 0) {
      const defaults = [
        { priority: 'Critical', responseSLAHours: 0.25, resolutionSLAHours: 2, description: 'Service Down / Outage', escalationTarget: 'IT Director' },
        { priority: 'High', responseSLAHours: 0.5, resolutionSLAHours: 4, description: 'Major Business Function Impact', escalationTarget: 'IT Manager' },
        { priority: 'Medium', responseSLAHours: 2, resolutionSLAHours: 8, description: 'Individual User Affected', escalationTarget: 'Lead Tech' },
        { priority: 'Low', responseSLAHours: 4, resolutionSLAHours: 24, description: 'General Question or Request', escalationTarget: 'Support Desk' }
      ];
      policies = await SLAPolicy.insertMany(defaults);
    }
    
    res.json(policies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSLAPolicy = async (req, res) => {
  try {
    const { responseSLAHours, resolutionSLAHours, description, escalationTarget, active } = req.body;
    const policy = await SLAPolicy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({ message: 'SLA Policy not found' });
    }

    policy.responseSLAHours = parseFloat(responseSLAHours) || policy.responseSLAHours;
    policy.resolutionSLAHours = parseFloat(resolutionSLAHours) || policy.resolutionSLAHours;
    if (description !== undefined) policy.description = description;
    if (escalationTarget !== undefined) policy.escalationTarget = escalationTarget;
    if (active !== undefined) policy.active = active;

    await policy.save();

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'SLA_POLICY_UPDATED',
      target: `SLA Policy: ${policy.priority}`,
      details: `Updated Response SLA to ${policy.responseSLAHours}h and Resolution SLA to ${policy.resolutionSLAHours}h`
    });

    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const triggerBreachCheck = async (req, res) => {
  try {
    await checkSLABreaches();
    res.json({ message: 'SLA Breach scan completed successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
