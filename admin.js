document.addEventListener('DOMContentLoaded', () => {
    // Check if blogs.js is loaded
    if (typeof getBlogs !== 'function') {
        console.error('blogs.js must be loaded before admin.js');
        return;
    }

    const blogForm = document.getElementById('blog-form');
    const blogListBody = document.getElementById('blog-list-body');
    const btnCancel = document.getElementById('btn-cancel');
    const formTitle = document.getElementById('form-title');

    // Image Upload Elements
    const imageUpload = document.getElementById('blog-image-upload');
    const imageDataInput = document.getElementById('blog-image-data');
    const imagePreviewContainer = document.getElementById('image-upload-preview');
    const previewImg = document.getElementById('upload-preview-img');
    const btnRemoveImage = document.getElementById('btn-remove-image');

    // Handle Image Upload and Compression
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Resize to max 800px width/height to save localStorage space
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // 80% quality JPEG
                
                // Set data and show preview
                imageDataInput.value = dataUrl;
                previewImg.src = dataUrl;
                imagePreviewContainer.style.display = 'block';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    btnRemoveImage.addEventListener('click', () => {
        imageUpload.value = '';
        imageDataInput.value = '';
        previewImg.src = '';
        imagePreviewContainer.style.display = 'none';
    });

    // Load blogs and populate table
    function renderAdminTable() {
        const blogs = getBlogs();
        blogListBody.innerHTML = '';

        if (blogs.length === 0) {
            blogListBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No articles found. Add one above.</td></tr>';
            return;
        }

        blogs.forEach(blog => {
            const tr = document.createElement('tr');

            // Image Preview
            let imgPreview = '';
            if (blog.imageClass && (blog.imageClass.startsWith('http') || blog.imageClass.startsWith('data:'))) {
                imgPreview = `<div class="img-preview" style="background-image: url('${blog.imageClass}');"></div>`;
            } else {
                imgPreview = `<div class="img-preview ${blog.imageClass || 'img-placeholder-1'}"></div>`;
            }

            tr.innerHTML = `
                <td>${imgPreview}</td>
                <td class="details-col">
                    <h4>${blog.title}</h4>
                    <span class="category-badge">${blog.category || 'General'}</span>
                </td>
                <td class="actions-col">
                    <button class="btn btn-edit" onclick="editBlog('${blog.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-danger" onclick="deleteBlog('${blog.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            blogListBody.appendChild(tr);
        });
    }

    // Save blog (Create or Update)
    blogForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = document.getElementById('blog-id').value;
        const title = document.getElementById('blog-title').value;
        const category = document.getElementById('blog-category').value;
        const excerpt = document.getElementById('blog-excerpt').value;
        const imageClass = imageDataInput.value || 'img-placeholder-1';
        const content = document.getElementById('blog-content').value;

        let categoryColor = 'text-primary';
        if (category === 'Fitness') categoryColor = 'text-accent';
        // Add more color mapping if needed

        const blogData = {
            id: id || Date.now().toString(),
            title,
            category,
            categoryColor,
            excerpt,
            imageClass,
            content
        };

        const blogs = getBlogs();

        if (id) {
            // Update existing
            const index = blogs.findIndex(b => b.id === id);
            if (index !== -1) {
                blogs[index] = blogData;
            }
        } else {
            // Add new
            blogs.push(blogData);
        }

        // Save to localStorage
        localStorage.setItem('myprakrit_blogs', JSON.stringify(blogs));

        // Reset form and UI
        resetForm();
        renderAdminTable();
    });

    // Edit functionality
    window.editBlog = function(id) {
        const blogs = getBlogs();
        const blog = blogs.find(b => b.id === id);
        
        if (blog) {
            document.getElementById('blog-id').value = blog.id;
            document.getElementById('blog-title').value = blog.title;
            document.getElementById('blog-category').value = blog.category;
            document.getElementById('blog-excerpt').value = blog.excerpt;
            document.getElementById('blog-content').value = blog.content || '';

            // Handle image preview for editing
            imageDataInput.value = blog.imageClass || '';
            if (blog.imageClass && (blog.imageClass.startsWith('http') || blog.imageClass.startsWith('data:'))) {
                previewImg.src = blog.imageClass;
                imagePreviewContainer.style.display = 'block';
            } else {
                previewImg.src = '';
                imagePreviewContainer.style.display = 'none';
            }
            imageUpload.value = ''; // clear file input

            formTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Article';
            btnCancel.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Delete functionality
    window.deleteBlog = function(id) {
        if (confirm('Are you sure you want to delete this article?')) {
            let blogs = getBlogs();
            blogs = blogs.filter(b => b.id !== id);
            localStorage.setItem('myprakrit_blogs', JSON.stringify(blogs));
            renderAdminTable();
        }
    };

    // Cancel edit
    btnCancel.addEventListener('click', resetForm);

    function resetForm() {
        blogForm.reset();
        document.getElementById('blog-id').value = '';
        imageDataInput.value = '';
        previewImg.src = '';
        imagePreviewContainer.style.display = 'none';
        formTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Add New Article';
        btnCancel.classList.add('hidden');
    }

    // Initial render
    renderAdminTable();
});
