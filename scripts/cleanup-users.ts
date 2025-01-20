#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function cleanupUsers() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    console.log('Connected to MongoDB...');

    const db = client.db('tweb');
    const users = await db.collection('users').find().toArray();

    // Group users by email
    const usersByEmail = users.reduce((acc, user) => {
      if (!acc[user.email]) {
        acc[user.email] = [];
      }
      acc[user.email].push(user);
      return acc;
    }, {} as Record<string, any[]>);

    // Keep only the most recent user document for each email
    for (const [email, userGroup] of Object.entries(usersByEmail)) {
      if (userGroup.length > 1) {
        console.log(`Found ${userGroup.length} entries for ${email}`);
        
        // Sort by createdAt in descending order (most recent first)
        // If no createdAt, assume it's older
        const sortedUsers = userGroup.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        // Keep the most recent one
        const keepUser = sortedUsers[0];
        const deleteIds = sortedUsers.slice(1).map(u => u._id);

        await db.collection('users').deleteMany({
          _id: { $in: deleteIds }
        });

        console.log(`Kept user ${keepUser._id}, deleted ${deleteIds.length} duplicates`);
      }
    }

    // Clean up any null userType fields
    await db.collection('users').updateMany(
      { userType: null },
      { $unset: { userType: "" } }
    );

    console.log('\nUser cleanup completed successfully!');

  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nConnection to MongoDB closed');
  }
}

// Run cleanup
cleanupUsers().catch(console.error);