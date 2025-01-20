import { config } from 'dotenv';
import { resolve } from 'path';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load environment variables from .env.local with absolute path
config({ path: resolve(__dirname, '../.env.local') });
if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in .env.local');
}
const dummyBlogs = [
    {
        title: "Understanding Ayurvedic Principles",
        description: "Explore the fundamental principles of Ayurveda and how they contribute to holistic health. Learn about the three doshas - Vata, Pitta, and Kapha - and how they influence your physical and mental well-being.",
        author: {
            name: "harsha",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=harsha"
        },
        readTime: "5 min read",
        backgroundImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b"
    },
    {
        title: "Natural Remedies in Modern Healthcare",
        description: "Discover how traditional Ayurvedic remedies can complement modern medical practices. Learn about evidence-based natural treatments that have stood the test of time.",
        author: {
            name: "harsha",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=harsha"
        },
        readTime: "4 min read",
        backgroundImage: "https://images.unsplash.com/photo-1498837167922-ddd27525d352"
    },
    {
        title: "Balancing Body and Mind Through Ayurveda",
        description: "Learn how Ayurvedic practices can help achieve harmony between physical and mental health. Explore practical techniques for daily wellness routines.",
        author: {
            name: "harsha",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=harsha"
        },
        readTime: "6 min read",
        backgroundImage: "https://images.unsplash.com/photo-1535637603896-07c179d71f07"
    },
    {
        title: "Ayurvedic Diet for Modern Lifestyles",
        description: "Understand how to apply Ayurvedic dietary principles in today's fast-paced world. Learn about food combinations that promote optimal health and digestion.",
        author: {
            name: "harsha",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=harsha"
        },
        readTime: "7 min read",
        backgroundImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061"
    },
    {
        title: "Seasonal Wellness with Ayurveda",
        description: "Master the art of adapting your lifestyle according to seasonal changes. Discover Ayurvedic practices that help maintain balance throughout the year.",
        author: {
            name: "harsha",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=harsha"
        },
        readTime: "5 min read",
        backgroundImage: "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7"
    }
];
async function seedBlogs() {
    try {
        console.log('Connecting to MongoDB...');
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db("tweb");
        // First, find the practitioner by name
        console.log('Finding practitioner profile for "harsha"...');
        const practitionerCollection = db.collection("practitionerProfiles");
        // List all practitioners for debugging
        const practitioners = await practitionerCollection.find().toArray();
        console.log('Found practitioners:', practitioners.map(p => ({ name: p.name, userId: p.userId })));
        const practitioner = await practitionerCollection.findOne({
            name: { $regex: '^harsha$', $options: 'i' }
        });
        if (!practitioner) {
            throw new Error('Practitioner "harsha" not found in database');
        }
        console.log('Found practitioner:', practitioner);
        // Clear existing blogs
        console.log('Clearing existing blogs...');
        await db.collection("blogs").deleteMany({});
        // Insert new blogs with practitionerId
        console.log('Inserting new blogs...');
        const result = await db.collection("blogs").insertMany(dummyBlogs.map(blog => (Object.assign(Object.assign({}, blog), { author: Object.assign(Object.assign({}, blog.author), { practitionerId: practitioner.userId // Add practitionerId to each blog
             }), createdAt: new Date() }))));
        console.log(`Successfully seeded ${result.insertedCount} blogs`);
        await client.close();
        process.exit(0);
    }
    catch (error) {
        console.error("Error seeding blogs:", error);
        process.exit(1);
    }
}
seedBlogs();
