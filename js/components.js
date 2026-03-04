// Components.js - Handles sidebar, header and modal functionality

class LayoutComponents {
    constructor() {
        this.sidebar = null;
        this.header = null;
        this.isCollapsed = false;
        this.isMobileOpen = false;
        this.isDropdownOpen = false;
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
    }

   async loadComponents() {
    try {
        // Check if we're in a subfolder
        const path = window.location.pathname;
        const isInSubfolder = path.includes('/Order/');
        
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
        const isInSubfolder = path.includes('/Order/');
        
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
        document.getElementById('sidebar-container').innerHTML = `
            <aside class="bg-[#F8F8EA] w-72 h-screen fixed left-0 top-0 p-4">
                <div class="text-[#133F53] font-bold">E-COMMERCE</div>
            </aside>
        `;
        document.getElementById('header-container').innerHTML = `
            <header class="bg-[#F8F8EA] p-4">
                <h2 class="text-[#133F53]">Dashboard</h2>
            </header>
        `;
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
            this.sidebar?.classList.add('sidebar-collapsed');
            this.collapseIcon?.classList.remove('fa-chevron-left');
            this.collapseIcon?.classList.add('fa-chevron-right');
            this.mainContent?.classList.add('main-content-expanded');
            this.mainContent?.classList.remove('main-content-normal');
        }
    }

    handleResize() {
        if (window.innerWidth <= 1024) {
            this.sidebar?.classList.remove('sidebar-collapsed');
            this.mainContent?.classList.remove('main-content-expanded', 'main-content-normal');
            
            if (this.isCollapsed) {
                localStorage.setItem('sidebarCollapsed', 'false');
                this.isCollapsed = false;
            }
        } else {
            if (this.isMobileOpen) {
                this.isMobileOpen = false;
                this.sidebar?.classList.remove('mobile-open');
                document.body.style.overflow = '';
            }
            
            if (this.isCollapsed) {
                this.mainContent?.classList.add('main-content-expanded');
                this.mainContent?.classList.remove('main-content-normal');
            } else {
                this.mainContent?.classList.remove('main-content-expanded');
                this.mainContent?.classList.add('main-content-normal');
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
        console.log('Login form submitted');
        this.showNotification('Login successful!', 'success');
        this.closeModal('login');
        this.updateUserState('loggedIn');
    }

    handleSignup(e) {
        console.log('Signup form submitted');
        this.showNotification('Account created successfully!', 'success');
        this.closeModal('signup');
        this.updateUserState('loggedIn');
    }

    handleLogout() {
        console.log('Logging out...');
        this.closeLogoutModal();
        this.showNotification('Logged out successfully!', 'info');
        this.updateUserState('loggedOut');
    }

    updateUserState(state) {
        const userMenuButton = document.getElementById('user-menu-button');
        const userName = userMenuButton?.querySelector('span');
        const userInitials = userMenuButton?.querySelector('div');
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (state === 'loggedIn') {
            if (userName) userName.textContent = 'Alex Carter';
            if (userInitials) userInitials.textContent = 'AC';
            
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'flex';
            
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName', 'Alex Carter');
        } else {
            if (userName) userName.textContent = 'Guest';
            if (userInitials) userInitials.textContent = 'G';
            
            if (loginBtn) loginBtn.style.display = 'flex';
            if (logoutBtn) logoutBtn.style.display = 'none';
            
            localStorage.setItem('isLoggedIn', 'false');
            localStorage.removeItem('userName');
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