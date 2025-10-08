import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wifi-billing';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let clientPromise: Promise<typeof mongoose>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the connection
  // is not duplicated across module reloads (HMR).
  let globalWithMongoose = global as typeof globalThis & {
    _mongooseClientPromise?: Promise<typeof mongoose>;
  };

  if (!globalWithMongoose._mongooseClientPromise) {
    globalWithMongoose._mongooseClientPromise = mongoose.connect(MONGODB_URI);
  }
  clientPromise = globalWithMongoose._mongooseClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = mongoose.connect(MONGODB_URI);
}

export default clientPromise;