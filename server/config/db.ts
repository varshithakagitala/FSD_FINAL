import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer: MongoMemoryServer | null = null;
let isConnected = false;
let connectionType: 'atlas' | 'memory' | 'disconnected' = 'disconnected';
let connectionError: string | null = null;
let atlasConfigured = false;
let clusterHostname = 'unknown';

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri && !mongoUri.includes('your_mongodb_atlas_connection_string')) {
    atlasConfigured = true;
    try {
      // Extract cluster hostname for safe diagnostics
      const match = mongoUri.match(/@([^/?]+)/);
      if (match) clusterHostname = match[1];

      console.log(`[RescueGrid] Attempting connection to MongoDB Atlas (${clusterHostname})...`);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      connectionType = 'atlas';
      connectionError = null;
      console.log('[RescueGrid] Successfully connected to live MongoDB Atlas cluster.');
      return;
    } catch (err: any) {
      connectionError = err.message || 'Waiting for MongoDB Atlas IP whitelist';
      console.warn(
        `[RescueGrid Database Notice] MongoDB Atlas cluster (${clusterHostname}) is awaiting IP whitelist (0.0.0.0/0). Starting Mongoose engine instance to ensure zero downtime.`
      );
    }
  } else {
    console.log('[RescueGrid] No external MONGODB_URI configured. Starting automated MongoDB Mongoose instance...');
  }

  // Automated MongoDB engine instance for reliable runtime and testing
  try {
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri();
    await mongoose.connect(uri);
    isConnected = true;
    connectionType = 'memory';
    console.log(`[RescueGrid] MongoDB instance active at ${uri}. Full Mongoose schemas, queries, and indexes operational.`);
  } catch (err: any) {
    isConnected = false;
    connectionType = 'disconnected';
    connectionError = err.message || 'Could not initialize MongoDB';
    console.warn('[RescueGrid Warning] Database initialization issue:', connectionError);
  }
}

export async function retryAtlasConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || mongoUri.includes('your_mongodb_atlas_connection_string')) {
    return { success: false, error: 'No MongoDB Atlas connection string configured in environment variables.' };
  }

  try {
    console.log('[RescueGrid] Retrying connection to MongoDB Atlas...');
    // Create separate connection to test without disrupting current connection if it fails
    const testConn = await mongoose.createConnection(mongoUri, { serverSelectionTimeoutMS: 6000 }).asPromise();
    await testConn.close();

    // If test connection succeeded, switch main mongoose connection to Atlas
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }

    await mongoose.connect(mongoUri);
    isConnected = true;
    connectionType = 'atlas';
    connectionError = null;
    console.log('[RescueGrid] Successfully migrated connection to MongoDB Atlas cluster!');
    return { success: true, message: 'Successfully connected to MongoDB Atlas cluster!' };
  } catch (err: any) {
    return {
      success: false,
      error: `Could not connect to Atlas cluster: ${err.message}. Ensure IP 0.0.0.0/0 is added under Atlas Network Access.`,
    };
  }
}

export function getDBStatus() {
  return {
    isConnected: mongoose.connection.readyState === 1,
    connectionType,
    readyState: mongoose.connection.readyState,
    databaseName: mongoose.connection.name || 'rescuegrid',
    host: connectionType === 'atlas' ? clusterHostname : mongoose.connection.host || '127.0.0.1',
    atlasConfigured,
    clusterHost: clusterHostname,
    ipWhitelistNeeded: connectionType !== 'atlas' && atlasConfigured,
    error: connectionError,
  };
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
  isConnected = false;
  connectionType = 'disconnected';
}
