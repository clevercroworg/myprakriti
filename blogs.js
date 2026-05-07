// Default blogs used as fallback only when API is unavailable
const defaultBlogs = [
    {
        id: '1',
        category: 'Nutrition',
        categoryColor: 'text-primary',
        title: 'The Role of Macronutrients in Daily Energy',
        excerpt: 'Discover how balancing your proteins, fats, and carbs can stabilize your energy levels throughout the day and keep you focused.',
        imageUrl: '',
        content: '<p>Macronutrients—carbohydrates, proteins, and fats—are the primary building blocks of our diet and the main sources of energy for our bodies.</p>'
    }
];

// Fetch blogs from API (MongoDB)
async function fetchBlogs() {
    try {
        const res = await fetch('/api/blogs');
        if (!res.ok) throw new Error('API error');
        const blogs = await res.json();
        return blogs;
    } catch (err) {
        console.warn('Could not fetch from API, using localStorage fallback:', err.message);
        // Fallback to localStorage for static file usage (no server)
        const stored = localStorage.getItem('myprakrit_blogs');
        return stored ? JSON.parse(stored) : defaultBlogs;
    }
}

// Legacy function for backward compatibility (used by admin.js)
function getBlogs() {
    const storedBlogs = localStorage.getItem('myprakrit_blogs');
    if (storedBlogs) {
        return JSON.parse(storedBlogs);
    }
    return defaultBlogs;
}

async function renderBlogs() {
    const blogsGrid = document.getElementById('dynamic-blogs-grid');
    if (!blogsGrid) return;

    // Show loading state
    blogsGrid.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted); grid-column: 1 / -1;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 1.5rem;"></i><p style="margin-top: 10px;">Loading articles...</p></div>';

    const blogs = await fetchBlogs();
    blogsGrid.innerHTML = '';

    if (blogs.length === 0) {
        blogsGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1 / -1;">No articles available at the moment.</p>';
        return;
    }

    blogs.forEach(blog => {
        const article = document.createElement('article');
        article.className = 'blog-card';

        // Use _id from MongoDB or id as fallback
        const blogId = blog._id || blog.id;

        // Handle image: imageUrl from API, or imageClass for legacy
        let imageDiv = '';
        const imgSrc = blog.imageUrl || blog.imageClass || '';

        if (imgSrc && (imgSrc.startsWith('http') || imgSrc.startsWith('/uploads') || imgSrc.startsWith('data:'))) {
            imageDiv = `<div class="blog-image" style="background-image: url('${imgSrc}');"></div>`;
        } else if (imgSrc && imgSrc.startsWith('img-placeholder')) {
            imageDiv = `<div class="blog-image ${imgSrc}"></div>`;
        } else {
            imageDiv = `<div class="blog-image img-placeholder-1"></div>`;
        }

        article.innerHTML = `
            ${imageDiv}
            <div class="blog-content">
                <span class="blog-category ${blog.categoryColor || 'text-primary'}">${blog.category || 'General'}</span>
                <h3 class="blog-title">${blog.title}</h3>
                <p class="blog-excerpt">${blog.excerpt}</p>
                <a href="article.html?id=${blogId}" class="read-more">Read Article <i class="fa-solid fa-chevron-right"></i></a>
            </div>
        `;
        blogsGrid.appendChild(article);
    });
}

document.addEventListener('DOMContentLoaded', renderBlogs);
