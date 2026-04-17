const app = require('../app');
const connectDB = require('../config/db');
const { seedDefaultAdmin } = require('../utils/seedAdmin');

let bootstrapPromise = null;

const bootstrap = async () => {
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

module.exports = async function handler(req, res) {
  await bootstrap();
  return app(req, res);
};
