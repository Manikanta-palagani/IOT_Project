const mongoose = require('mongoose');

let connectPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (connectPromise) {
    return connectPromise;
  }

  const primaryUri = process.env.MONGODB_URI;
  const fallbackUri = process.env.MONGODB_URI_FALLBACK || 'mongodb://127.0.0.1:27017/iot_db';

  if (!primaryUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  connectPromise = (async () => {
    try {
      await mongoose.connect(primaryUri);
      console.log('MongoDB connected');
      return true;
    } catch (error) {
      console.warn('MongoDB unavailable:', error.message);

      if (primaryUri !== fallbackUri) {
        try {
          await mongoose.connect(fallbackUri);
          console.log('MongoDB connected using fallback URI');
          return true;
        } catch (fallbackError) {
          console.warn('Fallback MongoDB unavailable:', fallbackError.message);
        }
      }

      console.warn('Starting server without a MongoDB connection. API routes that need the database will return 503 until MongoDB becomes available.');
      return false;
    }
  })();

  try {
    return await connectPromise;
  } finally {
    connectPromise = null;
  }
};

module.exports = connectDB;
