const jwt = require('jsonwebtoken');
const { resolveUserRole, isAdminRole } = require('../config/roles');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = resolveUserRole(decoded.email, decoded.role);
    req.user = {
      ...decoded,
      role,
      isAdmin: isAdminRole(role)
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
