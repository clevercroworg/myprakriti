document.addEventListener('DOMContentLoaded', async () => {
    // ============================================
    // AUTH CHECK — Redirect to login if not authenticated
    // ============================================
    try {
        const authRes = await fetch('/api/auth/check');
        const authData = await authRes.json();
        if (!authData.authenticated) {
            window.location.href = 'login.html';
            return;
        }
    } catch (err) {
        console.error('Auth check failed:', err);
        window.location.href = 'login.html';
    }

    // ============================================
    // DOM REFERENCES
    // ============================================
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

    // Track the uploaded image URL
    let currentImageUrl = '';

    // ============================================
    // LOGOUT
    // ============================================
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
            } catch (e) {}
            window.location.href = 'login.html';
        });
    }

    // ============================================
    // IMAGE UPLOAD — Compress, validate, and upload
    // ============================================
    const uploadStatus = document.getElementById('image-upload-status');

    function showUploadStatus(message, type) {
        if (!uploadStatus) return;
        const colors = {
            info: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
            success: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
            error: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
            loading: { bg: '#faf5ff', border: '#c4b5fd', text: '#5b21b6' }
        };
        const c = colors[type] || colors.info;
        uploadStatus.style.display = 'block';
        uploadStatus.style.background = c.bg;
        uploadStatus.style.border = `1px solid ${c.border}`;
        uploadStatus.style.color = c.text;
        uploadStatus.innerHTML = message;
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    // Compress image on client side before uploading
    function compressImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                    } else {
                        if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', 0.8);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    imageUpload.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const originalSize = file.size;
        const maxSize = 5 * 1024 * 1024; // 5MB

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showUploadStatus('<i class="fa-solid fa-circle-xmark"></i> Invalid file type. Use JPEG, PNG, GIF, or WebP.', 'error');
            imageUpload.value = '';
            return;
        }

        // Show compressing status
        showUploadStatus(`<i class="fa-solid fa-compress"></i> Compressing image (${formatFileSize(originalSize)})...`, 'loading');

        // Compress if over 1MB or large dimensions
        let uploadFile = file;
        if (originalSize > 1 * 1024 * 1024) {
            const compressed = await compressImage(file);
            uploadFile = new File([compressed], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
            showUploadStatus(`<i class="fa-solid fa-compress"></i> Compressed: ${formatFileSize(originalSize)} → ${formatFileSize(uploadFile.size)}`, 'info');
        }

        // Final size check
        if (uploadFile.size > maxSize) {
            showUploadStatus(`<i class="fa-solid fa-circle-xmark"></i> File still too large after compression (${formatFileSize(uploadFile.size)}). Please use a smaller image.`, 'error');
            imageUpload.value = '';
            return;
        }

        // Show preview
        const previewReader = new FileReader();
        previewReader.onload = function(event) {
            previewImg.src = event.target.result;
            imagePreviewContainer.style.display = 'block';
        };
        previewReader.readAsDataURL(uploadFile);

        // Upload to server
        showUploadStatus('<i class="fa-solid fa-cloud-arrow-up"></i> Uploading to server...', 'loading');
        const formData = new FormData();
        formData.append('image', uploadFile);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                currentImageUrl = data.imageUrl;
                imageDataInput.value = data.imageUrl;
                showUploadStatus(`<i class="fa-solid fa-circle-check"></i> Uploaded successfully! (${formatFileSize(uploadFile.size)})`, 'success');
            } else {
                showUploadStatus(`<i class="fa-solid fa-circle-xmark"></i> ${data.error || 'Upload failed'}`, 'error');
                currentImageUrl = '';
            }
        } catch (err) {
            showUploadStatus('<i class="fa-solid fa-circle-xmark"></i> Server unavailable. Image not uploaded.', 'error');
            currentImageUrl = '';
        }
    });

    btnRemoveImage.addEventListener('click', () => {
        imageUpload.value = '';
        imageDataInput.value = '';
        currentImageUrl = '';
        previewImg.src = '';
        imagePreviewContainer.style.display = 'none';
        if (uploadStatus) uploadStatus.style.display = 'none';
    });

    // ============================================
    // RENDER TABLE — Fetch from API
    // ============================================
    async function renderAdminTable() {
        blogListBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 30px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>';

        let blogs = [];
        try {
            const res = await fetch('/api/blogs');
            if (!res.ok) throw new Error('API error');
            blogs = await res.json();
        } catch (err) {
            // Fallback to localStorage
            console.warn('API unavailable, using localStorage fallback');
            blogs = typeof getBlogs === 'function' ? getBlogs() : [];
        }

        blogListBody.innerHTML = '';

        if (blogs.length === 0) {
            blogListBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No articles found. Add one above.</td></tr>';
            return;
        }

        blogs.forEach(blog => {
            const tr = document.createElement('tr');
            const blogId = blog._id || blog.id;
            const imgSrc = blog.imageUrl || blog.imageClass || '';

            // Image Preview
            let imgPreview = '';
            if (imgSrc && (imgSrc.startsWith('http') || imgSrc.startsWith('/uploads') || imgSrc.startsWith('data:'))) {
                imgPreview = `<div class="img-preview" style="background-image: url('${imgSrc}');"></div>`;
            } else {
                imgPreview = `<div class="img-preview ${imgSrc || 'img-placeholder-1'}"></div>`;
            }

            tr.innerHTML = `
                <td>${imgPreview}</td>
                <td class="details-col">
                    <h4>${blog.title}</h4>
                    <span class="category-badge">${blog.category || 'General'}</span>
                </td>
                <td class="actions-col">
                    <button class="btn btn-edit" data-id="${blogId}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-danger" data-id="${blogId}"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;

            // Edit button
            tr.querySelector('.btn-edit').addEventListener('click', () => editBlog(blogId));
            // Delete button
            tr.querySelector('.btn-danger').addEventListener('click', () => deleteBlog(blogId));

            blogListBody.appendChild(tr);
        });
    }

    // ============================================
    // SAVE BLOG — POST/PUT to API
    // ============================================
    blogForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('blog-id').value;
        const title = document.getElementById('blog-title').value;
        const category = document.getElementById('blog-category').value;
        const excerpt = document.getElementById('blog-excerpt').value;
        const content = document.getElementById('blog-content').value;
        const imageUrl = currentImageUrl || imageDataInput.value || '';

        let categoryColor = 'text-primary';
        if (category === 'Fitness') categoryColor = 'text-accent';

        const blogData = {
            title,
            category,
            categoryColor,
            excerpt,
            imageUrl,
            content
        };

        const btnSave = document.getElementById('btn-save');
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        try {
            let res;
            if (id) {
                // Update existing blog
                res = await fetch(`/api/blogs/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(blogData)
                });
            } else {
                // Create new blog
                res = await fetch('/api/blogs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(blogData)
                });
            }

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Save failed');
            }

            resetForm();
            await renderAdminTable();
        } catch (err) {
            alert('Error saving article: ' + err.message);
        } finally {
            btnSave.disabled = false;
            btnSave.innerHTML = 'Save Article';
        }
    });

    // ============================================
    // EDIT BLOG — Fetch single blog from API
    // ============================================
    async function editBlog(id) {
        try {
            const res = await fetch(`/api/blogs/${id}`);
            if (!res.ok) throw new Error('Blog not found');
            const blog = await res.json();

            document.getElementById('blog-id').value = blog._id || blog.id;
            document.getElementById('blog-title').value = blog.title;
            document.getElementById('blog-category').value = blog.category;
            document.getElementById('blog-excerpt').value = blog.excerpt;
            document.getElementById('blog-content').value = blog.content || '';

            // Handle image preview
            const imgSrc = blog.imageUrl || '';
            currentImageUrl = imgSrc;
            imageDataInput.value = imgSrc;

            if (imgSrc && (imgSrc.startsWith('http') || imgSrc.startsWith('/uploads') || imgSrc.startsWith('data:'))) {
                previewImg.src = imgSrc;
                imagePreviewContainer.style.display = 'block';
            } else {
                previewImg.src = '';
                imagePreviewContainer.style.display = 'none';
            }
            imageUpload.value = '';

            formTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Article';
            btnCancel.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            alert('Error loading article: ' + err.message);
        }
    }

    // ============================================
    // DELETE BLOG — DELETE via API
    // ============================================
    async function deleteBlog(id) {
        if (!confirm('Are you sure you want to delete this article?')) return;

        try {
            const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Delete failed');
            }
            await renderAdminTable();
        } catch (err) {
            alert('Error deleting article: ' + err.message);
        }
    }

    // ============================================
    // RESET FORM
    // ============================================
    btnCancel.addEventListener('click', resetForm);

    function resetForm() {
        blogForm.reset();
        document.getElementById('blog-id').value = '';
        imageDataInput.value = '';
        currentImageUrl = '';
        previewImg.src = '';
        imagePreviewContainer.style.display = 'none';
        formTitle.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Add New Article';
        btnCancel.classList.add('hidden');
    }

    // ============================================
    // INITIAL RENDER
    // ============================================
    await renderAdminTable();
});
