import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { createAndEmitNotification } from '../services/socketService.js';
import AuditLog from '../models/AuditLog.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'servicedesk_super_secret_jwt_key_2026', {
    expiresIn: '30d'
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({
        message: 'Your account registration is currently PENDING approval from a System Administrator.'
      });
    }

    if (user.status === 'REJECTED' || user.active === false) {
      return res.status(403).json({
        message: 'Your account has been deactivated or rejected by an Administrator.'
      });
    }

    // Log successful login audit
    await AuditLog.create({
      actor: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_LOGIN',
      target: `User ${user.email}`,
      details: `User logged in successfully with role ${user.role}`
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatar: user.avatar,
      phone: user.phone,
      status: user.status,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const registerUser = async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // If this is the very first user in the database, promote to active ADMIN automatically (no seeding required)
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;
    const userRole = isFirstUser ? 'ADMIN' : 'EMPLOYEE';
    const userStatus = isFirstUser ? 'ACTIVE' : 'PENDING';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: userRole,
      department: department || (isFirstUser ? 'Executive IT' : 'General'),
      status: userStatus,
      active: true
    });

    if (!isFirstUser) {
      // Notify all System Admins of the new registration request
      const adminUsers = await User.find({ role: { $in: ['ADMIN', 'SYSTEM_ADMIN'] } });
      for (const admin of adminUsers) {
        await createAndEmitNotification({
          recipient: admin._id,
          title: 'New Account Approval Request',
          message: `Employee "${user.name}" (${user.email}) has requested account access.`,
          link: '/admin?tab=pending',
          type: 'USER_REGISTRATION'
        });
      }
    }

    await AuditLog.create({
      actor: user._id,
      actorName: user.name,
      actorRole: userRole,
      action: isFirstUser ? 'INITIAL_ADMIN_REGISTERED' : 'USER_REGISTERED',
      target: `User ${user.email}`,
      details: isFirstUser
        ? `Initial platform Administrator account created for "${user.name}".`
        : `Public registration submitted for "${user.name}". Status: PENDING admin approval.`
    });

    res.status(201).json({
      message: isFirstUser
        ? 'Initial Administrator account created successfully! You can now log in with your credentials.'
        : 'Registration submitted successfully! Your account is PENDING approval from a System Administrator.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'No user found with that email address' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 mins

    await user.save();

    res.json({
      message: 'Password reset token generated successfully (in production, sent via email).',
      resetToken
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    res.json({ message: 'Password reset successfully! You may now log in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.json(req.user);
};
