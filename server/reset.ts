import mongoose from 'mongoose';
import logger from '#loggers';

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('MONGODB_URI is not set');
}

await mongoose.connect(mongoUri);
await mongoose.connection.dropDatabase();
await mongoose.disconnect();

logger.info('Database reset');
