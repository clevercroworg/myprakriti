require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (HTML, CSS, JS, assets)
app.use(express.static(path.join(__dirname), {
    index: 'index.html'
}));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// MONGODB CONNECTION
// ============================================

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env file!');
    console.error('   Please add your MongoDB connection string to the .env file.');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully!');
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

// ============================================
// SESSION CONFIGURATION
// ============================================

app.use(session({
    secret: process.env.SESSION_SECRET || 'myprakriti-secret-2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        collectionName: 'sessions',
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: true,
        secure: false // Set to true in production with HTTPS
    }
}));

// ============================================
// API ROUTES
// ============================================

const blogRoutes = require('./routes/blogs');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');

app.use('/api/blogs', blogRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// ============================================
// CATCH-ALL (serve index.html for unknown routes)
// ============================================

app.get('{*path}', (req, res) => {
    // Only serve HTML for non-API routes
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.status(404).json({ error: 'API endpoint not found.' });
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log('');
    console.log('🌿 ═══════════════════════════════════════════');
    console.log('   Health & Wellness Hub — Server Running');
    console.log('🌿 ═══════════════════════════════════════════');
    console.log(`   🌐 Site:    http://localhost:${PORT}`);
    console.log(`   🔑 Admin:   http://localhost:${PORT}/login.html`);
    console.log(`   📡 API:     http://localhost:${PORT}/api/blogs`);
    console.log('🌿 ═══════════════════════════════════════════');
    console.log('');
});
