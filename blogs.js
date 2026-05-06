const defaultBlogs = [
    {
        id: '1',
        category: 'Nutrition',
        categoryColor: 'text-primary',
        title: 'The Role of Macronutrients in Daily Energy',
        excerpt: 'Discover how balancing your proteins, fats, and carbs can stabilize your energy levels throughout the day and keep you focused.',
        imageClass: 'img-placeholder-1',
        content: '<p>Macronutrients—carbohydrates, proteins, and fats—are the primary building blocks of our diet and the main sources of energy for our bodies. Balancing these nutrients is crucial for maintaining stable energy levels throughout the day.</p><h2>Carbohydrates: The Quick Fuel</h2><p>Carbs are your body\'s preferred energy source. Opt for complex carbohydrates like whole grains, oats, and vegetables, which release energy slowly, preventing the dreaded afternoon crash.</p><h2>Proteins: The Building Blocks</h2><p>Protein is essential for muscle repair and growth, but it also helps keep you satiated. Including a source of protein in every meal can help stabilize blood sugar levels.</p><h2>Fats: Sustained Energy</h2><p>Healthy fats, such as those found in avocados, nuts, and olive oil, are dense sources of energy that keep you full for longer. They are vital for brain health and hormone production.</p>'
    },
    {
        id: '2',
        category: 'Fitness',
        categoryColor: 'text-accent',
        title: 'Building a Sustainable Workout Routine',
        excerpt: 'Tips and strategies to create a workout plan that you actually enjoy, preventing burnout and ensuring long-term success.',
        imageClass: 'img-placeholder-2',
        content: '<p>Starting a workout routine is easy, but sticking to it is where most people fail. The key to long-term success is building a sustainable plan that fits into your lifestyle.</p><h2>Start Small</h2><p>Don\'t commit to working out six days a week right off the bat. Start with two or three days of moderate activity and gradually increase the frequency and intensity.</p><h2>Find What You Love</h2><p>If you hate running, don\'t run. Try cycling, swimming, weightlifting, or even dance classes. You are much more likely to stick to a routine if you actually enjoy the activity.</p><h2>Schedule It In</h2><p>Treat your workouts like important meetings. Block out the time in your calendar and stick to it.</p>'
    },
    {
        id: '3',
        category: 'Mental Health',
        categoryColor: 'text-primary',
        title: 'Mindfulness Techniques for Busy Professionals',
        excerpt: 'Simple 5-minute practices to reduce stress, improve mental clarity, and elevate your overall quality of life in a fast-paced world.',
        imageClass: 'img-placeholder-3',
        content: '<p>In today\'s fast-paced corporate world, stress is almost inevitable. However, incorporating simple mindfulness techniques into your daily routine can significantly improve your mental clarity and overall well-being.</p><h2>The 5-Minute Breathing Exercise</h2><p>Find a quiet spot, close your eyes, and focus entirely on your breath. Inhale deeply for four seconds, hold for four seconds, and exhale for six seconds. Repeat this for five minutes.</p><h2>Mindful Eating</h2><p>Instead of eating lunch at your desk while checking emails, take 15 minutes to eat away from screens. Focus on the taste, texture, and smell of your food.</p><h2>The Body Scan</h2><p>Before bed, spend a few minutes mentally scanning your body from head to toe, noticing any areas of tension and consciously relaxing them.</p>'
    }
];

function getBlogs() {
    const storedBlogs = localStorage.getItem('myprakrit_blogs');
    if (storedBlogs) {
        return JSON.parse(storedBlogs);
    } else {
        // Initialize with default blogs
        localStorage.setItem('myprakrit_blogs', JSON.stringify(defaultBlogs));
        return defaultBlogs;
    }
}

function renderBlogs() {
    const blogsGrid = document.getElementById('dynamic-blogs-grid');
    if (!blogsGrid) return; // Only run if the grid exists on the current page

    const blogs = getBlogs();
    blogsGrid.innerHTML = ''; // Clear existing content

    if (blogs.length === 0) {
        blogsGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1 / -1;">No articles available at the moment.</p>';
        return;
    }

    blogs.forEach(blog => {
        const article = document.createElement('article');
        article.className = 'blog-card';

        // Assuming imageClass can be used as a CSS class or image URL. 
        // If it starts with http or ./, it's a URL. Otherwise it's a class.
        let imageDiv = '';
        if (blog.imageClass && (blog.imageClass.startsWith('http') || blog.imageClass.startsWith('data:'))) {
            imageDiv = `<div class="blog-image" style="background-image: url('${blog.imageClass}');"></div>`;
        } else {
            imageDiv = `<div class="blog-image ${blog.imageClass || 'img-placeholder-1'}"></div>`;
        }

        article.innerHTML = `
            ${imageDiv}
            <div class="blog-content">
                <span class="blog-category ${blog.categoryColor || 'text-primary'}">${blog.category || 'General'}</span>
                <h3 class="blog-title">${blog.title}</h3>
                <p class="blog-excerpt">${blog.excerpt}</p>
                <a href="article.html?id=${blog.id}" class="read-more">Read Article <i class="fa-solid fa-chevron-right"></i></a>
            </div>
        `;
        blogsGrid.appendChild(article);
    });
}

document.addEventListener('DOMContentLoaded', renderBlogs);
