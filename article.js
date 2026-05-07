document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('article-container');
    
    // Get article ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (!articleId) {
        showError('Article Not Found', 'No article ID was provided in the URL.');
        return;
    }

    // Fetch article from API
    try {
        const res = await fetch(`/api/blogs/${articleId}`);
        
        if (!res.ok) {
            // Fallback: try localStorage for static usage
            const blogs = JSON.parse(localStorage.getItem('myprakrit_blogs') || '[]');
            const localBlog = blogs.find(b => b.id === articleId);
            if (localBlog) {
                renderArticle(localBlog);
                return;
            }
            throw new Error('Not found');
        }

        const article = await res.json();
        renderArticle(article);
    } catch (err) {
        showError('Article Not Found', 'The article you are looking for does not exist or has been removed.');
    }

    function renderArticle(blog) {
        // Handle image logic — support both imageUrl (API) and imageClass (legacy)
        let bgStyle = '';
        let addClass = '';
        const imgSrc = blog.imageUrl || blog.imageClass || '';

        if (imgSrc && (imgSrc.startsWith('http') || imgSrc.startsWith('/uploads') || imgSrc.startsWith('data:'))) {
            bgStyle = `style="background-image: url('${imgSrc}');"`;
        } else if (imgSrc && imgSrc.startsWith('img-placeholder')) {
            addClass = imgSrc;
        } else {
            addClass = 'img-placeholder-1';
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
