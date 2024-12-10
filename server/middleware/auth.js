const jwt = require('jsonwebtoken');
const keys = require('../config/keys');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, keys.jwtSecret);
      
      // Add user from payload
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = auth;