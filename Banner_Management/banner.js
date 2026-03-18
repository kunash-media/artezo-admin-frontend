  // Sample banner data with new structure
        let banners = [
            // Home Page - Hero Section banners
            {
                id: '1',
                title: 'Summer Sale 2024',
                description: 'Get up to 50% off on summer collection',
                pageName: 'home_hero',
                slot: 'slider1_main',
                slotLabel: 'Hero Slider 1 – Main Banner',
                image: 'https://via.placeholder.com/1920x600/133F53/FFFFFF?text=Summer+Sale+Main',
                link: '/summer-sale',
                buttonText: 'Shop Now',
                isActive: true,
                showTitle: true,
                showButton: true,
                autoplay: true,
                clicks: 3450,
                views: 25000,
                createdAt: '2024-05-15'
            },
            {
                id: '2',
                title: 'New Arrivals',
                description: 'Check out our latest products',
                pageName: 'home_hero',
                slot: 'slider1_sub1',
                slotLabel: 'Hero Slider 1 – Sub Banner 1',
                image: 'https://via.placeholder.com/600x400/D89F34/FFFFFF?text=New+Arrivals+Sub1',
                link: '/new-arrivals',
                buttonText: 'Explore',
                isActive: true,
                showTitle: true,
                showButton: true,
                autoplay: false,
                clicks: 5678,
                views: 45000,
                createdAt: '2024-01-01'
            },
            {
                id: '3',
                title: 'Flash Sale',
                description: 'Limited time offers',
                pageName: 'home_hero',
                slot: 'slider1_sub2',
                slotLabel: 'Hero Slider 1 – Sub Banner 2',
                image: 'https://via.placeholder.com/600x400/957A54/FFFFFF?text=Flash+Sale+Sub2',
                link: '/flash-sale',
                buttonText: 'Grab Deal',
                isActive: false,
                showTitle: true,
                showButton: true,
                autoplay: true,
                clicks: 2345,
                views: 15000,
                createdAt: '2024-03-10'
            },
            // Home Page - Banner Section
            {
                id: '4',
                title: 'Free Shipping',
                description: 'Free shipping on orders over $50',
                pageName: 'home_banner',
                slot: 'left_banner',
                slotLabel: 'Left Banner',
                image: 'https://via.placeholder.com/800x400/133F53/FFFFFF?text=Free+Shipping+Left',
                link: '/shipping-info',
                buttonText: 'Learn More',
                isActive: true,
                showTitle: true,
                showButton: true,
                autoplay: false,
                clicks: 1234,
                views: 10000,
                createdAt: '2024-01-01'
            },
            {
                id: '5',
                title: 'Holiday Special',
                description: 'Christmas and New Year deals',
                pageName: 'home_banner',
                slot: 'right_banner',
                slotLabel: 'Right Banner',
                image: 'https://via.placeholder.com/800x400/D89F34/FFFFFF?text=Holiday+Special+Right',
                link: '/holiday-sale',
                buttonText: 'Shop Holiday',
                isActive: true,
                showTitle: true,
                showButton: true,
                autoplay: true,
                clicks: 890,
                views: 5000,
                createdAt: '2024-11-15'
            },
            // Home Page - Deals Section
            {
                id: '6',
                title: 'Weekly Deals',
                description: 'Special offers this week',
                pageName: 'home_deals',
                slot: 'deals_banner',
                slotLabel: 'Deals Banner',
                image: 'https://via.placeholder.com/1200x300/133F53/FFFFFF?text=Weekly+Deals',
                link: '/deals',
                buttonText: 'View Deals',
                isActive: true,
                showTitle: true,
                showButton: true,
                autoplay: false,
                clicks: 4567,
                views: 30000,
                createdAt: '2024-02-15'
            },
            // Corporate Gifting Page
            {
                id: '7',
                title: 'Corporate Gifting',
                description: 'Premium corporate gifts for employees, clients & events',
                pageName: 'corporate_gifting',
                slot: 'hero_banner',
                slotLabel: 'Hero Banner',
                image: 'https://via.placeholder.com/1920x600/133F53/FFFFFF?text=Corporate+Gifting',
                link: '/corporate-gifting',
                buttonText: 'Explore',
                isActive: true,
                showTitle: true,
                showButton: true,
                autoplay: false,
                clicks: 678,
                views: 3500,
                createdAt: '2024-06-20'
            }
        ];

        // State variables
        let currentFilter = 'all';
        let currentPageNameFilter = 'all';
        let selectedBanners = new Set();
        let currentPage = 1;
        const itemsPerPage = 10;
        let deleteId = null;
        let currentEditId = null;
        let isFilterDropdownOpen = false;
        let searchTimeout = null;
        const DEBOUNCE_DELAY = 500;

        // ==================== PAGE LOAD OPTIMIZATION ====================
        document.addEventListener('DOMContentLoaded', function () {
            // Show skeleton, hide actual content
            document.getElementById('skeletonLoader').classList.remove('content-hidden');
            document.getElementById('skeletonLoader').classList.add('content-visible');
            document.getElementById('actualContent').classList.remove('content-visible');
            document.getElementById('actualContent').classList.add('content-hidden');

            // Initialize filter dropdown
            currentFilter = 'all';
            document.getElementById('selectedFilterText').textContent = 'All Banners';
            updateDropdownCheckmarks();

            // Load data
            loadData();

            // Check user role from role-config.js
            checkUserRole();
        });

        // Check user role and adjust UI accordingly
        function checkUserRole() {
            const userRole = 'admin'; // Default to admin for now
            
            if (userRole === 'viewer') {
                document.querySelectorAll('.edit-btn, .delete-btn, .position-btn').forEach(btn => {
                    btn.style.display = 'none';
                });
                document.querySelector('button[onclick="openCreateBannerModal()"]').style.display = 'none';
                document.querySelector('button[onclick="exportBanners()"]').style.display = 'none';
            } else if (userRole === 'editor') {
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.style.display = 'none';
                });
            }
        }

        async function loadData() {
            try {
                await new Promise(resolve => setTimeout(resolve, 800));
                renderBanners();

                document.getElementById('skeletonLoader').classList.remove('content-visible');
                document.getElementById('skeletonLoader').classList.add('content-hidden');
                document.getElementById('actualContent').classList.remove('content-hidden');
                document.getElementById('actualContent').classList.add('content-visible');
            } catch (error) {
                console.error('Error loading data:', error);
                showNotification('Error loading banners', 'error');
            }
        }

        // ==================== RENDER FUNCTIONS ====================
        function renderBanners() {
            const tbody = document.getElementById('bannersTableBody');
            if (!tbody) return;

            let filteredBanners = filterBannersByStatus();

            // Apply page name filter
            if (currentPageNameFilter !== 'all') {
                filteredBanners = filteredBanners.filter(banner => banner.pageName === currentPageNameFilter);
            }

            // Apply search filter
            const searchTerm = document.getElementById('searchBanner')?.value.toLowerCase() || '';
            if (searchTerm) {
                filteredBanners = filteredBanners.filter(banner =>
                    banner.title.toLowerCase().includes(searchTerm) ||
                    banner.description.toLowerCase().includes(searchTerm) ||
                    (banner.slotLabel && banner.slotLabel.toLowerCase().includes(searchTerm))
                );
            }

            // Apply sorting
            const sortBy = document.getElementById('sortBanners')?.value || 'position';
            filteredBanners = sortBannersData(filteredBanners, sortBy);

            // Pagination
            const totalPages = Math.ceil(filteredBanners.length / itemsPerPage);
            if (currentPage > totalPages) currentPage = 1;

            const start = (currentPage - 1) * itemsPerPage;
            const paginatedBanners = filteredBanners.slice(start, start + itemsPerPage);

            document.getElementById('showingInfo').textContent =
                `Showing ${start + 1}-${Math.min(start + itemsPerPage, filteredBanners.length)} of ${filteredBanners.length} banners`;

            tbody.innerHTML = '';
            paginatedBanners.forEach((banner, index) => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-100 banner-row';
                row.draggable = true;
                row.setAttribute('data-id', banner.id);
                
                row.innerHTML = `
                    <td class="py-2 px-4">
                        <input type="checkbox" class="banner-checkbox" value="${banner.id}" onchange="updateSelection(this)">
                    </td>
                    <td class="py-2 px-4">
                        <img src="${banner.image}" alt="${banner.title}" class="banner-preview" onerror="this.src='https://via.placeholder.com/80x50/e5e7eb/9CA3AF?text=No+Image'">
                    </td>
                    <td class="py-2 px-4">
                        <div>
                            <p class="text-sm font-medium" style="color: #133F53;">${banner.title}</p>
                            <p class="text-xs" style="color: #957A54;">${banner.description.substring(0, 30)}${banner.description.length > 30 ? '...' : ''}</p>
                            <p class="text-xs text-gray-400">Created: ${formatDate(banner.createdAt)}</p>
                        </div>
                    </td>
                    <td class="py-2 px-4">
                        <p class="text-sm">${getPageNameLabel(banner.pageName)}</p>
                    </td>
                    <td class="py-2 px-4">
                        <p class="text-sm">${banner.slotLabel || banner.slot}</p>
                    </td>
                    <td class="py-2 px-4 text-sm">${banner.clicks.toLocaleString()}</td>
                    <td class="py-2 px-4 text-sm">${((banner.clicks / banner.views) * 100).toFixed(1)}%</td>
                    <td class="py-2 px-4">${getStatusBadge(banner)}</td>
                    <td class="py-2 px-4">
                        <div class="flex gap-2">
                            <button onclick="viewBanner('${banner.id}')" class="text-[#957A54] hover:text-[#133F53]" title="View">
                                <i class="fa-regular fa-eye"></i>
                            </button>
                            <button onclick="editBanner('${banner.id}')" class="text-[#957A54] hover:text-[#D89F34] edit-btn" title="Edit">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button onclick="openDeleteModal('${banner.id}')" class="text-[#957A54] hover:text-red-600 delete-btn" title="Delete">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                            <button onclick="duplicateBanner('${banner.id}')" class="text-[#957A54] hover:text-[#133F53]" title="Duplicate">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });

            updatePaginationButtons(filteredBanners.length);
            updateSelectAll();
        }

        function getPageNameLabel(pageName) {
            const labels = {
                'home_hero': 'Home Hero',
                'home_banner': 'Home Banner',
                'home_deals': 'Home Deals',
                'photo_frames': 'Photo Frames',
                'wall_decor': 'Wall Decor',
                'home_decor': 'Home Decor',
                'nameplates': 'Nameplates',
                'corporate_gifting': 'Corporate Gifting',
                'personalised_gifts': 'Personalised Gifts',
                'trophies': 'Trophies',
                'trending': 'Trending'
            };
            return labels[pageName] || pageName;
        }

        function getStatusBadge(banner) {
            if (!banner.isActive) {
                return '<span class="status-badge" style="background-color: #FEE2E2; color: #991B1B;"><i class="fa-regular fa-circle-xmark"></i> Inactive</span>';
            } else {
                return '<span class="status-badge" style="background-color: #D1FAE5; color: #065F46;"><i class="fa-regular fa-circle-check"></i> Active</span>';
            }
        }

        function formatDate(dateStr) {
            return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        function filterBannersByStatus() {
            if (currentFilter === 'all') return banners;
            return banners.filter(banner => {
                if (currentFilter === 'active') return banner.isActive;
                if (currentFilter === 'inactive') return !banner.isActive;
                return true;
            });
        }

        function sortBannersData(bannersArray, sortBy) {
            const sorted = [...bannersArray];
            switch (sortBy) {
                case 'newest':
                    return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                case 'oldest':
                    return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                case 'clicks-high':
                    return sorted.sort((a, b) => b.clicks - a.clicks);
                case 'name':
                    return sorted.sort((a, b) => a.title.localeCompare(b.title));
                default:
                    return sorted;
            }
        }

        function updatePaginationButtons(totalItems) {
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            for (let i = 1; i <= 5; i++) {
                const btn = document.getElementById(`page${i}`);
                if (btn) {
                    if (i <= totalPages) {
                        btn.style.display = 'block';
                        btn.textContent = i;
                        btn.onclick = () => goToPage(i);
                        btn.className = i === currentPage ?
                            'w-8 h-8 rounded bg-[#133F53] text-white' :
                            'w-8 h-8 rounded border border-gray-200 hover:bg-[#F8F8EA]';
                    } else {
                        btn.style.display = 'none';
                    }
                }
            }
        }

        function goToPage(page) {
            currentPage = page;
            renderBanners();
        }

        function changePage(direction) {
            const filteredBanners = filterBannersByStatus();
            const totalPages = Math.ceil(filteredBanners.length / itemsPerPage);

            if (direction === 'prev' && currentPage > 1) {
                currentPage--;
            } else if (direction === 'next' && currentPage < totalPages) {
                currentPage++;
            }
            renderBanners();
        }

        // ==================== FILTER FUNCTIONS ====================
        function toggleFilterDropdown() {
            const dropdown = document.getElementById('filterDropdown');
            const arrow = document.getElementById('filterDropdownArrow');
            isFilterDropdownOpen = !isFilterDropdownOpen;
            dropdown.classList.toggle('hidden');
            arrow.style.transform = isFilterDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)';
        }

        function selectFilter(filterValue, filterText) {
            currentFilter = filterValue;
            document.getElementById('selectedFilterText').textContent = filterText;
            toggleFilterDropdown();
            filterBanners();
        }

        function updateDropdownCheckmarks() {
            document.querySelectorAll('.filter-dropdown-item i').forEach(icon => {
                icon.style.display = 'none';
            });
            const checkId = `check-${currentFilter}`;
            const checkIcon = document.getElementById(checkId);
            if (checkIcon) checkIcon.style.display = 'inline-block';
        }

        function filterBanners() {
            currentPage = 1;
            renderBanners();
        }

        function filterByPageName() {
            currentPageNameFilter = document.getElementById('pageNameFilter').value;
            currentPage = 1;
            renderBanners();
        }

        function filterByPageNameQuick(pageName) {
            currentPageNameFilter = pageName;
            document.getElementById('pageNameFilter').value = pageName;
            currentPage = 1;
            renderBanners();
        }

        function clearPageNameFilter() {
            currentPageNameFilter = 'all';
            document.getElementById('pageNameFilter').value = 'all';
            currentPage = 1;
            renderBanners();
        }

        function sortBanners() {
            renderBanners();
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            const dropdown = document.getElementById('filterDropdown');
            const button = document.getElementById('filterDropdownButton');
            const arrow = document.getElementById('filterDropdownArrow');

            if (isFilterDropdownOpen && dropdown && button &&
                !button.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
                arrow.style.transform = 'rotate(0deg)';
                isFilterDropdownOpen = false;
            }
        });

        // ==================== SEARCH FUNCTIONS ====================
        function debounceSearch() {
            const loadingIndicator = document.getElementById('searchLoading');
            if (loadingIndicator) loadingIndicator.classList.remove('hidden');

            if (searchTimeout) clearTimeout(searchTimeout);

            searchTimeout = setTimeout(() => {
                performSearch();
            }, DEBOUNCE_DELAY);
        }

        function performSearch() {
            const loadingIndicator = document.getElementById('searchLoading');
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            currentPage = 1;
            renderBanners();
        }

        // ==================== DYNAMIC UPLOAD SECTION ====================
        function handlePageNameChange() {
            const pageName = document.getElementById('bannerPageName').value;
            const container = document.getElementById('bannerUploadContainer');
            
            if (!pageName) {
                container.innerHTML = '<p class="text-sm text-gray-500">Please select a page to configure banner uploads</p>';
                return;
            }

            switch(pageName) {
                case 'home_hero':
                    renderHeroSectionUpload(container);
                    break;
                case 'home_banner':
                    renderBannerSectionUpload(container);
                    break;
                case 'home_deals':
                    renderDealsSectionUpload(container);
                    break;
                default:
                    renderSingleBannerUpload(container, pageName);
            }
        }

        function renderHeroSectionUpload(container) {
            container.innerHTML = `
                <div class="hero-layout-container">
                    <p class="text-xs text-gray-500 mb-3">Home Page Hero Section - 3 Sliders with 3 banners each</p>
                    
                    <!-- Slider 1 -->
                    <div class="slider-container">
                        <div class="slider-title">Slider 1</div>
                        <div class="hero-layout">
                            <div class="main-banner-area">
                                <div class="banner-slot">
                                    <div class="banner-slot-label">Main Banner (Left Side)</div>
                                    ${renderUploadSlot('slider1_main', 'Hero Slider 1 – Main Banner')}
                                </div>
                            </div>
                            <div class="sub-banners-area">
                                <div class="banner-slot">
                                    <div class="banner-slot-label">Sub Banner 1 (Right Top)</div>
                                    ${renderUploadSlot('slider1_sub1', 'Hero Slider 1 – Sub Banner 1')}
                                </div>
                                <div class="banner-slot">
                                    <div class="banner-slot-label">Sub Banner 2 (Right Bottom)</div>
                                    ${renderUploadSlot('slider1_sub2', 'Hero Slider 1 – Sub Banner 2')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Slider 2 -->
                    <div class="slider-container">
                        <div class="slider-title">Slider 2</div>
                        <div class="hero-layout">
                            <div class="main-banner-area">
                                <div class="banner-slot">
                                    <div class="banner-slot-label">Main Banner (Left Side)</div>
                                    ${renderUploadSlot('slider2_main', 'Hero Slider 2 – Main Banner')}
                                </div>
                            </div>
                            <div class="sub-banners-area">
                                <div class="banner-slot">
                                    <div class="banner-slot-label">Sub Banner 1 (Right Top)</div>
                                    ${renderUploadSlot('slider2_sub1', 'Hero Slider 2 – Sub Banner 1')}
                                </div>
                                <div class="banner-slot">
                                    <div class="banner-slot-label">Sub Banner 2 (Right Bottom)</div>
                                    ${renderUploadSlot('slider2_sub2', 'Hero Slider 2 – Sub Banner 2')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Slider 3 -->
                    <div class="slider-container">
                        <div class="slider-title">Slider 3</div>
                        <div class="hero-layout">
                            <div class="main-banner-area">
                                <div class="banner-slot">
                                    <div class="banner-slot-label">Main Banner (Left Side)</div>
                                    ${renderUploadSlot('slider3_main', 'Hero Slider 3 – Main Banner')}
                                </div>
                            </div>
                            <div class="sub-banners-area">
                                <div class="banner-slot">
                                    <div class="banner-slot-label">Sub Banner 1 (Right Top)</div>
                                    ${renderUploadSlot('slider3_sub1', 'Hero Slider 3 – Sub Banner 1')}
                                </div>
                                <div class="banner-slot">
                                    <div class="banner-slot-label">Sub Banner 2 (Right Bottom)</div>
                                    ${renderUploadSlot('slider3_sub2', 'Hero Slider 3 – Sub Banner 2')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderBannerSectionUpload(container) {
            container.innerHTML = `
                <div class="hero-layout-container">
                    <p class="text-xs text-gray-500 mb-3">Home Page Banner Section - 2 Banners</p>
                    <div class="two-column-layout">
                        <div class="banner-slot">
                            <div class="banner-slot-label">Left Banner</div>
                            ${renderUploadSlot('left_banner', 'Left Banner')}
                        </div>
                        <div class="banner-slot">
                            <div class="banner-slot-label">Right Banner</div>
                            ${renderUploadSlot('right_banner', 'Right Banner')}
                        </div>
                    </div>
                </div>
            `;
        }

        function renderDealsSectionUpload(container) {
            container.innerHTML = `
                <div class="hero-layout-container">
                    <p class="text-xs text-gray-500 mb-3">Home Page Deals Section - 1 Banner</p>
                    <div class="single-banner-layout">
                        <div class="banner-slot">
                            <div class="banner-slot-label">Deals Banner</div>
                            ${renderUploadSlot('deals_banner', 'Deals Banner')}
                        </div>
                    </div>
                </div>
            `;
        }

        function renderSingleBannerUpload(container, pageName) {
            const pageLabels = {
                'photo_frames': 'Photo Frames',
                'wall_decor': 'Wall Decor',
                'home_decor': 'Home Decor',
                'nameplates': 'Nameplates',
                'corporate_gifting': 'Corporate Gifting',
                'personalised_gifts': 'Personalised Gifts',
                'trophies': 'Trophies and Mementos',
                'trending': 'Trending Products'
            };

            container.innerHTML = `
                <div class="hero-layout-container">
                    <p class="text-xs text-gray-500 mb-3">${pageLabels[pageName] || pageName} Page - Hero Banner</p>
                    <div class="single-banner-layout">
                        <div class="banner-slot">
                            <div class="banner-slot-label">Hero Banner</div>
                            ${renderUploadSlot('hero_banner', 'Hero Banner')}
                        </div>
                    </div>
                </div>
            `;
        }

        function renderUploadSlot(slotName, slotLabel) {
            const slotId = `banner_${slotName}`;
            const previewId = `preview_${slotName}`;
            
            return `
                <div class="upload-slot">
                    <input type="hidden" class="slot-name" value="${slotName}">
                    <input type="hidden" class="slot-label" value="${slotLabel}">
                    <div class="upload-area p-3 rounded-lg text-center cursor-pointer"
                        onclick="document.getElementById('${slotId}').click()"
                        ondragover="handleDragOver(event)"
                        ondragleave="handleDragLeave(event)"
                        ondrop="handleDrop(event, '${slotName}')">
                        <input type="file" id="${slotId}" accept="image/*" class="hidden" onchange="previewSlotImage(this, '${previewId}')">
                        <div id="${previewId}-placeholder">
                            <i class="fa-solid fa-cloud-upload-alt text-xl mb-1" style="color: #957A54;"></i>
                            <p class="text-xs" style="color: #133F53;">Click to upload</p>
                            <p class="text-xs text-gray-400">Recommended: 1920 x 600px</p>
                        </div>
                        <img id="${previewId}" class="hidden max-h-20 mx-auto rounded">
                    </div>
                </div>
            `;
        }

        function previewSlotImage(input, previewId) {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const preview = document.getElementById(previewId);
                    const placeholder = document.getElementById(previewId + '-placeholder');
                    preview.src = e.target.result;
                    preview.classList.remove('hidden');
                    if (placeholder) placeholder.classList.add('hidden');
                }
                reader.readAsDataURL(input.files[0]);
            }
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.currentTarget.classList.add('dragover');
        }

        function handleDragLeave(e) {
            e.currentTarget.classList.remove('dragover');
        }

        function handleDrop(e, slotName) {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const input = document.getElementById(`banner_${slotName}`);
                input.files = files;
                previewSlotImage(input, `preview_${slotName}`);
            }
        }

        // ==================== MODAL FUNCTIONS ====================
        function openCreateBannerModal() {
            currentEditId = null;
            document.getElementById('modalTitle').textContent = 'Create New Banner';
            document.getElementById('bannerId').value = '';
            document.getElementById('bannerForm').reset();
            document.getElementById('bannerPageName').value = '';
            document.getElementById('bannerUploadContainer').innerHTML = '<p class="text-sm text-gray-500">Please select a page to configure banner uploads</p>';
            document.getElementById('isActive').checked = true;
            document.getElementById('showTitle').checked = true;
            document.getElementById('showButton').checked = true;

            document.getElementById('bannerModal').classList.remove('hidden');
            document.getElementById('bannerModal').classList.add('flex');
        }

        function editBanner(id) {
            const banner = banners.find(b => b.id === id);
            if (!banner) return;

            currentEditId = id;
            document.getElementById('modalTitle').textContent = 'Edit Banner';
            document.getElementById('bannerId').value = banner.id;
            document.getElementById('bannerTitle').value = banner.title;
            document.getElementById('bannerDescription').value = banner.description;
            document.getElementById('bannerPageName').value = banner.pageName;
            document.getElementById('isActive').checked = banner.isActive;
            document.getElementById('showTitle').checked = banner.showTitle;
            document.getElementById('showButton').checked = banner.showButton;
            document.getElementById('autoplay').checked = banner.autoplay || false;

            // Render the appropriate upload section and set preview
            handlePageNameChange();
            
            // Set preview image for the specific slot
            setTimeout(() => {
                const previewId = `preview_${banner.slot}`;
                const preview = document.getElementById(previewId);
                if (preview) {
                    preview.src = banner.image;
                    preview.classList.remove('hidden');
                    const placeholder = document.getElementById(previewId + '-placeholder');
                    if (placeholder) placeholder.classList.add('hidden');
                }
            }, 100);

            document.getElementById('bannerModal').classList.remove('hidden');
            document.getElementById('bannerModal').classList.add('flex');
        }

        function closeBannerModal() {
            document.getElementById('bannerModal').classList.add('hidden');
            document.getElementById('bannerModal').classList.remove('flex');
            document.getElementById('bannerForm').reset();
        }

        function viewBanner(id) {
            const banner = banners.find(b => b.id === id);
            if (!banner) return;

            const modal = document.getElementById('viewBannerModal');
            const details = document.getElementById('bannerDetails');

            details.innerHTML = `
                <div class="space-y-4">
                    <div class="flex justify-between items-center pb-2 border-b">
                        <span class="text-sm font-medium" style="color: #133F53;">Banner Information</span>
                        ${getStatusBadge(banner)}
                    </div>
                    
                    <!-- Banner Preview -->
                    <div>
                        <p class="text-xs font-medium mb-2" style="color: #957A54;">Banner Preview</p>
                        <img src="${banner.image}" class="w-full h-40 object-cover rounded border" onerror="this.src='https://via.placeholder.com/300x100/e5e7eb/9CA3AF?text=No+Image'">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <p class="text-xs" style="color: #957A54;">Title</p>
                            <p class="text-sm font-medium" style="color: #133F53;">${banner.title}</p>
                        </div>
                        <div>
                            <p class="text-xs" style="color: #957A54;">Page</p>
                            <p class="text-sm">${getPageNameLabel(banner.pageName)}</p>
                        </div>
                        <div>
                            <p class="text-xs" style="color: #957A54;">Slot</p>
                            <p class="text-sm">${banner.slotLabel || banner.slot}</p>
                        </div>
                        <div class="col-span-2">
                            <p class="text-xs" style="color: #957A54;">Description</p>
                            <p class="text-sm">${banner.description}</p>
                        </div>
                        <div>
                            <p class="text-xs" style="color: #957A54;">Link URL</p>
                            <p class="text-sm truncate"><a href="${banner.link}" target="_blank" class="text-blue-600 hover:underline">${banner.link}</a></p>
                        </div>
                        <div>
                            <p class="text-xs" style="color: #957A54;">Button Text</p>
                            <p class="text-sm">${banner.buttonText}</p>
                        </div>
                        <div>
                            <p class="text-xs" style="color: #957A54;">Clicks / Views</p>
                            <p class="text-sm">${banner.clicks.toLocaleString()} / ${banner.views.toLocaleString()}</p>
                        </div>
                        <div>
                            <p class="text-xs" style="color: #957A54;">CTR</p>
                            <p class="text-sm">${((banner.clicks / banner.views) * 100).toFixed(2)}%</p>
                        </div>
                        <div>
                            <p class="text-xs" style="color: #957A54;">Created On</p>
                            <p class="text-sm">${formatDate(banner.createdAt)}</p>
                        </div>
                    </div>
                    
                    <div class="flex gap-4 pt-2 border-t">
                        <div>
                            <p class="text-xs" style="color: #957A54;">Show Title</p>
                            <p class="text-sm">${banner.showTitle ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                            <p class="text-xs" style="color: #957A54;">Show Button</p>
                            <p class="text-sm">${banner.showButton ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                            <p class="text-xs" style="color: #957A54;">Autoplay</p>
                            <p class="text-sm">${banner.autoplay ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                </div>
            `;

            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        function closeViewBannerModal() {
            document.getElementById('viewBannerModal').classList.add('hidden');
            document.getElementById('viewBannerModal').classList.remove('flex');
        }

        // ==================== SAVE BANNER ====================
        function saveBanner(event) {
            event.preventDefault();

            const pageName = document.getElementById('bannerPageName').value;
            if (!pageName) {
                showNotification('Please select a page', 'error');
                return;
            }

            // Collect all banner uploads based on page type
            const bannerData = [];
            const uploadSlots = document.querySelectorAll('.upload-slot');

            uploadSlots.forEach((slot, index) => {
                const slotName = slot.querySelector('.slot-name')?.value;
                const slotLabel = slot.querySelector('.slot-label')?.value;
                const fileInput = slot.querySelector('input[type="file"]');
                const preview = slot.querySelector('img');

                if (preview && preview.src && !preview.src.includes('placeholder')) {
                    const bannerId = currentEditId && index === 0 ? currentEditId : `${Date.now()}_${index}`;
                    
                    bannerData.push({
                        id: bannerId,
                        title: document.getElementById('bannerTitle').value,
                        description: document.getElementById('bannerDescription').value,
                        pageName: pageName,
                        slot: slotName || 'unknown',
                        slotLabel: slotLabel || 'Unknown Slot',
                        image: preview.src,
                        link: '#',
                        buttonText: 'Shop Now',
                        isActive: document.getElementById('isActive').checked,
                        showTitle: document.getElementById('showTitle').checked,
                        showButton: document.getElementById('showButton').checked,
                        autoplay: document.getElementById('autoplay').checked,
                        clicks: 0,
                        views: 0,
                        createdAt: new Date().toISOString().split('T')[0]
                    });
                }
            });

            if (bannerData.length === 0) {
                showNotification('Please upload at least one banner image', 'error');
                return;
            }

            if (currentEditId) {
                // Update existing banner
                const index = banners.findIndex(b => b.id === currentEditId);
                if (index !== -1) {
                    banners[index] = { ...banners[index], ...bannerData[0] };
                }
                showNotification('Banner updated successfully!', 'success');
            } else {
                // Add new banners
                banners.push(...bannerData);
                showNotification(`${bannerData.length} banner(s) created successfully!`, 'success');
            }

            closeBannerModal();
            renderBanners();
        }

        // ==================== DELETE FUNCTIONS ====================
        function openDeleteModal(id) {
            deleteId = id;
            document.getElementById('deleteModal').classList.remove('hidden');
            document.getElementById('deleteModal').classList.add('flex');
        }

        function closeDeleteModal() {
            deleteId = null;
            document.getElementById('deleteModal').classList.add('hidden');
            document.getElementById('deleteModal').classList.remove('flex');
        }

        function confirmDelete() {
            if (deleteId) {
                banners = banners.filter(b => b.id !== deleteId);
                renderBanners();
                showNotification('Banner deleted successfully', 'success');
            }
            closeDeleteModal();
        }

        // ==================== SELECTION FUNCTIONS ====================
        function toggleAll() {
            const selectAll = document.getElementById('selectAll');
            const checkboxes = document.querySelectorAll('.banner-checkbox');

            checkboxes.forEach(cb => {
                cb.checked = selectAll.checked;
                if (selectAll.checked) {
                    selectedBanners.add(cb.value);
                } else {
                    selectedBanners.delete(cb.value);
                }
            });

            updateBulkActions();
            updateSelectAll();
        }

        function updateSelection(checkbox) {
            if (checkbox.checked) {
                selectedBanners.add(checkbox.value);
            } else {
                selectedBanners.delete(checkbox.value);
            }

            updateSelectAll();
            updateBulkActions();
        }

        function updateSelectAll() {
            const selectAll = document.getElementById('selectAll');
            const checkboxes = document.querySelectorAll('.banner-checkbox');

            if (selectAll) {
                selectAll.checked = checkboxes.length > 0 &&
                    Array.from(checkboxes).every(cb => cb.checked);
                selectAll.indeterminate = !selectAll.checked &&
                    Array.from(checkboxes).some(cb => cb.checked);
            }
        }

        function updateBulkActions() {
            const bulkActions = document.getElementById('bulkActions');
            const selectedCount = document.getElementById('selectedCount');

            if (selectedBanners.size > 0) {
                bulkActions.classList.remove('hidden');
                selectedCount.textContent = `${selectedBanners.size} selected`;
            } else {
                bulkActions.classList.add('hidden');
            }
        }

        function clearSelection() {
            selectedBanners.clear();
            document.querySelectorAll('.banner-checkbox').forEach(cb => cb.checked = false);
            document.getElementById('selectAll').checked = false;
            updateBulkActions();
        }

        function bulkDelete() {
            if (selectedBanners.size === 0) return;

            if (confirm(`Delete ${selectedBanners.size} selected banners?`)) {
                banners = banners.filter(banner => !selectedBanners.has(banner.id));
                clearSelection();
                renderBanners();
                showNotification('Banners deleted successfully', 'success');
            }
        }

        // ==================== EXPORT FUNCTION ====================
        function exportBanners() {
            const headers = ['Title', 'Description', 'Page', 'Slot', 'Link', 'Clicks', 'Views', 'Status'];
            const csvRows = [];

            csvRows.push(headers.join(','));

            banners.forEach(banner => {
                const row = [
                    `"${banner.title}"`,
                    `"${banner.description}"`,
                    getPageNameLabel(banner.pageName),
                    `"${banner.slotLabel || banner.slot}"`,
                    `"${banner.link}"`,
                    banner.clicks,
                    banner.views,
                    banner.isActive ? 'Active' : 'Inactive'
                ];
                csvRows.push(row.join(','));
            });

            const csv = csvRows.join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `banners_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();

            showNotification('Banners exported successfully', 'success');
        }

        function duplicateBanner(id) {
            const banner = banners.find(b => b.id === id);
            if (!banner) return;

            const newBanner = {
                ...banner,
                id: String(Date.now()),
                title: `${banner.title} (Copy)`,
                clicks: 0,
                views: 0,
                createdAt: new Date().toISOString().split('T')[0]
            };

            banners.push(newBanner);
            renderBanners();
            showNotification('Banner duplicated successfully', 'success');
        }

        // ==================== NOTIFICATION FUNCTION ====================
        function showNotification(message, type = 'info') {
            const notification = document.getElementById('notification');
            const icon = document.getElementById('notificationIcon');
            const messageEl = document.getElementById('notificationMessage');

            const colors = {
                success: { bg: '#10B981', icon: 'fa-regular fa-circle-check' },
                error: { bg: '#EF4444', icon: 'fa-solid fa-circle-exclamation' },
                info: { bg: '#3B82F6', icon: 'fa-solid fa-circle-info' }
            };

            notification.style.backgroundColor = colors[type].bg;
            notification.style.color = 'white';
            icon.className = colors[type].icon;
            messageEl.textContent = message;

            notification.classList.remove('hidden');

            setTimeout(() => {
                notification.classList.add('hidden');
            }, 3000);
        }

        // ==================== LOAD COMMON COMPONENTS ====================
        document.addEventListener('DOMContentLoaded', function() {
            loadComponent('sidebar-container', '../sidebar.html');
            loadComponent('header-container', '../header.html');
            loadComponent('modals-container', '../modals.html');
            
            setTimeout(() => {
                checkAndReloadIfEmpty('sidebar-container', '/sidebar.html', '../sidebar.html');
                checkAndReloadIfEmpty('header-container', '/header.html', '../header.html');
                checkAndReloadIfEmpty('modals-container', '/modals.html', '../modals.html');
            }, 500);
        });

        function loadComponent(containerId, url) {
            console.log(`Attempting to load ${url} into ${containerId}`);
            
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    if (html.trim().length === 0) {
                        throw new Error('Empty response');
                    }
                    document.getElementById(containerId).innerHTML = html;
                    console.log(`Successfully loaded ${url}`);
                    
                    if (containerId === 'sidebar-container') {
                        setTimeout(highlightActiveMenuItem, 100);
                    }
                    
                    if (containerId === 'modals-container') {
                        setTimeout(initializeModals, 100);
                    }
                })
                .catch(error => {
                    console.error(`Error loading ${url}:`, error);
                    tryAlternativePath(containerId, url);
                });
        }

        function tryAlternativePath(containerId, originalUrl) {
            let alternativeUrl;
            
            if (originalUrl.startsWith('../')) {
                alternativeUrl = originalUrl.substring(2);
            } else {
                alternativeUrl = '../' + originalUrl;
            }
            
            console.log(`Trying alternative path: ${alternativeUrl}`);
            
            fetch(alternativeUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    if (html.trim().length === 0) {
                        throw new Error('Empty response');
                    }
                    document.getElementById(containerId).innerHTML = html;
                    console.log(`Successfully loaded ${alternativeUrl}`);
                })
                .catch(error => {
                    console.error(`Alternative path also failed:`, error);
                    createFallbackComponent(containerId);
                });
        }

        function checkAndReloadIfEmpty(containerId, primaryPath, fallbackPath) {
            const container = document.getElementById(containerId);
            if (container && container.children.length === 0) {
                console.log(`${containerId} is empty, trying to reload with ${primaryPath}`);
                loadComponent(containerId, primaryPath);
            }
        }

        function createFallbackComponent(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            if (containerId === 'sidebar-container') {
                container.innerHTML = `
                    <div class="w-64 bg-white h-screen shadow-lg p-4">
                        <div class="text-center py-4 border-b">
                            <h2 class="text-xl font-bold" style="color: #133F53;">Admin Panel</h2>
                        </div>
                        <ul class="mt-4 space-y-2">
                            <li><a href="../index.html" class="block p-2 rounded hover:bg-[#F8F8EA]" style="color: #133F53;">Dashboard</a></li>
                            <li><a href="../Product_Management/products.html" class="block p-2 rounded hover:bg-[#F8F8EA]" style="color: #133F53;">Product Management</a></li>
                            <li><a href="../Order_Management/orders.html" class="block p-2 rounded hover:bg-[#F8F8EA]" style="color: #133F53;">Order Management</a></li>
                            <li><a href="banner.html" class="block p-2 rounded bg-[#D89F34] text-[#133F53] font-medium">Banner Management</a></li>
                            <li><a href="../User_Management/user.html" class="block p-2 rounded hover:bg-[#F8F8EA]" style="color: #133F53;">User Management</a></li>
                        </ul>
                    </div>
                `;
            } else if (containerId === 'header-container') {
                container.innerHTML = `
                    <header class="bg-white shadow-sm p-4 flex justify-between items-center">
                        <h1 class="text-xl font-semibold" style="color: #133F53;">Banner Management</h1>
                        <div class="flex items-center gap-4">
                            <span class="text-sm" style="color: #957A54;">Admin User</span>
                            <button class="w-8 h-8 rounded-full bg-[#F8F8EA] flex items-center justify-center">
                                <i class="fa-regular fa-user" style="color: #133F53;"></i>
                            </button>
                        </div>
                    </header>
                `;
            } else if (containerId === 'modals-container') {
                container.innerHTML = `
                    <div id="loginModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
                        <div class="bg-white rounded-xl p-6 max-w-md w-full">
                            <h3 class="text-xl font-bold mb-4" style="color: #133F53;">Login</h3>
                            <p class="text-sm text-gray-500">Modal content here</p>
                        </div>
                    </div>
                `;
            }
        }

        function highlightActiveMenuItem() {
            const currentPage = window.location.pathname.split('/').pop() || 'banner.html';
            const menuLinks = document.querySelectorAll('#sidebar-container a');
            
            menuLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && (href.includes(currentPage) || 
                    (currentPage === 'banner.html' && href.includes('banner')))) {
                    link.classList.add('active');
                    link.style.backgroundColor = '#D89F34';
                    link.style.color = '#133F53';
                    
                    const icon = link.querySelector('i');
                    if (icon) {
                        icon.style.color = '#133F53';
                    }
                }
            });
        }

        function initializeModals() {
            const modalTriggers = document.querySelectorAll('[data-modal-target]');
            modalTriggers.forEach(trigger => {
                trigger.addEventListener('click', function(e) {
                    e.preventDefault();
                    const modalId = this.getAttribute('data-modal-target');
                    const modal = document.getElementById(modalId);
                    if (modal) {
                        modal.classList.remove('hidden');
                        modal.classList.add('flex');
                    }
                });
            });

            const closeModalButtons = document.querySelectorAll('[data-modal-close]');
            closeModalButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const modal = this.closest('.fixed');
                    if (modal) {
                        modal.classList.add('hidden');
                        modal.classList.remove('flex');
                    }
                });
            });

            document.querySelectorAll('.fixed').forEach(modal => {
                modal.addEventListener('click', function(e) {
                    if (e.target === this) {
                        this.classList.add('hidden');
                        this.classList.remove('flex');
                    }
                });
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {});
        } else {
            setTimeout(() => {
                loadComponent('sidebar-container', '../sidebar.html');
                loadComponent('header-container', '../header.html');
                loadComponent('modals-container', '../modals.html');
            }, 100);
        }