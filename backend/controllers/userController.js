const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  broadcastEnabled: user.broadcastEnabled,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      count: users.length,
      users: users.map((user) => ({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        broadcastEnabled: user.broadcastEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const addUser = async (req, res, next) => {
  try {
    const { email, password, role = 'user' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'A user with that email already exists' });
    }

    const temporaryPassword = password || crypto.randomBytes(5).toString('hex');
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      role,
      isActive: true,
      broadcastEnabled: true,
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: sanitizeUser(user),
      temporaryPassword: password ? null : temporaryPassword,
    });
  } catch (error) {
    next(error);
  }
};

const disableUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(userId, { $set: { isActive: false } }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'User disabled successfully', user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const toggleBroadcast = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { broadcastEnabled } = req.body;

    if (typeof broadcastEnabled !== 'boolean') {
      return res.status(400).json({ message: 'broadcastEnabled must be a boolean' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { broadcastEnabled } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Broadcast preference updated',
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addUser,
  deleteUser,
  disableUser,
  getUsers,
  toggleBroadcast,
};