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

// ============================================
// MONGODB CONNECTION
// ============================================

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in the environment!');
    // Don't exit process in serverless environment
}

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully!');
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        // Don't exit process in serverless environment
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    });

// ============================================
// SESSION CONFIGURATION
// ============================================

app.use(session({
    secret: process.env.SESSION_SECRET || 'myprakriti_secret_key_2026',
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
// AUTH MIDDLEWARE
// ============================================

function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

// Protected route for admin page (must be BEFORE express.static)
app.get('/admin.html', requireAuth, (req, res) => {
    // Add cache-control headers to prevent the "flash" of unauthorized content
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve static files (HTML, CSS, JS, assets)
app.use(express.static(path.join(__dirname), {
    index: 'index.html'
}));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// API ROUTES
// ============================================

const blogRoutes = require('./routes/blogs');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');

app.use('/api/blogs', blogRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development'
    });
});

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

// Only start the server if we're not in a serverless environment (like Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
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
}

// Global Error Handler to prevent silent crashes on Vercel
app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
});

// Export the app for Vercel
module.exports = app;
