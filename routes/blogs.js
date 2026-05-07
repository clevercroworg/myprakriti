const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
}

// GET /api/blogs — Get all blogs (public)
router.get('/', async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch blogs.' });
    }
});

// GET /api/blogs/:id — Get single blog (public)
router.get('/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found.' });
        }
        res.json(blog);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch blog.' });
    }
});

// POST /api/blogs — Create new blog (admin only)
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { title, category, categoryColor, excerpt, imageUrl, content } = req.body;
        
        const blog = new Blog({
            title,
            category,
            categoryColor,
            excerpt,
            imageUrl: imageUrl || '',
            content
        });

        const savedBlog = await blog.save();
        res.status(201).json(savedBlog);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/blogs/:id — Update blog (admin only)
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const { title, category, categoryColor, excerpt, imageUrl, content } = req.body;
        
        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            { title, category, categoryColor, excerpt, imageUrl, content },
            { new: true, runValidators: true }
        );

        if (!updatedBlog) {
            return res.status(404).json({ error: 'Blog not found.' });
        }

        res.json(updatedBlog);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/blogs/:id — Delete blog (admin only)
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
        
        if (!deletedBlog) {
            return res.status(404).json({ error: 'Blog not found.' });
        }

        res.json({ message: 'Blog deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete blog.' });
    }
});

module.exports = router;
