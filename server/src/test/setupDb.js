import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs';

let mongoServer;

const defaultSystemBinary = 'C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe';
const systemBinary =
  process.env.MONGOMS_SYSTEM_BINARY ||
  (fs.existsSync(defaultSystemBinary) ? defaultSystemBinary : undefined);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create(systemBinary ? { binary: { systemBinary } } : {});
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});
