// Product Review Management System

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
        this.init();
    }

    async init() {
        await this.loadReviews();
        this.initializeElements();
        this.attachEvents();
        this.updateStats();
        this.renderReviews();
    }

    async loadReviews() {
        // Sample review data - in production, this would come from an API
        this.reviews = [
            {
                id: 1,
                productId: 101,
                productName: "Premium Cotton T-Shirt",
                productImage: "/assets/products/tshirt.jpg",
                customerName: "John Doe",
                customerEmail: "john@example.com",
                rating: 5,
                title: "Excellent quality!",
                review: "This t-shirt is absolutely amazing. The fabric is soft, the fit is perfect, and the color is exactly as shown. Highly recommended!",
                date: "2024-03-15T10:30:00",
                status: "approved",
                flagged: false,
                replies: [],
                helpful: 24
            },
            {
                id: 2,
                productId: 102,
                productName: "Leather Wallet",
                productImage: "/assets/products/wallet.jpg",
                customerName: "Sarah Smith",
                customerEmail: "sarah@example.com",
                rating: 4,
                title: "Good quality wallet",
                review: "Nice leather quality, feels premium. Only downside is it's a bit tight for cards initially but will stretch over time.",
                date: "2024-03-14T15:45:00",
                status: "approved",
                flagged: false,
                replies: [],
                helpful: 12
            },
            {
                id: 3,
                productId: 103,
                productName: "Wireless Headphones",
                productImage: "/assets/products/headphones.jpg",
                customerName: "Mike Johnson",
                customerEmail: "mike@example.com",
                rating: 2,
                title: "Disappointed with battery life",
                review: "Sound quality is decent but battery life is nowhere near what was advertised. Lasts only about 8 hours instead of 20.",
                date: "2024-03-13T09:15:00",
                status: "pending",
                flagged: true,
                replies: [],
                helpful: 5
            },
            {
                id: 4,
                productId: 104,
                productName: "Smart Watch",
                productImage: "/assets/products/watch.jpg",
                customerName: "Emily Brown",
                customerEmail: "emily@example.com",
                rating: 5,
                title: "Best purchase ever!",
                review: "This smart watch has everything I needed. Fitness tracking, notifications, and the battery lasts for days. Love it!",
                date: "2024-03-12T14:20:00",
                status: "approved",
                flagged: false,
                replies: [
                    {
                        id: 1,
                        content: "Thank you for your wonderful review! We're glad you love the watch.",
                        adminName: "Admin",
                        date: "2024-03-12T16:30:00"
                    }
                ],
                helpful: 45
            },
            {
                id: 5,
                productId: 101,
                productName: "Premium Cotton T-Shirt",
                productImage: "/assets/products/tshirt.jpg",
                customerName: "David Wilson",
                customerEmail: "david@example.com",
                rating: 3,
                title: "Okay but overpriced",
                review: "The shirt is comfortable but I think it's a bit overpriced for what it is. There are similar quality shirts for less.",
                date: "2024-03-11T11:00:00",
                status: "pending",
                flagged: false,
                replies: [],
                helpful: 8
            },
            {
                id: 6,
                productId: 102,
                productName: "Leather Wallet",
                productImage: "/assets/products/wallet.jpg",
                customerName: "Lisa Anderson",
                customerEmail: "lisa@example.com",
                rating: 5,
                title: "Perfect gift!",
                review: "Bought this as a gift for my husband and he absolutely loves it. The leather is high quality and the stitching is excellent.",
                date: "2024-03-10T16:45:00",
                status: "approved",
                flagged: false,
                replies: [],
                helpful: 18
            },
            {
                id: 7,
                productId: 103,
                productName: "Wireless Headphones",
                productImage: "/assets/products/headphones.jpg",
                customerName: "Robert Taylor",
                customerEmail: "robert@example.com",
                rating: 1,
                title: "Defective product",
                review: "Received a defective unit. The right earbud doesn't work at all. Very disappointed with the quality control.",
                date: "2024-03-09T13:30:00",
                status: "flagged",
                flagged: true,
                replies: [],
                helpful: 3
            },
            {
                id: 8,
                productId: 104,
                productName: "Smart Watch",
                productImage: "/assets/products/watch.jpg",
                customerName: "Jennifer Martinez",
                customerEmail: "jennifer@example.com",
                rating: 4,
                title: "Great features",
                review: "Lots of useful features. The sleep tracking is particularly helpful. Battery could be better though.",
                date: "2024-03-08T10:15:00",
                status: "approved",
                flagged: false,
                replies: [],
                helpful: 22
            },
            {
                id: 9,
                productId: 101,
                productName: "Premium Cotton T-Shirt",
                productImage: "/assets/products/tshirt.jpg",
                customerName: "Kevin Lee",
                customerEmail: "kevin@example.com",
                rating: 4,
                title: "Nice quality",
                review: "Good quality fabric, fits well. Would buy again.",
                date: "2024-03-07T09:45:00",
                status: "pending",
                flagged: false,
                replies: [],
                helpful: 6
            }
        ];

        // Save to localStorage for persistence
        // localStorage.setItem('productReviews', JSON.stringify(this.reviews));
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

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target === this.viewModal) {
                this.closeViewModalFn();
            }
            if (e.target === this.replyModal) {
                this.closeReplyModalFn();
            }
        });
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

    updateStats() {
        const total = this.reviews.length;
        const approved = this.reviews.filter(r => r.status === 'approved').length;
        const pending = this.reviews.filter(r => r.status === 'pending').length;
        const flagged = this.reviews.filter(r => r.flagged).length;
        
        const totalRating = this.reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = total > 0 ? (totalRating / total).toFixed(1) : 0;
        
        document.getElementById('total-reviews').textContent = total;
        document.getElementById('avg-rating').textContent = avgRating;
        document.getElementById('pending-reviews').textContent = pending;
        document.getElementById('flagged-reviews').textContent = flagged;
    }

    renderReviews() {
        const filteredReviews = this.getFilteredReviews();
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
        
        // Render table rows
        if (currentReviews.length === 0) {
            this.reviewsBody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center">
                        <div class="flex flex-col items-center gap-3">
                            <i class="fa-regular fa-star text-4xl" style="color: #957A54;"></i>
                            <p class="text-gray-500">No reviews found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
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
    
    async viewReview(id) {
        const review = this.reviews.find(r => r.id === id);
        if (!review) return;
        
        const content = document.getElementById('review-details-content');
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-start justify-between">
                    <div>
                        <h4 class="font-semibold text-lg" style="color: #133F53;">${this.escapeHtml(review.productName)}</h4>
                        <p class="text-sm" style="color: #957A54;">Product ID: ${review.productId}</p>
                    </div>
                    <div class="flex items-center gap-1">
                        ${this.renderStars(review.rating)}
                    </div>
                </div>
                
                <div class="border-t border-gray-100 pt-4">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-full bg-[#D89F34] bg-opacity-20 flex items-center justify-center">
                            <span class="font-bold" style="color: #D89F34;">${review.customerName.charAt(0)}</span>
                        </div>
                        <div>
                            <p class="font-medium" style="color: #133F53;">${this.escapeHtml(review.customerName)}</p>
                            <p class="text-xs" style="color: #957A54;">${this.escapeHtml(review.customerEmail)} • ${this.formatDate(review.date)}</p>
                        </div>
                    </div>
                    
                    <h5 class="font-semibold mb-2" style="color: #133F53;">${this.escapeHtml(review.title)}</h5>
                    <p class="text-gray-700 leading-relaxed">${this.escapeHtml(review.review)}</p>
                    
                    ${review.replies && review.replies.length > 0 ? `
                        <div class="mt-4 bg-[#F8F8EA] rounded-lg p-4">
                            <p class="text-sm font-semibold mb-2" style="color: #133F53;">
                                <i class="fa-regular fa-reply mr-2"></i>Admin Response
                            </p>
                            ${review.replies.map(reply => `
                                <div class="mb-3 last:mb-0">
                                    <p class="text-sm text-gray-700">${this.escapeHtml(reply.content)}</p>
                                    <p class="text-xs mt-1" style="color: #957A54;">${this.formatDate(reply.date)}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="mt-4 flex items-center gap-4 text-sm" style="color: #957A54;">
                        <span><i class="fa-regular fa-thumbs-up mr-1"></i> ${review.helpful} found this helpful</span>
                    </div>
                </div>
            </div>
        `;
        
        this.viewModal.classList.remove('hidden');
        this.viewModal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
    
    closeViewModalFn() {
        this.viewModal.classList.add('hidden');
        this.viewModal.classList.remove('flex');
        document.body.style.overflow = '';
    }
    
    async approveReview(id) {
        const review = this.reviews.find(r => r.id === id);
        if (review && review.status === 'pending') {
            review.status = 'approved';
            review.flagged = false;
            this.saveReviews();
            this.updateStats();
            this.renderReviews();
            this.showNotification('Review approved successfully', 'success');
        }
    }
    
    async clearFlag(id) {
        const review = this.reviews.find(r => r.id === id);
        if (review) {
            review.flagged = false;
            if (review.status === 'flagged') {
                review.status = 'pending';
            }
            this.saveReviews();
            this.updateStats();
            this.renderReviews();
            this.showNotification('Flag cleared successfully', 'success');
        }
    }
    
    async bulkApproveReviews() {
        if (this.selectedReviews.size === 0) {
            this.showNotification('Please select at least one review to approve', 'error');
            return;
        }
        
        let approvedCount = 0;
        this.selectedReviews.forEach(id => {
            const review = this.reviews.find(r => r.id === id);
            if (review && review.status === 'pending') {
                review.status = 'approved';
                review.flagged = false;
                approvedCount++;
            }
        });
        
        if (approvedCount > 0) {
            this.saveReviews();
            this.selectedReviews.clear();
            this.updateStats();
            this.renderReviews();
            this.showNotification(`${approvedCount} review(s) approved successfully`, 'success');
        } else {
            this.showNotification('No pending reviews selected', 'error');
        }
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
    
    async submitReply() {
        const content = document.getElementById('reply-content').value.trim();
        if (!content) {
            this.showNotification('Please enter a reply', 'error');
            return;
        }
        
        const review = this.reviews.find(r => r.id === this.currentReplyReviewId);
        if (review) {
            if (!review.replies) review.replies = [];
            review.replies.push({
                id: Date.now(),
                content: content,
                adminName: 'Admin',
                date: new Date().toISOString()
            });
            
            this.saveReviews();
            this.closeReplyModalFn();
            this.showNotification('Reply sent successfully', 'success');
            
            // Add notification
            this.addNotification({
                message: `You replied to review from ${review.customerName}`,
                icon: 'fa-reply',
                time: 'Just now'
            });
        }
    }
    
    async deleteReview(id) {
        if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            const index = this.reviews.findIndex(r => r.id === id);
            if (index !== -1) {
                const review = this.reviews[index];
                this.reviews.splice(index, 1);
                this.selectedReviews.delete(id);
                this.saveReviews();
                this.updateStats();
                this.renderReviews();
                this.showNotification('Review deleted successfully', 'success');
            }
        }
    }
    
    // saveReviews() {
    //     localStorage.setItem('productReviews', JSON.stringify(this.reviews));
    // }
    
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
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    addNotification(notification) {
        const notificationList = document.getElementById('notification-list');
        const notificationBadge = document.getElementById('notification-badge');
        
        if (!notificationList) return;
        
        const notificationItem = document.createElement('div');
        notificationItem.className = 'px-4 py-3 hover:bg-[#F8F8EA] transition-colors border-b border-gray-50 notification-item unread';
        
        let currentCount = parseInt(notificationBadge.textContent) || 0;
        
        notificationItem.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-[#D89F34] bg-opacity-20 flex items-center justify-center flex-shrink-0">
                    <i class="fa-regular ${notification.icon || 'fa-bell'} text-sm" style="color: #D89F34;"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm" style="color: #133F53;">${notification.message}</p>
                    <p class="text-xs mt-1" style="color: #957A54;">${notification.time || 'Just now'}</p>
                </div>
                <div class="w-2 h-2 rounded-full bg-[#D89F34] unread-dot"></div>
            </div>
        `;
        
        notificationList.insertBefore(notificationItem, notificationList.firstChild);
        
        currentCount++;
        notificationBadge.textContent = currentCount;
        notificationBadge.classList.remove('hidden');
    }
}

// Initialize the Product Review Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.productReviewManager = new ProductReviewManager();
});