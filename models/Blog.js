const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Nutrition', 'Fitness', 'Mental Health', 'General'],
        default: 'General'
    },
    categoryColor: {
        type: String,
        default: 'text-primary'
    },
    excerpt: {
        type: String,
        required: true,
        trim: true
    },
    imageUrl: {
        type: String,
        default: ''
    },
    content: {
        type: String,
        required: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Blog', blogSchema);
