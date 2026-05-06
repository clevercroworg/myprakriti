document.addEventListener('DOMContentLoaded', () => {
    // Check if blogs.js is loaded
    if (typeof getBlogs !== 'function') {
        console.error('blogs.js must be loaded before article.js');
        return;
    }

    const container = document.getElementById('article-container');
    
    // Get article ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (!articleId) {
        showError('Article Not Found', 'No article ID was provided in the URL.');
        return;
    }

    const blogs = getBlogs();
    const article = blogs.find(b => b.id === articleId);

    if (!article) {
        showError('Article Not Found', 'The article you are looking for does not exist or has been removed.');
        return;
    }

    renderArticle(article);

    function renderArticle(blog) {
        // Handle image logic (URL vs Class)
        let bgStyle = '';
        let addClass = '';
        if (blog.imageClass && (blog.imageClass.startsWith('http') || blog.imageClass.startsWith('data:'))) {
            bgStyle = `style="background-image: url('${blog.imageClass}');"`;
        } else {
            addClass = blog.imageClass || 'img-placeholder-1';
        }

        const categoryColorClass = blog.categoryColor || 'text-primary';
        
        // If content is empty, fallback to excerpt
        const bodyContent = blog.content ? blog.content : `<p>${blog.excerpt}</p>`;

        container.innerHTML = `
            <div class="article-hero ${addClass} fade-in" ${bgStyle}>
                <div class="article-hero-overlay">
                    <span class="blog-category ${categoryColorClass}">${blog.category || 'General'}</span>
                    <h1 class="blog-title">${blog.title}</h1>
                </div>
            </div>
            
            <div class="article-body fade-in" style="animation-delay: 0.1s;">
                ${bodyContent}
            </div>
        `;
        
        // Update page title
        document.title = `${blog.title} - Health & Wellness Hub`;
    }

    function showError(title, message) {
        container.innerHTML = `
            <div class="error-message fade-in">
                <h2><i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i> ${title}</h2>
                <p>${message}</p>
                <a href="index.html" class="btn btn-primary">Return to Home</a>
            </div>
        `;
    }
});
