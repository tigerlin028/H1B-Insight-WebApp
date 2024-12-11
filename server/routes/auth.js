const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const keys = require('../config/keys');
const auth = require('../middleware/auth');

// Test route to verify router mounting
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Auth route is working' });
});

// Register user
router.post('/register', async (req, res) => {
  console.log('Register route hit with body:', req.body);
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password
    });

    // Hash password before saving if it's not already being handled by the User model
    if (!user.password.startsWith('$2a$')) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    console.log('User saved successfully:', user.id);

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id },
      keys.jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  console.log('Login attempt with:', req.body);
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    console.log('User found:', user ? 'yes' : 'no');

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = user.comparePassword(password);
    console.log('Password match:', isMatch ? 'yes' : 'no');

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user.id },
      keys.jwtSecret,
      { expiresIn: '24h' }
    );

    // Send response
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  console.log('Get current user route hit');
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;