// Vercel Serverless Entry Point — API only
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

const app = express();

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('✅ MongoDB connected'))
        .catch((err) => console.error('❌ MongoDB error:', err.message));

    // Session with Mongo store
    app.use(session({
        secret: process.env.SESSION_SECRET || 'myprakriti-secret-2026',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: MONGODB_URI,
            collectionName: 'sessions',
            ttl: 24 * 60 * 60
        }),
        cookie: {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: false
        }
    }));
} else {
    // Fallback session without Mongo store
    app.use(session({
        secret: process.env.SESSION_SECRET || 'myprakriti-secret-2026',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: false
        }
    }));
}

// API Routes
const blogRoutes = require('../routes/blogs');
const authRoutes = require('../routes/auth');
const uploadRoutes = require('../routes/upload');

app.use('/api/blogs', blogRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

module.exports = app;
