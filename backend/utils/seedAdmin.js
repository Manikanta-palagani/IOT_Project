const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedDefaultAdmin = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const adminEmail = (process.env.ADMIN_SEED_EMAIL || 'palaganimani5@gmail.com').toLowerCase();
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Mani@231fa04b36';

  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    const updates = {};

    if (existingAdmin.role !== 'admin') {
      updates.role = 'admin';
    }

    if (!existingAdmin.isActive) {
      updates.isActive = true;
    }

    if (!existingAdmin.broadcastEnabled) {
      updates.broadcastEnabled = true;
    }

    if (Object.keys(updates).length > 0) {
      await User.updateOne({ _id: existingAdmin._id }, { $set: updates });
    }

    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await User.create({
    email: adminEmail,
    password: hashedPassword,
    role: 'admin',
    isActive: true,
    broadcastEnabled: true,
  });
};

module.exports = {
  seedDefaultAdmin,
};