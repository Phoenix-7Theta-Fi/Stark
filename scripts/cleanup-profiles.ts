#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function cleanupProfiles() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    console.log('Connected to MongoDB...');

    const testDb = client.db('test');
    const twebDb = client.db('tweb');

    // Get all profiles from test database
    const testProfiles = await testDb.collection('practitionerProfiles').find({}).toArray();

    if (testProfiles.length > 0) {
      console.log(`Found ${testProfiles.length} profiles in test database`);
      
      // For each profile in test, update or insert into tweb
      for (const profile of testProfiles) {
        // Check if a profile with this userId already exists in tweb
        const existingProfile = await twebDb.collection('practitionerProfiles')
          .findOne({ userId: profile.userId });

        if (existingProfile) {
          // Compare updatedAt dates and keep the most recent one
          const testDate = new Date(profile.updatedAt);
          const existingDate = new Date(existingProfile.updatedAt);

          if (testDate > existingDate) {
            // Create update object without _id
            const { _id, ...updateData } = profile;
            
            await twebDb.collection('practitionerProfiles')
              .updateOne(
                { _id: existingProfile._id },
                { $set: updateData }
              );
            console.log(`Updated profile for user ${profile.userId} with newer version`);
          }
        } else {
          // Insert the profile if it doesn't exist
          await twebDb.collection('practitionerProfiles')
            .insertOne(profile);
          console.log(`Inserted new profile for user ${profile.userId}`);
        }
      }
    }

    // Delete test database
    await testDb.dropDatabase();
    console.log('Test database deleted');

    console.log('\nProfile cleanup completed successfully!');

  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nConnection to MongoDB closed');
  }
}

// Run cleanup
cleanupProfiles().catch(console.error);