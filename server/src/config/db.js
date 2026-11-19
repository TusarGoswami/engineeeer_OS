import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env.js';
import { logger } from './logger.js';

// Resolve SRV records reliably on Windows/local networks that fail querySrv
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Retain system defaults if setServers is restricted
}

let isConnected = false;

export const connectDB = async (uri = env.MONGODB_URI) => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 50,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info(
      { host: conn.connection.host, name: conn.connection.name },
      '[MongoDB] Connected successfully'
    );

    mongoose.connection.on('error', err => {
      logger.error({ err }, '[MongoDB] Connection error');
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('[MongoDB] Connection disconnected');
    });

    return conn;
  } catch (error) {
    logger.error({ err: error }, '[MongoDB] Failed to connect');
    if (env.NODE_ENV !== 'test') {
      throw error;
    }
  }
};

export const checkDBHealth = () => {
  return mongoose.connection.readyState === 1;
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('[MongoDB] Disconnected successfully');
  }
};

export default { connectDB, checkDBHealth, disconnectDB };
