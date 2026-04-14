// Product Review Management System with Backend Integration - NO STATIC DATA

class ProductReviewManager {
    constructor() {
        this.reviews = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentFilter = {
            status: 'all',
            rating: 'all',
            search: ''
        };
        this.selectedReviews = new Set();
        this.currentReplyReviewId = null;
        
        // API Base URL - Update this to match your backend
        this.apiBaseUrl = 'http://localhost:8085/api/reviews';
        
        this.init();
    }

    async init() {
        this.showLoading();
        await this.loadReviews();
        this.initializeElements();
        this.attachEvents();
        await this.updateStats();
        this.renderReviews();
        this.hideLoading();
    }

    showLoading() {
        const tbody = document.getElementById('reviews-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center">
                        <div class="flex flex-col items-center gap-3">
                            <i class="fa-solid fa-spinner fa-spin text-3xl" style="color: #D89F34;"></i>
                            <p class="text-gray-500">Loading reviews from server...</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    hideLoading() {
        // Loading removed when render is called
    }

    async loadReviews() {
        try {
            console.log('Fetching reviews from backend...');
            const response = await fetch(`${this.apiBaseUrl}/all`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const backendReviews = await response.json();
            console.log('Reviews received from backend:', backendReviews);
            
            if (!backendReviews || backendReviews.length === 0) {
                console.warn('No reviews found in backend');
                this.showNotification('No reviews found in the system', 'info');
                this.reviews = [];
            } else {
                this.reviews = await this.transformBackendReviews(backendReviews);
                console.log('Transformed reviews:', this.reviews);
            }
            
        } catch (error) {
            console.error('Error loading reviews from backend:', error);
            this.showNotification(`Failed to load reviews: ${error.message}. Please check if backend server is running.`, 'error');
            this.reviews = [];
        }
    }
    
    async transformBackendReviews(backendReviews) {
        const transformed = [];
        
        for (const review of backendReviews) {
            // Get product details from backend
            let productName = `Product ${review.productId || review.product_id}`;
            try {
                const product = await this.getProductDetails(review.productId || review.product_id);
                if (product && product.name) {
                    productName = product.name;
                }
            } catch (error) {
                console.log(`Could not fetch product ${review.productId}:`, error);
            }
            
            // Get user details from backend
            let userName = `User ${review.userId || review.user_id}`;
            let userEmail = `${userName}@example.com`;
            try {
                const user = await this.getUserDetails(review.userId || review.user_id);
                if (user) {
                    userName = user.name || user.username || userName;
                    userEmail = user.email || userEmail;
                }
            } catch (error) {
                console.log(`Could not fetch user ${review.userId}:`, error);
            }
            
            transformed.push({
                id: review.reviewId || review.review_id || review.id,
                productId: review.productId || review.product_id,
                productName: productName,
                customerName: userName,
                customerEmail: userEmail,
                rating: review.rating || 0,
                title: review.title || (review.comment ? review.comment.substring(0, 50) : 'Product Review'),
                review: review.comment || review.reviewText || review.content || '',
                date: review.createdAt || review.created_at || review.date || new Date().toISOString(),
                status: review.status || 'pending',
                flagged: review.flagged || false,
                replies: review.replies || [],
                helpful: review.helpful || 0,
                imageUrl: review.imageUrl,
                videoUrl: review.videoUrl,
                imageName: review.imageName,
                videoName: review.videoName,
                imageOriginalSize: review.imageOriginalSize,
                imageCompressedSize: review.imageCompressedSize,
                videoOriginalSize: review.videoOriginalSize,
                videoCompressedSize: review.videoCompressedSize,
                imageContentType: review.imageContentType,
                videoContentType: review.videoContentType
            });
        }
        
        return transformed;
    }
    
    async getProductDetails(productId) {
        if (!productId) return null;
        
        try {
            const response = await fetch(`http://localhost:8085/api/products/${productId}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Product API not available:', error);
        }
        
        return null;
    }
    
    async getUserDetails(userId) {
        if (!userId) return null;
        
        try {
            const response = await fetch(`http://localhost:8085/api/users/${userId}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('User API not available:', error);
        }
        
        return null;
    }
    
    async updateStats() {
        try {
            if (this.reviews.length === 0) {
                // Try to get stats from backend summary API
                try {
                    const response = await fetch(`${this.apiBaseUrl}/summary`);
                    if (response.ok) {
                        const summary = await response.json();
                        document.getElementById('total-reviews').textContent = summary.totalReviews || 0;
                        document.getElementById('avg-rating').textContent = (summary.averageRating || 0).toFixed(1);
                        document.getElementById('pending-reviews').textContent = summary.pendingReviews || 0;
                        document.getElementById('flagged-reviews').textContent = summary.flaggedReviews || 0;
                        return;
                    }
                } catch (error) {
                    console.log('Summary API not available, calculating from reviews');
                }
                
                // Calculate from loaded reviews
                document.getElementById('total-reviews').textContent = 0;
                document.getElementById('avg-rating').textContent = '0.0';
                document.getElementById('pending-reviews').textContent = 0;
                document.getElementById('flagged-reviews').textContent = 0;
                return;
            }
            
            const total = this.reviews.length;
            const totalRating = this.reviews.reduce((sum, r) => sum + r.rating, 0);
            const avgRating = (totalRating / total).toFixed(1);
            const pending = this.reviews.filter(r => r.status === 'pending').length;
            const flagged = this.reviews.filter(r => r.flagged === true).length;
            
            document.getElementById('total-reviews').textContent = total;
            document.getElementById('avg-rating').textContent = avgRating;
            document.getElementById('pending-reviews').textContent = pending;
            document.getElementById('flagged-reviews').textContent = flagged;
            
        } catch (error) {
            console.error('Error updating stats:', error);
            // Set default values on error
            document.getElementById('total-reviews').textContent = 0;
            document.getElementById('avg-rating').textContent = '0.0';
            document.getElementById('pending-reviews').textContent = 0;
            document.getElementById('flagged-reviews').textContent = 0;
        }
    }

    async approveReview(id) {
        const review = this.reviews.find(r => r.id === id);
        if (!review) {
            this.showNotification('Review not found', 'error');
            return;
        }
        
        if (review.status === 'approved') {
            this.showNotification('Review is already approved', 'info');
            return;
        }
        
        try {
            this.showLoading();
            const response = await fetch(`${this.apiBaseUrl}/${id}/status?status=approved`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const updatedReview = await response.json();
            
            // Update local review
            review.status = 'approved';
            review.flagged = false;
            
            this.showNotification('Review approved successfully', 'success');
            await this.updateStats();
            this.renderReviews();
            
        } catch (error) {
            console.error('Error approving review:', error);
            this.showNotification(`Failed to approve review: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async deleteReview(id) {
        if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            return;
        }
        
        try {
            this.showLoading();
            const response = await fetch(`${this.apiBaseUrl}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Remove from local array
            const index = this.reviews.findIndex(r => r.id === id);
            if (index !== -1) {
                this.reviews.splice(index, 1);
                this.selectedReviews.delete(id);
            }
            
            this.showNotification('Review deleted successfully', 'success');
            await this.updateStats();
            this.renderReviews();
            
        } catch (error) {
            console.error('Error deleting review:', error);
            this.showNotification(`Failed to delete review: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async submitReply() {
        const content = document.getElementById('reply-content').value.trim();
        if (!content) {
            this.showNotification('Please enter a reply', 'error');
            return;
        }
        
        const review = this.reviews.find(r => r.id === this.currentReplyReviewId);
        if (!review) {
            this.showNotification('Review not found', 'error');
            return;
        }
        
        try {
            this.showLoading();
            const response = await fetch(`${this.apiBaseUrl}/${review.id}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    comment: content,
                    adminName: 'Admin',
                    date: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const updatedReview = await response.json();
            
            // Update local review with new reply
            if (!review.replies) review.replies = [];
            review.replies.push({
                id: Date.now(),
                content: content,
                adminName: 'Admin',
                date: new Date().toISOString()
            });
            
            this.closeReplyModalFn();
            this.showNotification('Reply sent successfully', 'success');
            this.renderReviews();
            
        } catch (error) {
            console.error('Error sending reply:', error);
            this.showNotification(`Failed to send reply: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
async bulkApproveReviews() {
    if (this.selectedReviews.size === 0) {
        this.showNotification('Please select at least one review to approve', 'error');
        return;
    }
    
    let approvedCount = 0;
    let failedCount = 0;
    
    this.showLoading();
    
    for (const id of this.selectedReviews) {
        const review = this.reviews.find(r => r.id === id);
        if (review && review.status === 'pending') {
            try {
                const response = await fetch(`${this.apiBaseUrl}/${id}/status?status=approved`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.ok) {
                    review.status = 'approved';
                    review.approved = true;
                    review.flagged = false;
                    approvedCount++;
                } else {
                    failedCount++;
                }
            } catch (error) {
                console.error('Error bulk approving review:', error);
                failedCount++;
            }
        }
    }
    
    this.hideLoading();
    
    if (approvedCount > 0) {
        this.selectedReviews.clear();
        await this.updateStats();
        this.renderReviews();
        this.showNotification(`${approvedCount} review(s) approved successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`, 'success');
    } else {
        this.showNotification('No pending reviews selected or failed to approve', 'error');
    }
}
    
    async clearFlag(id) {
        const review = this.reviews.find(r => r.id === id);
        if (!review) {
            this.showNotification('Review not found', 'error');
            return;
        }
        
        try {
            this.showLoading();
            const response = await fetch(`${this.apiBaseUrl}/${id}/clear-flag`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            review.flagged = false;
            if (review.status === 'flagged') {
                review.status = 'pending';
            }
            
            await this.updateStats();
            this.renderReviews();
            this.showNotification('Flag cleared successfully', 'success');
            
        } catch (error) {
            console.error('Error clearing flag:', error);
            this.showNotification(`Failed to clear flag: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    // Refresh data from backend
    async refreshData() {
        this.showLoading();
        await this.loadReviews();
        await this.updateStats();
        this.renderReviews();
        this.hideLoading();
        this.showNotification('Data refreshed from server', 'success');
    }
    
async viewReview(id) {
    const review = this.reviews.find(r => r.id === id);
    if (!review) return;
    
    const content = document.getElementById('review-details-content');
    content.innerHTML = `
        <div class="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scroll">
            <!-- Product Header -->
            <div class="flex items-start justify-between border-b border-gray-100 pb-4">
                <div class="flex-1">
                    <h4 class="font-semibold text-xl" style="color: #133F53;">${this.escapeHtml(review.productName)}</h4>
                    <p class="text-sm mt-1" style="color: #957A54;">Product ID: ${review.productId}</p>
                </div>
                <div class="flex items-center gap-1">
                    ${this.renderStars(review.rating)}
                    <span class="text-sm ml-2 font-semibold" style="color: #133F53;">${review.rating}/5</span>
                </div>
            </div>
            
            <!-- Media Section - Grid layout for multiple images/videos -->
            ${(review.mediaFiles && review.mediaFiles.length > 0) || review.imageUrl || review.videoUrl ? `
                <div class="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <p class="text-sm font-semibold mb-3 flex items-center gap-2" style="color: #133F53;">
                        <i class="fa-solid fa-paperclip text-[#D89F34]"></i>
                        Attached Media (${(review.mediaFiles?.length || 0) + (review.imageUrl ? 1 : 0) + (review.videoUrl ? 1 : 0)})
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        ${this.renderMediaGrid(review)}
                    </div>
                </div>
            ` : ''}
            
            <!-- Customer Info -->
            <div class="flex items-start gap-3 pb-3 border-b border-gray-100">
                <div class="w-10 h-10 rounded-full bg-[#D89F34] bg-opacity-20 flex items-center justify-center flex-shrink-0">
                    <span class="font-bold text-lg" style="color: #D89F34;">${review.customerName.charAt(0).toUpperCase()}</span>
                </div>
                <div class="flex-1">
                    <p class="font-semibold" style="color: #133F53;">${this.escapeHtml(review.customerName)}</p>
                    <p class="text-xs" style="color: #957A54;">${this.escapeHtml(review.customerEmail)}</p>
                    <p class="text-xs mt-1" style="color: #957A54;">
                        <i class="fa-regular fa-calendar mr-1"></i>${this.formatDate(review.date)}
                    </p>
                </div>
                <div class="flex gap-2">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${review.status === 'approved' ? 'bg-green-100 text-green-700' : review.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">
                        ${review.status.toUpperCase()}
                    </span>
                    ${review.flagged ? '<span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"><i class="fa-solid fa-flag mr-1"></i>FLAGGED</span>' : ''}
                </div>
            </div>
            
            <!-- Review Title -->
            <div>
                <h5 class="font-bold text-lg mb-2" style="color: #133F53;">${this.escapeHtml(review.title)}</h5>
                <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">${this.escapeHtml(review.review)}</p>
            </div>
            
            <!-- Helpful Count -->
            <div class="flex items-center gap-2 text-sm" style="color: #957A54;">
                <i class="fa-regular fa-thumbs-up"></i>
                <span>${review.helpful} people found this helpful</span>
            </div>
            
            <!-- Admin Replies -->
            ${review.replies && review.replies.length > 0 ? `
                <div class="bg-[#F8F8EA] rounded-xl p-4">
                    <p class="text-sm font-semibold mb-3 flex items-center gap-2" style="color: #133F53;">
                        <i class="fa-regular fa-reply text-[#D89F34]"></i>
                        Admin Responses (${review.replies.length})
                    </p>
                    <div class="space-y-3">
                        ${review.replies.map(reply => `
                            <div class="bg-white rounded-lg p-3">
                                <div class="flex items-center gap-2 mb-2">
                                    <div class="w-6 h-6 rounded-full bg-[#D89F34] bg-opacity-20 flex items-center justify-center">
                                        <i class="fa-regular fa-user text-xs" style="color: #D89F34;"></i>
                                    </div>
                                    <span class="text-sm font-semibold" style="color: #133F53;">${this.escapeHtml(reply.adminName || 'Admin')}</span>
                                    <span class="text-xs" style="color: #957A54;">${this.formatDate(reply.date)}</span>
                                </div>
                                <p class="text-sm text-gray-700">${this.escapeHtml(reply.content)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    this.viewModal.classList.remove('hidden');
    this.viewModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

// Helper method to render media grid (supports multiple images and videos)
renderMediaGrid(review) {
    let mediaHtml = '';
    
    // Handle single image URL (backward compatibility)
    if (review.imageUrl && !review.mediaFiles) {
        mediaHtml += `
            <div class="media-card bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div class="relative group">
                    <img src="${review.imageUrl}" alt="Review Image" 
                         class="w-full h-48 object-cover cursor-pointer" 
                         onclick="window.open('${review.imageUrl}', '_blank')"
                         onerror="this.src='https://via.placeholder.com/400x300?text=Image+Not+Found'">
                    <button onclick="window.open('${review.imageUrl}', '_blank')" 
                            class="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <i class="fa-solid fa-expand text-xs"></i>
                    </button>
                </div>
                <div class="p-2">
                    <p class="text-xs truncate" style="color: #957A54;">${review.imageName || 'Image'}</p>
                    ${review.imageOriginalSize ? `<p class="text-xs" style="color: #957A54;">${this.formatFileSize(review.imageOriginalSize)}</p>` : ''}
                </div>
            </div>
        `;
    }
    
    // Handle single video URL (backward compatibility)
    if (review.videoUrl && !review.mediaFiles) {
        mediaHtml += `
            <div class="media-card bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div class="relative group">
                    <video controls class="w-full h-48 object-cover" preload="metadata">
                        <source src="${review.videoUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
                <div class="p-2">
                    <p class="text-xs truncate" style="color: #957A54;">${review.videoName || 'Video'}</p>
                    ${review.videoOriginalSize ? `<p class="text-xs" style="color: #957A54;">${this.formatFileSize(review.videoOriginalSize)}</p>` : ''}
                </div>
            </div>
        `;
    }
    
    // Handle multiple media files array
    if (review.mediaFiles && review.mediaFiles.length > 0) {
        review.mediaFiles.forEach((media, index) => {
            if (media.type === 'image') {
                mediaHtml += `
                    <div class="media-card bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div class="relative group">
                            <img src="${media.url}" alt="Review Image ${index + 1}" 
                                 class="w-full h-48 object-cover cursor-pointer" 
                                 onclick="window.open('${media.url}', '_blank')"
                                 onerror="this.src='https://via.placeholder.com/400x300?text=Image+Not+Found'">
                            <button onclick="window.open('${media.url}', '_blank')" 
                                    class="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                <i class="fa-solid fa-expand text-xs"></i>
                            </button>
                        </div>
                        <div class="p-2">
                            <p class="text-xs truncate" style="color: #957A54;">${media.name || `Image ${index + 1}`}</p>
                            ${media.size ? `<p class="text-xs" style="color: #957A54;">${this.formatFileSize(media.size)}</p>` : ''}
                        </div>
                    </div>
                `;
            } else if (media.type === 'video') {
                mediaHtml += `
                    <div class="media-card bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <video controls class="w-full h-48 object-cover" preload="metadata">
                            <source src="${media.url}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                        <div class="p-2">
                            <p class="text-xs truncate" style="color: #957A54;">${media.name || `Video ${index + 1}`}</p>
                            ${media.size ? `<p class="text-xs" style="color: #957A54;">${this.formatFileSize(media.size)}</p>` : ''}
                        </div>
                    </div>
                `;
            }
        });
    }
    
    return mediaHtml || '<p class="text-sm text-gray-500 col-span-full">No media available</p>';
}
    
    formatFileSize(bytes) {
        if (!bytes) return '0 KB';
        const mb = bytes / (1024 * 1024);
        if (mb >= 1) {
            return `${mb.toFixed(2)} MB`;
        }
        const kb = bytes / 1024;
        return `${kb.toFixed(2)} KB`;
    }
    
    initializeElements() {
        this.reviewsBody = document.getElementById('reviews-table-body');
        this.statusFilter = document.getElementById('status-filter');
        this.ratingFilter = document.getElementById('rating-filter');
        this.searchInput = document.getElementById('search-review');
        this.selectAllCheckbox = document.getElementById('select-all');
        this.bulkApproveBtn = document.getElementById('bulk-approve-btn');
        this.prevPageBtn = document.getElementById('prev-page');
        this.nextPageBtn = document.getElementById('next-page');
        this.currentPageSpan = document.getElementById('current-page');
        this.paginationInfo = document.getElementById('pagination-info');
        
        // Modal elements
        this.viewModal = document.getElementById('view-review-modal');
        this.replyModal = document.getElementById('reply-modal');
        this.closeViewModal = document.getElementById('close-view-modal');
        this.closeViewModalBtn = document.getElementById('close-view-modal-btn');
        this.closeReplyModal = document.getElementById('close-reply-modal');
        this.cancelReplyBtn = document.getElementById('cancel-reply-btn');
        this.submitReplyBtn = document.getElementById('submit-reply-btn');
    }

    attachEvents() {
        if (this.statusFilter) {
            this.statusFilter.addEventListener('change', () => {
                this.currentFilter.status = this.statusFilter.value;
                this.currentPage = 1;
                this.renderReviews();
            });
        }

        if (this.ratingFilter) {
            this.ratingFilter.addEventListener('change', () => {
                this.currentFilter.rating = this.ratingFilter.value;
                this.currentPage = 1;
                this.renderReviews();
            });
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.currentFilter.search = e.target.value.toLowerCase();
                this.currentPage = 1;
                this.renderReviews();
            });
        }

        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        if (this.bulkApproveBtn) {
            this.bulkApproveBtn.addEventListener('click', () => {
                this.bulkApproveReviews();
            });
        }

        if (this.prevPageBtn) {
            this.prevPageBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderReviews();
                }
            });
        }

        if (this.nextPageBtn) {
            this.nextPageBtn.addEventListener('click', () => {
                const filteredReviews = this.getFilteredReviews();
                const totalPages = Math.ceil(filteredReviews.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderReviews();
                }
            });
        }

        // Modal close events
        if (this.closeViewModal) {
            this.closeViewModal.addEventListener('click', () => this.closeViewModalFn());
            this.closeViewModalBtn.addEventListener('click', () => this.closeViewModalFn());
        }

        if (this.closeReplyModal) {
            this.closeReplyModal.addEventListener('click', () => this.closeReplyModalFn());
            this.cancelReplyBtn.addEventListener('click', () => this.closeReplyModalFn());
        }

        if (this.submitReplyBtn) {
            this.submitReplyBtn.addEventListener('click', () => this.submitReply());
        }

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target === this.viewModal) {
                this.closeViewModalFn();
            }
            if (e.target === this.replyModal) {
                this.closeReplyModalFn();
            }
        });
        
        // Add refresh button listener if exists
        const refreshBtn = document.getElementById('refresh-data-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
    }

    getFilteredReviews() {
        let filtered = [...this.reviews];
        
        // Filter by status
        if (this.currentFilter.status !== 'all') {
            filtered = filtered.filter(review => review.status === this.currentFilter.status);
        }
        
        // Filter by rating
        if (this.currentFilter.rating !== 'all') {
            filtered = filtered.filter(review => review.rating === parseInt(this.currentFilter.rating));
        }
        
        // Filter by search
        if (this.currentFilter.search) {
            filtered = filtered.filter(review => 
                review.productName.toLowerCase().includes(this.currentFilter.search) ||
                review.customerName.toLowerCase().includes(this.currentFilter.search) ||
                (review.title && review.title.toLowerCase().includes(this.currentFilter.search))
            );
        }
        
        return filtered;
    }

    renderReviews() {
        const filteredReviews = this.getFilteredReviews();
        
        if (filteredReviews.length === 0) {
            this.reviewsBody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center">
                        <div class="flex flex-col items-center gap-3">
                            <i class="fa-regular fa-star text-4xl" style="color: #957A54;"></i>
                            <p class="text-gray-500">No reviews found</p>
                            <p class="text-xs text-gray-400">Pull data from backend or add new reviews</p>
                        </div>
                    </td>
                </tr>
            `;
            this.paginationInfo.textContent = `Showing 0 to 0 of 0 results`;
            this.currentPageSpan.textContent = '1';
            if (this.prevPageBtn) this.prevPageBtn.disabled = true;
            if (this.nextPageBtn) this.nextPageBtn.disabled = true;
            return;
        }
        
        const totalPages = Math.ceil(filteredReviews.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentReviews = filteredReviews.slice(startIndex, endIndex);
        
        // Update pagination info
        this.currentPageSpan.textContent = this.currentPage;
        this.paginationInfo.textContent = `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredReviews.length)} of ${filteredReviews.length} results`;
        
        // Disable/enable pagination buttons
        if (this.prevPageBtn) {
            this.prevPageBtn.disabled = this.currentPage === 1;
        }
        if (this.nextPageBtn) {
            this.nextPageBtn.disabled = this.currentPage === totalPages || totalPages === 0;
        }
        
        this.reviewsBody.innerHTML = currentReviews.map(review => `
            <tr class="border-b border-gray-100 hover:bg-[#F8F8EA] transition-colors ${review.flagged ? 'bg-red-50' : ''}">
                <td class="px-6 py-4">
                    <input type="checkbox" class="review-checkbox rounded border-gray-300 text-[#D89F34] focus:ring-[#D89F34]" data-id="${review.id}" ${this.selectedReviews.has(review.id) ? 'checked' : ''}>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <i class="fa-solid fa-box text-gray-400"></i>
                        </div>
                        <span class="text-sm font-medium" style="color: #133F53;">${this.escapeHtml(review.productName)}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div>
                        <p class="text-sm font-medium" style="color: #133F53;">${this.escapeHtml(review.customerName)}</p>
                        <p class="text-xs" style="color: #957A54;">${this.escapeHtml(review.customerEmail)}</p>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-1">
                        ${this.renderStars(review.rating)}
                        <span class="text-sm ml-2" style="color: #957A54;">(${review.rating})</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div>
                        <p class="text-sm font-medium" style="color: #133F53;">${this.escapeHtml(review.title)}</p>
                        <p class="text-sm text-gray-600 truncate max-w-xs">${this.escapeHtml(review.review.substring(0, 80))}${review.review.length > 80 ? '...' : ''}</p>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm" style="color: #957A54;">${this.formatDate(review.date)}</p>
                </td>
                <td class="px-6 py-4">
                    ${this.getStatusBadge(review.status, review.flagged)}
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <button class="view-review-btn p-2 hover:bg-gray-100 rounded-lg transition-colors" data-id="${review.id}" title="View Details">
                            <i class="fa-regular fa-eye" style="color: #957A54;"></i>
                        </button>
                        ${review.status === 'pending' ? `
                            <button class="approve-review-btn p-2 hover:bg-gray-100 rounded-lg transition-colors" data-id="${review.id}" title="Approve">
                                <i class="fa-regular fa-check-circle" style="color: #10B981;"></i>
                            </button>
                        ` : ''}
                        ${review.flagged ? `
                            <button class="clear-flag-btn p-2 hover:bg-gray-100 rounded-lg transition-colors" data-id="${review.id}" title="Clear Flag">
                                <i class="fa-regular fa-flag" style="color: #F59E0B;"></i>
                            </button>
                        ` : ''}
                        <button class="reply-review-btn p-2 hover:bg-gray-100 rounded-lg transition-colors" data-id="${review.id}" title="Reply">
                            <i class="fa-regular fa-reply" style="color: #D89F34;"></i>
                        </button>
                        <button class="delete-review-btn p-2 hover:bg-red-50 rounded-lg transition-colors" data-id="${review.id}" title="Delete">
                            <i class="fa-regular fa-trash-can" style="color: #EF4444;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Attach event listeners to action buttons
        this.attachActionListeners();
        
        // Attach checkbox listeners
        document.querySelectorAll('.review-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    this.selectedReviews.add(id);
                } else {
                    this.selectedReviews.delete(id);
                }
                this.updateSelectAllCheckbox();
            });
        });
    }
    
    attachActionListeners() {
        // View review
        document.querySelectorAll('.view-review-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                this.viewReview(id);
            });
        });
        
        // Approve review
        document.querySelectorAll('.approve-review-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                this.approveReview(id);
            });
        });
        
        // Clear flag
        document.querySelectorAll('.clear-flag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                this.clearFlag(id);
            });
        });
        
        // Reply to review
        document.querySelectorAll('.reply-review-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                this.openReplyModal(id);
            });
        });
        
        // Delete review
        document.querySelectorAll('.delete-review-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                this.deleteReview(id);
            });
        });
    }
    
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fa-solid fa-star text-sm" style="color: #D89F34;"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fa-solid fa-star-half-alt text-sm" style="color: #D89F34;"></i>';
        }
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="fa-regular fa-star text-sm" style="color: #D89F34;"></i>';
        }
        
        return stars;
    }
    
    getStatusBadge(status, flagged) {
        if (flagged) {
            return '<span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Flagged</span>';
        }
        switch(status) {
            case 'approved':
                return '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Approved</span>';
            case 'pending':
                return '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending</span>';
            default:
                return '<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Unknown</span>';
        }
    }
    
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                return `${diffMinutes} minutes ago`;
            }
            return `${diffHours} hours ago`;
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }
    
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    updateSelectAllCheckbox() {
        const checkboxes = document.querySelectorAll('.review-checkbox');
        const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.checked = allChecked;
            this.selectAllCheckbox.indeterminate = !allChecked && Array.from(checkboxes).some(cb => cb.checked);
        }
    }
    
    toggleSelectAll(checked) {
        document.querySelectorAll('.review-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
            const id = parseInt(checkbox.dataset.id);
            if (checked) {
                this.selectedReviews.add(id);
            } else {
                this.selectedReviews.delete(id);
            }
        });
    }
    
    closeViewModalFn() {
        this.viewModal.classList.add('hidden');
        this.viewModal.classList.remove('flex');
        document.body.style.overflow = '';
    }
    
    openReplyModal(id) {
        const review = this.reviews.find(r => r.id === id);
        if (review) {
            this.currentReplyReviewId = id;
            const productInfoSpan = document.querySelector('#reply-product-info span');
            if (productInfoSpan) {
                productInfoSpan.textContent = review.productName;
            }
            document.getElementById('reply-content').value = '';
            this.replyModal.classList.remove('hidden');
            this.replyModal.classList.add('flex');
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeReplyModalFn() {
        this.replyModal.classList.add('hidden');
        this.replyModal.classList.remove('flex');
        document.body.style.overflow = '';
        this.currentReplyReviewId = null;
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 animate-slideIn`;
        
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            info: '#3B82F6'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.style.color = 'white';
        
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fa-${type === 'success' ? 'regular fa-circle-check' : type === 'error' ? 'solid fa-circle-exclamation' : 'solid fa-circle-info'}"></i>
                <span class="text-sm">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the Product Review Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.productReviewManager = new ProductReviewManager();
});