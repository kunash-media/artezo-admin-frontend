// Components.js - Handles sidebar, header and modal functionality

class LayoutComponents {
    constructor() {
        this.sidebar = null;
        this.header = null;
        this.isCollapsed = false;
        this.isMobileOpen = false;
        this.isDropdownOpen = false;
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.loadComponents();
        await this.loadModals();
        this.initializeElements();
        this.attachEvents();
        this.checkActiveLink();
        this.handleResize();
        this.setupDropdown();
        this.setupModals();
        this.setupLogoutModal();
        this.loadUserFromStorage();
        this.setupNotificationModal();
    }

    loadUserFromStorage() {
        try {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                this.updateUserDisplay();
            } else {
                // Check if user was logged in from previous session
                const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
                if (isLoggedIn) {
                    // Try to get user from users array
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const lastLoggedInEmail = localStorage.getItem('lastLoggedInEmail');
                    
                    if (lastLoggedInEmail && users.length > 0) {
                        const user = users.find(u => u.email === lastLoggedInEmail);
                        if (user) {
                            this.currentUser = {
                                name: user.name,
                                email: user.email,
                                initials: user.name.charAt(0).toUpperCase()
                            };
                            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                            this.updateUserDisplay();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading user from storage:', error);
        }
    }

    async loadComponents() {
        try {
            // Check if we're in a subfolder
            const path = window.location.pathname;
            const isInSubfolder = path.includes('/Order_Management/') || path.includes('/Coupon_Management/') || 
                                 path.includes('/User_Management/') || path.includes('/products.html') 
                                 || path.includes("/Banner_Management/") || path.includes('/Inventory_Management/') 
                                 || path.includes("/ProductReview_Management/") || path.includes("/Report_Sales/")
                                 || path.includes("/Contact_Management/");
                        
            // Load sidebar with correct path
            const sidebarPath = isInSubfolder ? '../sidebar.html' : 'sidebar.html';
            const sidebarResponse = await fetch(sidebarPath);
            const sidebarHtml = await sidebarResponse.text();
            document.getElementById('sidebar-container').innerHTML = sidebarHtml;

            // Load header with correct path
            const headerPath = isInSubfolder ? '../header.html' : 'header.html';
            const headerResponse = await fetch(headerPath);
            const headerHtml = await headerResponse.text();
            document.getElementById('header-container').innerHTML = headerHtml;

            document.dispatchEvent(new Event('componentsLoaded'));
        } catch (error) {
            console.error('Error loading components:', error);
            this.loadFallbackContent();
        }
    }

    async loadModals() {
        try {
            // Check if we're in a subfolder
            const path = window.location.pathname;
            const isInSubfolder = path.includes('/Order_Management/') || path.includes('/Coupon_Management/') || 
                                 path.includes('/User_Management/') || path.includes('/products.html') 
                                 || path.includes("/Banner_Management/") || path.includes('/Inventory_Management/') 
                                 || path.includes("/ProductReview_Management/") || path.includes("/Report_Sales/")
                                 || path.includes("/Contact_Management/");
            
            // Load modals with correct path
            const modalsPath = isInSubfolder ? '../modals.html' : 'modals.html';
            const modalsResponse = await fetch(modalsPath);
            const modalsHtml = await modalsResponse.text();
            
            let modalsContainer = document.getElementById('modals-container');
            if (!modalsContainer) {
                modalsContainer = document.createElement('div');
                modalsContainer.id = 'modals-container';
                document.body.appendChild(modalsContainer);
            }
            
            modalsContainer.innerHTML = modalsHtml;
            document.dispatchEvent(new Event('modalsLoaded'));
        } catch (error) {
            console.error('Error loading modals:', error);
        }
    }


    loadFallbackContent() {
        const sidebarContainer = document.getElementById('sidebar-container');
        const headerContainer = document.getElementById('header-container');
        
        if (sidebarContainer) {
            sidebarContainer.innerHTML = `
                <aside class="bg-[#F8F8EA] w-72 h-screen fixed left-0 top-0 p-4">
                    <div class="text-[#133F53] font-bold">E-COMMERCE</div>
                </aside>
            `;
        }
        
        if (headerContainer) {
            headerContainer.innerHTML = `
                <header class="bg-[#F8F8EA] p-4">
                    <h2 class="text-[#133F53]">Dashboard</h2>
                </header>
            `;
        }
    }

    initializeElements() {
        this.sidebar = document.getElementById('sidebar');
        this.collapseBtn = document.getElementById('collapse-btn');
        this.collapseIcon = document.getElementById('collapse-icon');
        this.mobileToggle = document.getElementById('mobile-toggle');
        this.mainContent = document.querySelector('.flex-1');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.pageTitle = document.getElementById('page-title');
    }

    attachEvents() {
        if (this.collapseBtn) {
            this.collapseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSidebar();
            });
        }

        if (this.mobileToggle) {
            this.mobileToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMobileSidebar();
            });
        }

        window.addEventListener('resize', () => {
            this.handleResize();
        });

        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.setActiveLink(link);
                
                if (window.innerWidth <= 1024) {
                    this.toggleMobileSidebar();
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && this.isMobileOpen) {
                if (!this.sidebar.contains(e.target) && !this.mobileToggle.contains(e.target)) {
                    this.toggleMobileSidebar();
                }
            }
        });
    }

    toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
        
        if (this.isCollapsed) {
            this.sidebar.classList.add('sidebar-collapsed');
            this.collapseIcon.classList.remove('fa-chevron-left');
            this.collapseIcon.classList.add('fa-chevron-right');
            this.mainContent.classList.add('main-content-expanded');
            this.mainContent.classList.remove('main-content-normal');
            localStorage.setItem('sidebarCollapsed', 'true');
        } else {
            this.sidebar.classList.remove('sidebar-collapsed');
            this.collapseIcon.classList.remove('fa-chevron-right');
            this.collapseIcon.classList.add('fa-chevron-left');
            this.mainContent.classList.remove('main-content-expanded');
            this.mainContent.classList.add('main-content-normal');
            localStorage.setItem('sidebarCollapsed', 'false');
        }

        window.dispatchEvent(new CustomEvent('sidebarToggle', { 
            detail: { collapsed: this.isCollapsed } 
        }));
    }

    toggleMobileSidebar() {
        this.isMobileOpen = !this.isMobileOpen;
        
        if (this.isMobileOpen) {
            this.sidebar.classList.add('mobile-open');
            document.body.style.overflow = 'hidden';
        } else {
            this.sidebar.classList.remove('mobile-open');
            document.body.style.overflow = '';
        }
    }

    setActiveLink(clickedLink) {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('data-active');
        });
        
        clickedLink.classList.add('active');
        clickedLink.setAttribute('data-active', 'true');
        
        const linkText = clickedLink.querySelector('.nav-text')?.textContent || 'Dashboard';
        if (this.pageTitle) {
            this.pageTitle.textContent = `${linkText} / Overview`;
        }
        
        localStorage.setItem('activeLink', linkText);
    }

    checkActiveLink() {
        const savedActiveLink = localStorage.getItem('activeLink');
        const currentPath = window.location.pathname;
        
        this.navLinks.forEach(link => {
            const linkText = link.querySelector('.nav-text')?.textContent;
            const href = link.getAttribute('href');
            
            if ((currentPath === '/' && linkText === 'Dashboard') || 
                (savedActiveLink && linkText === savedActiveLink) ||
                (href === currentPath)) {
                this.setActiveLink(link);
            }
        });
        
        const savedCollapsed = localStorage.getItem('sidebarCollapsed');
        if (savedCollapsed === 'true') {
            this.isCollapsed = true;
            if (this.sidebar) this.sidebar.classList.add('sidebar-collapsed');
            if (this.collapseIcon) {
                this.collapseIcon.classList.remove('fa-chevron-left');
                this.collapseIcon.classList.add('fa-chevron-right');
            }
            if (this.mainContent) {
                this.mainContent.classList.add('main-content-expanded');
                this.mainContent.classList.remove('main-content-normal');
            }
        }
    }

    setupNotificationModal() {
    const notificationBell = document.getElementById('notification-bell');
    const notificationModal = document.getElementById('notification-modal');
    const markAllReadBtn = document.getElementById('mark-all-read');
    let isNotificationOpen = false;

    if (notificationBell && notificationModal) {
        notificationBell.addEventListener('click', (e) => {
            e.stopPropagation();
            isNotificationOpen = !isNotificationOpen;
            
            if (isNotificationOpen) {
                notificationModal.classList.remove('hidden');
            } else {
                notificationModal.classList.add('hidden');
            }
        });

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (!notificationBell.contains(e.target) && !notificationModal.contains(e.target)) {
                notificationModal.classList.add('hidden');
                isNotificationOpen = false;
            }
        });

        // Mark all as read functionality
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.markAllNotificationsRead();
            });
        }
    }
}

markAllNotificationsRead() {
    const unreadItems = document.querySelectorAll('.notification-item.unread');
    const unreadDots = document.querySelectorAll('.unread-dot');
    const notificationBadge = document.getElementById('notification-badge');
    
    // Remove unread class and hide dots
    unreadItems.forEach(item => {
        item.classList.remove('unread');
    });
    
    unreadDots.forEach(dot => {
        dot.style.display = 'none';
    });
    
    // Update badge count
    if (notificationBadge) {
        notificationBadge.textContent = '0';
        notificationBadge.classList.add('hidden');
    }
    
    this.showNotification('All notifications marked as read', 'success');
}


addNotification(notification) {
    const notificationList = document.getElementById('notification-list');
    const notificationBadge = document.getElementById('notification-badge');
    
    if (!notificationList) return;
    
    const notificationItem = document.createElement('div');
    notificationItem.className = 'px-4 py-3 hover:bg-[#F8F8EA] transition-colors border-b border-gray-50 notification-item unread';
    
    // Get current count
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
    
    // Insert at the beginning
    notificationList.insertBefore(notificationItem, notificationList.firstChild);
    
    // Update badge count
    currentCount++;
    notificationBadge.textContent = currentCount;
    notificationBadge.classList.remove('hidden');
}

    handleResize() {
        if (window.innerWidth <= 1024) {
            if (this.sidebar) this.sidebar.classList.remove('sidebar-collapsed');
            if (this.mainContent) {
                this.mainContent.classList.remove('main-content-expanded', 'main-content-normal');
            }
            
            if (this.isCollapsed) {
                localStorage.setItem('sidebarCollapsed', 'false');
                this.isCollapsed = false;
            }
        } else {
            if (this.isMobileOpen) {
                this.isMobileOpen = false;
                if (this.sidebar) this.sidebar.classList.remove('mobile-open');
                document.body.style.overflow = '';
            }
            
            if (this.mainContent) {
                if (this.isCollapsed) {
                    this.mainContent.classList.add('main-content-expanded');
                    this.mainContent.classList.remove('main-content-normal');
                } else {
                    this.mainContent.classList.remove('main-content-expanded');
                    this.mainContent.classList.add('main-content-normal');
                }
            }
        }
    }

    setupDropdown() {
        const userMenuButton = document.getElementById('user-menu-button');
        const userDropdown = document.getElementById('user-dropdown');
        const dropdownArrow = document.getElementById('dropdown-arrow');

        if (userMenuButton && userDropdown) {
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.isDropdownOpen = !this.isDropdownOpen;
                
                if (this.isDropdownOpen) {
                    userDropdown.classList.remove('hidden');
                    dropdownArrow.style.transform = 'rotate(180deg)';
                } else {
                    userDropdown.classList.add('hidden');
                    dropdownArrow.style.transform = 'rotate(0deg)';
                }
            });

            document.addEventListener('click', (e) => {
                if (!userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.add('hidden');
                    dropdownArrow.style.transform = 'rotate(0deg)';
                    this.isDropdownOpen = false;
                }
            });

            const dropdownItems = document.querySelectorAll('.dropdown-item');
            dropdownItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const action = item.textContent.trim();
                    
                    if (action.includes('Login') || action.includes('Signup')) {
                        this.openModal('login');
                    } else if (action.includes('Logout')) {
                        this.openLogoutModal();
                    }
                    
                    userDropdown.classList.add('hidden');
                    dropdownArrow.style.transform = 'rotate(0deg)';
                    this.isDropdownOpen = false;
                });
            });
        }
    }

    setupModals() {
        setTimeout(() => {
            const loginModal = document.getElementById('login-modal');
            const signupModal = document.getElementById('signup-modal');
            const closeModalBtn = document.getElementById('close-modal');
            const closeSignupBtn = document.getElementById('close-signup-modal');
            const showSignup = document.getElementById('show-signup');
            const showLogin = document.getElementById('show-login');
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');
            const loginBtn = document.getElementById('login-btn');

            if (loginBtn) {
                loginBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openModal('login');
                });
            }

            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', () => {
                    this.closeModal('login');
                });
            }

            if (closeSignupBtn) {
                closeSignupBtn.addEventListener('click', () => {
                    this.closeModal('signup');
                });
            }

            if (showSignup) {
                showSignup.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closeModal('login');
                    this.openModal('signup');
                });
            }

            if (showLogin) {
                showLogin.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closeModal('signup');
                    this.openModal('login');
                });
            }

            window.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    this.closeModal('login');
                }
                if (e.target === signupModal) {
                    this.closeModal('signup');
                }
            });

            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin(e);
                });
            }

            if (signupForm) {
                signupForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSignup(e);
                });
            }
        }, 100);
    }


    

    setupLogoutModal() {
        setTimeout(() => {
            this.logoutModal = document.getElementById('logout-modal');
            this.cancelLogoutBtn = document.getElementById('cancel-logout');
            this.confirmLogoutBtn = document.getElementById('confirm-logout');

            if (this.cancelLogoutBtn) {
                this.cancelLogoutBtn.addEventListener('click', () => {
                    this.closeLogoutModal();
                });
            }

            if (this.confirmLogoutBtn) {
                this.confirmLogoutBtn.addEventListener('click', () => {
                    this.handleLogout();
                });
            }

            window.addEventListener('click', (e) => {
                if (e.target === this.logoutModal) {
                    this.closeLogoutModal();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.logoutModal && !this.logoutModal.classList.contains('hidden')) {
                    this.closeLogoutModal();
                }
            });
        }, 100);
    }

    openModal(type) {
        const loginModal = document.getElementById('login-modal');
        const signupModal = document.getElementById('signup-modal');
        
        if (type === 'login' && loginModal) {
            loginModal.classList.remove('hidden');
            loginModal.classList.add('flex');
            document.body.style.overflow = 'hidden';
        } else if (type === 'signup' && signupModal) {
            signupModal.classList.remove('hidden');
            signupModal.classList.add('flex');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(type) {
        const loginModal = document.getElementById('login-modal');
        const signupModal = document.getElementById('signup-modal');
        
        if (type === 'login' && loginModal) {
            loginModal.classList.add('hidden');
            loginModal.classList.remove('flex');
            document.body.style.overflow = '';
        } else if (type === 'signup' && signupModal) {
            signupModal.classList.add('hidden');
            signupModal.classList.remove('flex');
            document.body.style.overflow = '';
        }
    }

    openLogoutModal() {
        if (this.logoutModal) {
            this.logoutModal.classList.remove('hidden');
            this.logoutModal.classList.add('flex');
            document.body.style.overflow = 'hidden';
        }
    }

    closeLogoutModal() {
        if (this.logoutModal) {
            this.logoutModal.classList.add('hidden');
            this.logoutModal.classList.remove('flex');
            document.body.style.overflow = '';
        }
    }

    handleLogin(e) {
        const form = e.target;
        const email = form.querySelector('input[type="email"]')?.value || '';
        const password = form.querySelector('input[type="password"]')?.value || '';
        
        // Get existing users from localStorage or create empty array
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Find user with matching email and password
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Store user data
            this.currentUser = {
                name: user.name,
                email: user.email,
                initials: user.name.charAt(0).toUpperCase()
            };

            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName', user.name);
            localStorage.setItem('lastLoggedInEmail', user.email);

            // Update display
            this.updateUserDisplay();

            console.log('Login successful for:', user.name);
            this.showNotification(`Welcome back, ${user.name}!`, 'success');
            this.closeModal('login');
        } else {
            this.showNotification('Invalid email or password', 'error');
        }
    }

    handleSignup(e) {
        const form = e.target;
        const fullName = form.querySelector('input[type="text"]')?.value || '';
        const email = form.querySelector('input[type="email"]')?.value || '';
        const password = form.querySelector('input[type="password"]')?.value || '';
        
        if (!fullName || !email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        // Get existing users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if user already exists
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            this.showNotification('User with this email already exists', 'error');
            return;
        }

        // Create new user
        const newUser = {
            name: fullName,
            email: email,
            password: password,
            createdAt: new Date().toISOString()
        };

        // Add to users array
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // Store current user data
        this.currentUser = {
            name: fullName,
            email: email,
            initials: fullName.charAt(0).toUpperCase()
        };

        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', fullName);
        localStorage.setItem('lastLoggedInEmail', email);

        // Update display
        this.updateUserDisplay();

        console.log('Signup successful for:', fullName);
        this.showNotification(`Account created successfully! Welcome, ${fullName}!`, 'success');
        this.closeModal('signup');
    }

    handleLogout() {
    // Clear user data
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.setItem('isLoggedIn', 'false');
    localStorage.removeItem('userName');
    localStorage.removeItem('lastLoggedInEmail');
    
    // Update display to guest
    this.updateUserDisplay();
    
    console.log('Logging out...');
    this.closeLogoutModal();
    this.showNotification('Logged out successfully!', 'info');
    
    // Redirect to index.html after a short delay
    setTimeout(() => {
        window.location.href = '/index.html';
    }, 1000);
}

   updateUserDisplay() {
    // Get all the elements that need updating
    const userMenuButton = document.getElementById('user-menu-button');
    if (!userMenuButton) return;

    // Update the circle with user initial
    const userInitialsDiv = userMenuButton.querySelector('div:first-child');
    // Update the name span
    const userNameSpan = userMenuButton.querySelector('span.text-sm');
    
    // Get dropdown elements
    const userDropdown = document.getElementById('user-dropdown');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (this.currentUser) {
        // Logged in state - update all instances with actual user data
        if (userInitialsDiv) {
            userInitialsDiv.textContent = this.currentUser.initials;
        }
        
        if (userNameSpan) {
            userNameSpan.textContent = this.currentUser.name;
        }
        
        // Update dropdown info
        if (userDropdown) {
            const dropdownName = userDropdown.querySelector('.px-4.py-2 p:first-child');
            const dropdownEmail = userDropdown.querySelector('.px-4.py-2 p:last-child');
            
            if (dropdownName) dropdownName.textContent = this.currentUser.name;
            if (dropdownEmail) dropdownEmail.textContent = this.currentUser.email;
        }
        
        // Hide Login/Signup button and show Logout button
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'flex';
        }
    } else {
        // Guest state
        if (userInitialsDiv) {
            userInitialsDiv.textContent = 'G';
        }
        
        if (userNameSpan) {
            userNameSpan.textContent = 'Guest';
        }
        
        // Update dropdown info
        if (userDropdown) {
            const dropdownName = userDropdown.querySelector('.px-4.py-2 p:first-child');
            const dropdownEmail = userDropdown.querySelector('.px-4.py-2 p:last-child');
            
            if (dropdownName) dropdownName.textContent = 'Guest User';
            if (dropdownEmail) dropdownEmail.textContent = 'guest@email.com';
        }
        
        // Show Login/Signup button and hide Logout button
        if (loginBtn) {
            loginBtn.style.display = 'flex';
        }
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
    }
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
            notification.classList.add('animate-slideOut');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    setPageTitle(title) {
        if (this.pageTitle) {
            this.pageTitle.textContent = title;
        }
    }

    isSidebarCollapsed() {
        return this.isCollapsed;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.layoutComponents = new LayoutComponents();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayoutComponents;
}

// ==================== PAGE LOADER MANAGEMENT ====================

class PageLoader {
    constructor() {
        this.loader = document.getElementById('page-loader');
        this.init();
    }

    init() {
        // Hide loader when page is fully loaded
        this.hideLoaderOnLoad();
        
        // Show loader on navigation clicks
        this.setupNavigationListeners();
        
        // Handle browser back/forward buttons
        this.setupHistoryListeners();
    }

    // Hide loader when page is ready
    hideLoaderOnLoad() {
        // If page is already loaded
        if (document.readyState === 'complete') {
            this.hideLoader();
        } else {
            // Wait for page to load
            window.addEventListener('load', () => {
                this.hideLoader();
            });
        }
    }

    // Show loader function
    showLoader() {
        if (this.loader) {
            this.loader.classList.remove('hidden-loader');
            this.loader.style.opacity = '1';
            this.loader.style.visibility = 'visible';
            document.body.style.overflow = 'hidden'; // Prevent scrolling while loading
        }
    }

    // Hide loader function with smooth fade out
    hideLoader() {
        if (this.loader) {
            // Fade out
            this.loader.style.opacity = '0';
            
            // After fade out, hide completely
            setTimeout(() => {
                this.loader.classList.add('hidden-loader');
                this.loader.style.visibility = 'hidden';
                document.body.style.overflow = ''; // Restore scrolling
            }, 300);
        }
    }

    // Setup listeners for navigation clicks
    setupNavigationListeners() {
        document.addEventListener('click', (e) => {
            // Check if clicked element is a navigation link
            const navLink = e.target.closest('a');
            
            if (navLink) {
                const href = navLink.getAttribute('href');
                
                // Skip if:
                // - It's an external link
                // - It has target="_blank"
                // - It's a hash link (same page)
                // - It's a download link
                // - It has no href
                if (!href || 
                    href.startsWith('http') || 
                    href.startsWith('https') || 
                    href.startsWith('#') || 
                    navLink.getAttribute('target') === '_blank' ||
                    navLink.hasAttribute('download')) {
                    return;
                }

                // Show loader for internal navigation
                this.showLoader();
            }
        });
    }

    // Handle browser back/forward buttons
    setupHistoryListeners() {
        // For modern browsers using Navigation API
        if (window.navigation) {
            window.navigation.addEventListener('navigate', (event) => {
                // Don't show loader for same-document navigations
                if (!event.hashChange && !event.formData) {
                    this.showLoader();
                }
            });
        }

        // Fallback for older browsers
        window.addEventListener('popstate', () => {
            this.showLoader();
        });

        // Also catch any clicks on browser back/forward
        window.addEventListener('pageshow', (event) => {
            // If loading from cache (bfcache)
            if (event.persisted) {
                this.hideLoader();
            }
        });
    }

    // Manual method to show loader (can be called from anywhere)
    static show() {
        if (window.pageLoader) {
            window.pageLoader.showLoader();
        }
    }

    // Manual method to hide loader (can be called from anywhere)
    static hide() {
        if (window.pageLoader) {
            window.pageLoader.hideLoader();
        }
    }
}

// Initialize loader when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pageLoader = new PageLoader();
});

// ==================== ADDITIONAL LOADER STYLES ====================
// Add these styles to your css/components.css file

const loaderStyles = `
/* Hidden loader state */
#page-loader.hidden-loader {
    visibility: hidden;
    pointer-events: none;
}

/* Ensure loader covers everything */
#page-loader {
    transition: opacity 0.3s ease, visibility 0.3s ease;
    z-index: 9999;
}

/* Disable interactions while loading */
body.loading * {
    pointer-events: none;
}

/* Small text improvement */
#page-loader p {
    letter-spacing: 0.5px;
}

/* Notification Modal Styles */
#notification-modal {
    max-width: 320px;
    transform-origin: top right;
    animation: notificationFadeIn 0.2s ease;
}

@keyframes notificationFadeIn {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.notification-item {
    transition: background-color 0.2s;
}

.notification-item.unread {
    background-color: rgba(216, 159, 52, 0.05);
}

.notification-item .unread-dot {
    transition: opacity 0.2s;
}

#notification-modal::-webkit-scrollbar {
    width: 4px;
}

#notification-modal::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

#notification-modal::-webkit-scrollbar-thumb {
    background: #D89F34;
    border-radius: 4px;
}

#notification-modal::-webkit-scrollbar-thumb:hover {
    background: #957A54;
}

#notification-badge.hidden {
    display: none;
}

/* Hover effects */
.notification-item:hover {
    background-color: #F8F8EA;
}

#mark-all-read:hover {
    text-decoration: underline;
}
`;

// Optional: Inject styles if not already in CSS
if (!document.querySelector('#loader-style')) {
    const styleTag = document.createElement('style');
    styleTag.id = 'loader-style';
    styleTag.textContent = loaderStyles;
    document.head.appendChild(styleTag);
}