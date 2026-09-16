import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { createAndEmitNotification } from '../services/socketService.js';

export const getUsers = async (req, res) => {
  try {
    const { role, department, status, search } = req.query;
    let query = {};
    if (role) query.role = role;
    if (department) query.department = department;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'PENDING' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'TECHNICIAN', status: 'ACTIVE' }).select('-password');
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, phone, skills } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const allowedRoles = ['ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER', 'TECHNICIAN', 'EMPLOYEE', 'ASSET_MANAGER'];
    const userRole = role && allowedRoles.includes(role) ? (role === 'SYSTEM_ADMIN' ? 'ADMIN' : role) : 'EMPLOYEE';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password || 'password123',
      role: userRole,
      department: department || 'General',
      phone: phone || '',
      skills: skills ? (Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim())) : [],
      status: 'ACTIVE', // Admin created users are immediately ACTIVE
      active: true
    });

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'USER_PROVISIONED',
      target: `User ${user.email}`,
      details: `Provisioned user "${user.name}" with role ${user.role} in ${user.department}`
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'ACTIVE';
    if (req.body.role) {
      const allowedRoles = ['ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER', 'TECHNICIAN', 'EMPLOYEE', 'ASSET_MANAGER'];
      if (allowedRoles.includes(req.body.role)) {
        user.role = req.body.role === 'SYSTEM_ADMIN' ? 'ADMIN' : req.body.role;
      }
    }
    if (req.body.department) user.department = req.body.department;
    await user.save();

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'USER_APPROVED',
      target: `User ${user.email}`,
      details: `Approved registration request for "${user.name}" as ${user.role}`
    });

    await createAndEmitNotification({
      recipient: user._id,
      title: 'Account Approved!',
      message: `Your ServiceDesk Pro account has been approved. You now have full access as ${user.role}.`,
      link: '/dashboard',
      type: 'INFO'
    });

    res.json({ message: `User ${user.name} approved successfully`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'REJECTED';
    await user.save();

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'USER_REJECTED',
      target: `User ${user.email}`,
      details: `Rejected registration request for "${user.name}"`
    });

    res.json({ message: `User registration request rejected for ${user.name}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, avatar, currentPassword, newPassword } = req.body;

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;
    if (avatar) user.avatar = avatar;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password does not match' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }
      user.password = newPassword;
    }

    await user.save();

    await AuditLog.create({
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_PROFILE_UPDATED',
      target: `User ${user.email}`,
      details: `Updated personal profile details`
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, role, department, status, active, phone } = req.body;

    if (name) user.name = name.trim();
    if (role) {
      const allowedRoles = ['ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER', 'TECHNICIAN', 'EMPLOYEE', 'ASSET_MANAGER'];
      if (allowedRoles.includes(role)) {
        user.role = role === 'SYSTEM_ADMIN' ? 'ADMIN' : role;
      }
    }
    if (department) user.department = department;
    if (status) user.status = status;
    if (active !== undefined) user.active = active;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'USER_UPDATED',
      target: `User ${user.email}`,
      details: `Updated details for ${user.name} (Role: ${user.role}, Status: ${user.status})`
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Safety: Deactivate user rather than hard-deleting if they own tickets/assets
    await User.findByIdAndUpdate(req.params.id, { active: false, status: 'REJECTED' });

    await AuditLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'USER_DEACTIVATED',
      target: `User ${user.email}`,
      details: `Deactivated user account "${user.name}" (${user.email})`
    });

    res.json({ message: 'User account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
