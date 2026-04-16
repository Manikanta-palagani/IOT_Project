const mongoose = require('mongoose');
const app = require('../backend/app');
const connectDB = require('../backend/config/db');
const { seedDefaultAdmin } = require('../backend/utils/seedAdmin');

let bootstrapPromise = null;

const bootstrap = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const connected = await connectDB();

      if (connected) {
        await seedDefaultAdmin();
      }
    })().finally(() => {
      bootstrapPromise = null;
    });
  }

  return bootstrapPromise;
};

module.exports = async (req, res) => {
  await bootstrap();
  return app(req, res);
};