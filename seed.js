require('dotenv').config();
const mongoose = require('mongoose');
const Blog = require('./models/Blog');
const Admin = require('./models/Admin');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env file!');
    process.exit(1);
}

// Default blog articles to seed
const defaultBlogs = [
    {
        title: 'The Role of Macronutrients in Daily Energy',
        category: 'Nutrition',
        categoryColor: 'text-primary',
        excerpt: 'Discover how balancing your proteins, fats, and carbs can stabilize your energy levels throughout the day and keep you focused.',
        imageUrl: '',
        content: '<p>Macronutrients—carbohydrates, proteins, and fats—are the primary building blocks of our diet and the main sources of energy for our bodies. Balancing these nutrients is crucial for maintaining stable energy levels throughout the day.</p><h2>Carbohydrates: The Quick Fuel</h2><p>Carbs are your body\'s preferred energy source. Opt for complex carbohydrates like whole grains, oats, and vegetables, which release energy slowly, preventing the dreaded afternoon crash.</p><h2>Proteins: The Building Blocks</h2><p>Protein is essential for muscle repair and growth, but it also helps keep you satiated. Including a source of protein in every meal can help stabilize blood sugar levels.</p><h2>Fats: Sustained Energy</h2><p>Healthy fats, such as those found in avocados, nuts, and olive oil, are dense sources of energy that keep you full for longer. They are vital for brain health and hormone production.</p>'
    },
    {
        title: 'Building a Sustainable Workout Routine',
        category: 'Fitness',
        categoryColor: 'text-accent',
        excerpt: 'Tips and strategies to create a workout plan that you actually enjoy, preventing burnout and ensuring long-term success.',
        imageUrl: '',
        content: '<p>Starting a workout routine is easy, but sticking to it is where most people fail. The key to long-term success is building a sustainable plan that fits into your lifestyle.</p><h2>Start Small</h2><p>Don\'t commit to working out six days a week right off the bat. Start with two or three days of moderate activity and gradually increase the frequency and intensity.</p><h2>Find What You Love</h2><p>If you hate running, don\'t run. Try cycling, swimming, weightlifting, or even dance classes. You are much more likely to stick to a routine if you actually enjoy the activity.</p><h2>Schedule It In</h2><p>Treat your workouts like important meetings. Block out the time in your calendar and stick to it.</p>'
    },
    {
        title: 'Mindfulness Techniques for Busy Professionals',
        category: 'Mental Health',
        categoryColor: 'text-primary',
        excerpt: 'Simple 5-minute practices to reduce stress, improve mental clarity, and elevate your overall quality of life in a fast-paced world.',
        imageUrl: '',
        content: '<p>In today\'s fast-paced corporate world, stress is almost inevitable. However, incorporating simple mindfulness techniques into your daily routine can significantly improve your mental clarity and overall well-being.</p><h2>The 5-Minute Breathing Exercise</h2><p>Find a quiet spot, close your eyes, and focus entirely on your breath. Inhale deeply for four seconds, hold for four seconds, and exhale for six seconds. Repeat this for five minutes.</p><h2>Mindful Eating</h2><p>Instead of eating lunch at your desk while checking emails, take 15 minutes to eat away from screens. Focus on the taste, texture, and smell of your food.</p><h2>The Body Scan</h2><p>Before bed, spend a few minutes mentally scanning your body from head to toe, noticing any areas of tension and consciously relaxing them.</p>'
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Seed Admin User
        const existingAdmin = await Admin.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
        if (!existingAdmin) {
            const admin = new Admin({
                username: process.env.ADMIN_USERNAME || 'admin',
                password: process.env.ADMIN_PASSWORD || 'admin123'
            });
            await admin.save();
            console.log('✅ Admin user created:', admin.username);
        } else {
            console.log('ℹ️  Admin user already exists, skipping.');
        }

        // Seed Default Blogs
        const blogCount = await Blog.countDocuments();
        if (blogCount === 0) {
            await Blog.insertMany(defaultBlogs);
            console.log(`✅ ${defaultBlogs.length} default blog articles seeded.`);
        } else {
            console.log(`ℹ️  ${blogCount} blogs already exist, skipping blog seed.`);
        }

        console.log('');
        console.log('🌿 Database seeding complete!');
        console.log('   Admin Login: username=' + (process.env.ADMIN_USERNAME || 'admin') + ', password=' + (process.env.ADMIN_PASSWORD || 'admin123'));
        console.log('');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding error:', err.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seed();
