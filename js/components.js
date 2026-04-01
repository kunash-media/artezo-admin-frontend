// Components.js - Handles sidebar, header and modal functionality
// Auth is handled entirely by auth.js — no localStorage login/logout here

document.addEventListener('DOMContentLoaded', async () => {

    // safety check — auth.js must be loaded before components.js
    if (typeof Auth === 'undefined') {
        console.error('auth.js must be loaded before Components.js');
        window.location.href = '/index.html';
        return;
    }

    // verify session — redirects to /index.html if cookie invalid/expired
    const ok = await Auth.requireLogin();
    if (!ok) return;

    // session valid — boot the layout
    window.layoutComponents = new LayoutComponents();
});


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
        await this.loadComponents();    // header/sidebar HTML loaded here
        await this.loadModals();
        this.initializeElements();
        this.initSidebarState();
        this.attachEvents();
        this.checkActiveLink();
        this.handleResize();
        this.setupDropdown();
        this.setupModals();
        this.setupLogoutModal();
        this.setupNotificationModal();
        this.loadUserDisplay();         // ← LAST: header DOM must exist before updating it
    }

    // ─────────────────────────────────────────────────────────────
    //  Load user display from auth.js profile (not localStorage directly)
    //  Called after loadComponents() so header DOM is ready
    // ─────────────────────────────────────────────────────────────
    loadUserDisplay() {
        try {
            const profile = Auth.getProfile();  // { adminId, firstName, lastName, mobile, role }
            if (profile && profile.firstName) {
                this.updateUserDisplay(profile);
            } else {
                this.updateUserDisplay(null);
            }
        } catch (error) {
            console.error('Error loading user display:', error);
            this.updateUserDisplay(null);
        }
    }

    async loadComponents() {
        try {
            const path = window.location.pathname;
            const isInSubfolder = path.includes('/Order_Management/')
                || path.includes('/Coupon_Management/')
                || path.includes('/User_Management/')
                || path.includes('/products.html')
                || path.includes('/Banner_Management/')
                || path.includes('/Inventory_Management/')
                || path.includes('/ProductReview_Management/')
                || path.includes('/Report_Sales/')
                || path.includes('/Contact_Management/')
                || path.includes('/Category_Management/');

            const sidebarPath = isInSubfolder ? '../sidebar.html' : 'sidebar.html';
            const sidebarResponse = await fetch(sidebarPath);
            const sidebarHtml = await sidebarResponse.text();
            document.getElementById('sidebar-container').innerHTML = sidebarHtml;

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
            const path = window.location.pathname;
            const isInSubfolder = path.includes('/Order_Management/')
                || path.includes('/Coupon_Management/')
                || path.includes('/User_Management/')
                || path.includes('/products.html')
                || path.includes('/Banner_Management/')
                || path.includes('/Inventory_Management/')
                || path.includes('/ProductReview_Management/')
                || path.includes('/Report_Sales/')
                || path.includes('/Contact_Management/')
                || path.includes('/Category_Management/');

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
        const headerContainer  = document.getElementById('header-container');

        if (sidebarContainer) {
            sidebarContainer.innerHTML = `
                <aside class="bg-[#F8F8EA] w-72 h-screen fixed left-0 top-0 p-4">
                    <div class="text-[#133F53] font-bold">Artezo</div>
                </aside>`;
        }

        if (headerContainer) {
            headerContainer.innerHTML = `
                <header class="bg-[#F8F8EA] p-4">
                    <h2 class="text-[#133F53]">Dashboard</h2>
                </header>`;
        }
    }

    initializeElements() {
        this.sidebar      = document.getElementById('sidebar');
        this.collapseBtn  = document.getElementById('collapse-btn');
        this.collapseIcon = document.getElementById('collapse-icon');
        this.mobileToggle = document.getElementById('mobile-toggle');
        this.mainContent  = document.querySelector('.flex-1');
        this.navLinks     = document.querySelectorAll('.nav-link');
        this.pageTitle    = document.getElementById('page-title');
        this.logo          = document.getElementById('sidebar-logo');
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

        window.addEventListener('resize', () => this.handleResize());

        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.setActiveLink(link);
                if (window.innerWidth <= 1024) this.toggleMobileSidebar();
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

    initSidebarState() {
        const savedState = localStorage.getItem('sidebarCollapsed');
        
        if (savedState === 'true') {
            this.isCollapsed = true;
            
            // Apply collapsed state
            this.sidebar.classList.add('sidebar-collapsed');
            this.collapseIcon.classList.replace('fa-chevron-left', 'fa-chevron-right');
            this.mainContent.classList.add('main-content-expanded');
            this.mainContent.classList.remove('main-content-normal');
            
            // Show favicon
            this.updateLogo(true);
        } else {
            this.isCollapsed = false;
            this.updateLogo(false);   // Show full logo
        }
    }

    // New helper method to handle logo change
    updateLogo(isCollapsed) {
        if (!this.logo) return;
        
        if (isCollapsed) {
            this.logo.classList.remove('h-10');
            this.logo.src = '/assets/artezo_fevicon.jpeg';
            this.logo.classList.add('h-8', 'w-8');
        } else {
            this.logo.src = '/assets/Artezo-logo.jpg';
            this.logo.classList.remove('h-8', 'w-8');
            this.logo.classList.add('h-10');
        }
    }

    toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;

        if (this.isCollapsed) {
            this.sidebar.classList.add('sidebar-collapsed');
            this.collapseIcon.classList.replace('fa-chevron-left', 'fa-chevron-right');
            this.mainContent.classList.add('main-content-expanded');
            this.mainContent.classList.remove('main-content-normal');
            
            this.updateLogo(true);                    // ← Changed to favicon
            localStorage.setItem('sidebarCollapsed', 'true');
        } else {
            this.sidebar.classList.remove('sidebar-collapsed');
            this.collapseIcon.classList.replace('fa-chevron-right', 'fa-chevron-left');
            this.mainContent.classList.remove('main-content-expanded');
            this.mainContent.classList.add('main-content-normal');
            
            this.updateLogo(false);                   // ← Changed to full logo
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

        const linkText = clickedLink.querySelector('.nav-text')?.textContent;
        if (this.pageTitle) this.pageTitle.textContent = `${linkText} / Overview`;

        // localStorage.setItem('activeLink', linkText);
    }

    checkActiveLink() {
        const savedActiveLink = localStorage.getItem('activeLink');
        const currentPath     = window.location.pathname;

        this.navLinks.forEach(link => {
            const linkText = link.querySelector('.nav-text')?.textContent;
            const href     = link.getAttribute('href');

            if ((currentPath === '/' && linkText === 'Dashboard') ||
                (savedActiveLink && linkText === savedActiveLink) ||
                (href === currentPath)) {
                this.setActiveLink(link);
            }
        });

        const savedCollapsed = localStorage.getItem('sidebarCollapsed');
        if (savedCollapsed === 'true') {
            this.isCollapsed = true;
            if (this.sidebar)      this.sidebar.classList.add('sidebar-collapsed');
            if (this.collapseIcon) this.collapseIcon.classList.replace('fa-chevron-left', 'fa-chevron-right');
            if (this.mainContent) {
                this.mainContent.classList.add('main-content-expanded');
                this.mainContent.classList.remove('main-content-normal');
            }
        }
    }

    setupNotificationModal() {
        const notificationBell  = document.getElementById('notification-bell');
        const notificationModal = document.getElementById('notification-modal');
        const markAllReadBtn    = document.getElementById('mark-all-read');
        let isNotificationOpen  = false;

        if (notificationBell && notificationModal) {
            notificationBell.addEventListener('click', (e) => {
                e.stopPropagation();
                isNotificationOpen = !isNotificationOpen;
                notificationModal.classList.toggle('hidden', !isNotificationOpen);
            });

            document.addEventListener('click', (e) => {
                if (!notificationBell.contains(e.target) && !notificationModal.contains(e.target)) {
                    notificationModal.classList.add('hidden');
                    isNotificationOpen = false;
                }
            });

            if (markAllReadBtn) {
                markAllReadBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.markAllNotificationsRead();
                });
            }
        }
    }

    markAllNotificationsRead() {
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
        });
        document.querySelectorAll('.unread-dot').forEach(dot => {
            dot.style.display = 'none';
        });

        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = '0';
            badge.classList.add('hidden');
        }

        this.showNotification('All notifications marked as read', 'success');
    }

    addNotification(notification) {
        const notificationList  = document.getElementById('notification-list');
        const notificationBadge = document.getElementById('notification-badge');

        if (!notificationList) return;

        const item = document.createElement('div');
        item.className = 'px-4 py-3 hover:bg-[#F8F8EA] transition-colors border-b border-gray-50 notification-item unread';

        const currentCount = parseInt(notificationBadge?.textContent) || 0;

        item.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-[#D89F34] bg-opacity-20 flex items-center justify-center flex-shrink-0">
                    <i class="fa-regular ${notification.icon || 'fa-bell'} text-sm" style="color:#D89F34;"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm" style="color:#133F53;">${notification.message}</p>
                    <p class="text-xs mt-1" style="color:#957A54;">${notification.time || 'Just now'}</p>
                </div>
                <div class="w-2 h-2 rounded-full bg-[#D89F34] unread-dot"></div>
            </div>`;

        notificationList.insertBefore(item, notificationList.firstChild);

        if (notificationBadge) {
            notificationBadge.textContent = currentCount + 1;
            notificationBadge.classList.remove('hidden');
        }
    }

    handleResize() {
        if (window.innerWidth <= 1024) {
            if (this.sidebar)     this.sidebar.classList.remove('sidebar-collapsed');
            if (this.mainContent) this.mainContent.classList.remove('main-content-expanded', 'main-content-normal');
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
        const userDropdown   = document.getElementById('user-dropdown');
        const dropdownArrow  = document.getElementById('dropdown-arrow');

        if (!userMenuButton || !userDropdown) return;

        userMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.isDropdownOpen = !this.isDropdownOpen;

            userDropdown.classList.toggle('hidden', !this.isDropdownOpen);
            if (dropdownArrow) {
                dropdownArrow.style.transform = this.isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });

        document.addEventListener('click', (e) => {
            if (!userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.add('hidden');
                if (dropdownArrow) dropdownArrow.style.transform = 'rotate(0deg)';
                this.isDropdownOpen = false;
            }
        });

        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const action = item.textContent.trim().toLowerCase();

                if (action.includes('logout')) {
                    this.openLogoutModal();
                }

                userDropdown.classList.add('hidden');
                if (dropdownArrow) dropdownArrow.style.transform = 'rotate(0deg)';
                this.isDropdownOpen = false;
            });
        });
    }

    setupModals() {
        // intentionally empty — admin panel has no self-signup flow
        // login is handled by index.html + auth.js
    }

    setupLogoutModal() {
        setTimeout(() => {
            this.logoutModal      = document.getElementById('logout-modal');
            this.cancelLogoutBtn  = document.getElementById('cancel-logout');
            this.confirmLogoutBtn = document.getElementById('confirm-logout');

            if (this.cancelLogoutBtn) {
                this.cancelLogoutBtn.addEventListener('click', () => this.closeLogoutModal());
            }

            if (this.confirmLogoutBtn) {
                this.confirmLogoutBtn.addEventListener('click', async () => {
                    this.closeLogoutModal();
                    this.showNotification('Logging out...', 'info');
                    await Auth.logout();  // clears cookies + localStorage + redirects
                });
            }

            window.addEventListener('click', (e) => {
                if (e.target === this.logoutModal) this.closeLogoutModal();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.logoutModal && !this.logoutModal.classList.contains('hidden')) {
                    this.closeLogoutModal();
                }
            });
        }, 100);
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

    // ─────────────────────────────────────────────────────────────
    //  updateUserDisplay — uses profile from auth.js
    //  profile shape: { adminId, firstName, lastName, mobile, role }
    // ─────────────────────────────────────────────────────────────
    updateUserDisplay(user) {
        const userMenuButton = document.getElementById('user-menu-button');
        if (!userMenuButton) return;

        const userInitialsDiv = userMenuButton.querySelector('div:first-child');
        const userNameSpan    = userMenuButton.querySelector('span.text-sm');
        const userDropdown    = document.getElementById('user-dropdown');
        const logoutBtn       = document.getElementById('logout-btn');

        if (user && user.firstName) {
            // ── Logged in state ──
            const initials = (
                (user.firstName.charAt(0) || '') +
                (user.lastName?.charAt(0)  || '')
            ).toUpperCase();
            const fullName = `${user.firstName} ${user.lastName || ''}`.trim();

            if (userInitialsDiv) userInitialsDiv.textContent = initials;
            if (userNameSpan)    userNameSpan.textContent    = fullName;

            if (userDropdown) {
                const dropdownName = userDropdown.querySelector('.px-4.py-2 p:first-child');
                const dropdownRole = userDropdown.querySelector('.px-4.py-2 p:last-child');
                if (dropdownName) dropdownName.textContent = fullName;
                if (dropdownRole) dropdownRole.textContent = user.role || 'ADMIN';
            }

            if (logoutBtn) logoutBtn.style.display = 'flex';

        } else {
            // ── Guest / logged out state ──
            if (userInitialsDiv) userInitialsDiv.textContent = 'G';
            if (userNameSpan)    userNameSpan.textContent    = 'Guest';

            if (userDropdown) {
                const dropdownName = userDropdown.querySelector('.px-4.py-2 p:first-child');
                const dropdownRole = userDropdown.querySelector('.px-4.py-2 p:last-child');
                if (dropdownName) dropdownName.textContent = 'Guest User';
                if (dropdownRole) dropdownRole.textContent = '';
            }

            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50';

        const colors = { success: '#10B981', error: '#EF4444', info: '#3B82F6' };
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.style.color = 'white';

        const iconClass = type === 'success'
            ? 'fa-regular fa-circle-check'
            : type === 'error'
                ? 'fa-solid fa-circle-exclamation'
                : 'fa-solid fa-circle-info';

        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="${iconClass}"></i>
                <span class="text-sm">${message}</span>
            </div>`;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setPageTitle(title) {
        if (this.pageTitle) this.pageTitle.textContent = title;
    }

    isSidebarCollapsed() {
        return this.isCollapsed;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayoutComponents;
}


// ==================== PAGE LOADER ====================

class PageLoader {
    constructor() {
        this.loader = document.getElementById('page-loader');
        this.init();
    }

    init() {
        this.hideLoaderOnLoad();
        this.setupNavigationListeners();
        this.setupHistoryListeners();
    }

    hideLoaderOnLoad() {
        if (document.readyState === 'complete') {
            this.hideLoader();
        } else {
            window.addEventListener('load', () => this.hideLoader());
        }
    }

    showLoader() {
        if (this.loader) {
            this.loader.classList.remove('hidden-loader');
            this.loader.style.opacity = '1';
            this.loader.style.visibility = 'visible';
            document.body.style.overflow = 'hidden';
        }
    }

    hideLoader() {
        if (this.loader) {
            this.loader.style.opacity = '0';
            setTimeout(() => {
                this.loader.classList.add('hidden-loader');
                this.loader.style.visibility = 'hidden';
                document.body.style.overflow = '';
            }, 300);
        }
    }

    setupNavigationListeners() {
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('a');
            if (!navLink) return;

            const href = navLink.getAttribute('href');
            if (!href
                || href.startsWith('http')
                || href.startsWith('https')
                || href.startsWith('#')
                || navLink.getAttribute('target') === '_blank'
                || navLink.hasAttribute('download')) return;

            this.showLoader();
        });
    }

    setupHistoryListeners() {
        if (window.navigation) {
            window.navigation.addEventListener('navigate', (event) => {
                if (!event.hashChange && !event.formData) this.showLoader();
            });
        }

        window.addEventListener('popstate', () => this.showLoader());

        window.addEventListener('pageshow', (event) => {
            if (event.persisted) this.hideLoader();
        });
    }

    static show() { window.pageLoader?.showLoader(); }
    static hide() { window.pageLoader?.hideLoader(); }
}

document.addEventListener('DOMContentLoaded', () => {
    window.pageLoader = new PageLoader();
});


// ==================== STYLES ====================

const loaderStyles = `
#page-loader.hidden-loader { visibility: hidden; pointer-events: none; }
#page-loader { transition: opacity 0.3s ease, visibility 0.3s ease; z-index: 9999; }
body.loading * { pointer-events: none; }
#page-loader p { letter-spacing: 0.5px; }
#notification-modal { max-width: 320px; transform-origin: top right; animation: notificationFadeIn 0.2s ease; }
@keyframes notificationFadeIn {
    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);     }
}
.notification-item { transition: background-color 0.2s; }
.notification-item.unread { background-color: rgba(216,159,52,0.05); }
.notification-item .unread-dot { transition: opacity 0.2s; }
#notification-modal::-webkit-scrollbar { width: 4px; }
#notification-modal::-webkit-scrollbar-track { background:#f1f1f1; border-radius:4px; }
#notification-modal::-webkit-scrollbar-thumb { background:#D89F34; border-radius:4px; }
#notification-modal::-webkit-scrollbar-thumb:hover { background:#957A54; }
#notification-badge.hidden { display:none; }
.notification-item:hover { background-color: #F8F8EA; }
#mark-all-read:hover { text-decoration: underline; }
`;

if (!document.querySelector('#loader-style')) {
    const styleTag = document.createElement('style');
    styleTag.id = 'loader-style';
    styleTag.textContent = loaderStyles;
    document.head.appendChild(styleTag);
}