import mongoose from 'mongoose';

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    console.log('[MongoDB] Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('[MongoDB] Connecting to database...');
    
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI!, opts)
      .then((mongoose) => {
        const dbName = mongoose.connection.db?.databaseName || '(unknown-db)';
        console.log('[MongoDB] Connected successfully to:', dbName);
        return mongoose;
      })
      .catch((error) => {
        console.error('[MongoDB] Connection error:', error);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
