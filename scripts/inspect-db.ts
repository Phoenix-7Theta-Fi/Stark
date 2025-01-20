import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function inspectDb() {
  try {
    console.log('Connecting to MongoDB...');
    const client = await MongoClient.connect(process.env.MONGODB_URI!);

    // List all databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();

    for (const dbInfo of databases.databases) {
      const dbName = dbInfo.name;
      if (dbName === 'admin' || dbName === 'local' || dbName === 'config') {
        continue; // Skip system databases
      }

      console.log(`\n--- Database: ${dbName} ---`);
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();

      for (const collectionInfo of collections) {
        const collectionName = collectionInfo.name;
        console.log(`\n  --- Collection: ${collectionName} ---`);
        const documents = await db.collection(collectionName).find().toArray();
        console.log(JSON.stringify(documents, null, 2));
      }
    }

    await client.close();
    console.log('Connection to MongoDB closed.');
  } catch (error) {
    console.error("Error inspecting database:", error);
  }
}

inspectDb();