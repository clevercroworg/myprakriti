const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');

// POST /api/auth/login — Admin login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const admin = await Admin.findOne({ username: username.toLowerCase() });
        
        if (!admin) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const isMatch = await admin.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // Set session
        req.session.isAdmin = true;
        req.session.adminId = admin._id;
        req.session.adminUsername = admin.username;

        res.json({ 
            message: 'Login successful.',
            username: admin.username
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// POST /api/auth/logout — Admin logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout.' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully.' });
    });
});

// GET /api/auth/check — Check if user is authenticated
router.get('/check', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.json({ 
            authenticated: true,
            username: req.session.adminUsername
        });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = router;
