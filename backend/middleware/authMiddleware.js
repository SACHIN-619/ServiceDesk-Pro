import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'servicedesk_super_secret_jwt_key_2026');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({ message: 'Account registration is pending administrator approval.' });
    }

    if (user.status === 'REJECTED' || user.active === false) {
      return res.status(403).json({ message: 'Account has been deactivated or rejected.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed verification' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Normalize ADMIN / SYSTEM_ADMIN roles
    const userRole = req.user.role;
    const allowedRoles = new Set(roles);
    if (allowedRoles.has('ADMIN') || allowedRoles.has('SYSTEM_ADMIN')) {
      allowedRoles.add('ADMIN');
      allowedRoles.add('SYSTEM_ADMIN');
    }

    if (!allowedRoles.has(userRole)) {
      return res.status(403).json({
        message: `User role '${userRole}' is not authorized to access this resource`
      });
    }

    next();
  };
};
