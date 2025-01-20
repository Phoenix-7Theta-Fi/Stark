#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function migrateDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    console.log('Connected to MongoDB...');

    // Source databases
    const authDb = client.db('auth');
    const tangerineDb = client.db('tangerine');
    const testDb = client.db('test');
    
    // Target database
    const twebDb = client.db('tweb');

    // 1. Migrate users
    console.log('\nMigrating users...');
    const authUsers = await authDb.collection('users').find({}).toArray();
    const tangerineUsers = await tangerineDb.collection('users').find({}).toArray();

    // Convert auth users to new format
    const convertedAuthUsers = authUsers.map(user => ({
      ...user,
      role: user.userType, // Convert userType to role
      // Remove the userType field
      userType: undefined
    }));

    // Insert all users into tweb
    if (convertedAuthUsers.length > 0 || tangerineUsers.length > 0) {
      await twebDb.collection('users').deleteMany({});
      if (convertedAuthUsers.length > 0) {
        await twebDb.collection('users').insertMany(convertedAuthUsers);
      }
      if (tangerineUsers.length > 0) {
        await twebDb.collection('users').insertMany(tangerineUsers);
      }
      console.log(`Migrated ${convertedAuthUsers.length + tangerineUsers.length} users`);
    }

    // 2. Migrate practitioner profiles
    console.log('\nMigrating practitioner profiles...');
    const testProfiles = await testDb.collection('practitionerProfiles').find({}).toArray();
    if (testProfiles.length > 0) {
      await twebDb.collection('practitionerProfiles').deleteMany({});
      await twebDb.collection('practitionerProfiles').insertMany(testProfiles);
      console.log(`Migrated ${testProfiles.length} practitioner profiles`);
    }

    // 3. Migrate appointments
    console.log('\nMigrating appointments...');
    const testAppointments = await testDb.collection('appointments').find({}).toArray();
    if (testAppointments.length > 0) {
      await twebDb.collection('appointments').deleteMany({});
      await twebDb.collection('appointments').insertMany(testAppointments);
      console.log(`Migrated ${testAppointments.length} appointments`);
    }

    // 4. Migrate blogs
    // We'll take blogs from test db as they have the practitionerId in author object
    console.log('\nMigrating blogs...');
    const testBlogs = await testDb.collection('blogs').find({}).toArray();
    if (testBlogs.length > 0) {
      await twebDb.collection('blogs').deleteMany({});
      await twebDb.collection('blogs').insertMany(testBlogs);
      console.log(`Migrated ${testBlogs.length} blogs`);
    }

    // 5. Delete old databases
    console.log('\nCleaning up old databases...');
    await client.db('auth').dropDatabase();
    await client.db('tangerine').dropDatabase();
    await client.db('test').dropDatabase();
    console.log('Old databases deleted');

    console.log('\nMigration completed successfully!');
    console.log('All data has been consolidated into the "tweb" database');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nConnection to MongoDB closed');
  }
}

// Run migration
migrateDatabase().catch(console.error);