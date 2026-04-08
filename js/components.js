// components.js — sidebar, header, modals, page loader
// Auth is handled entirely by auth.js — no localStorage login/logout here

// ─────────────────────────────────────────────────────────────────────────────
//  STYLES — injected immediately, before DOMContentLoaded
//  Body starts invisible; auth success lifts the veil with a smooth fade-in.
//  This kills the "blank → flash → layout" problem entirely.
// ─────────────────────────────────────────────────────────────────────────────
(function injectCriticalStyles() {
    if (document.querySelector('#artezo-critical-style')) return;
    const style = document.createElement('style');
    style.id = 'artezo-critical-style';
    style.textContent = `
        /* ── Paint guard: body hidden until auth + layout are both ready ── */
        body.artezo-loading {
            visibility: hidden;
            opacity: 0;
        }
        body.artezo-ready {
            visibility: visible;
            opacity: 1;
            transition: opacity 0.18s ease;
        }

        /* ── Sidebar / header containers: reserve space immediately ── */
        #sidebar-container {
            width: 288px;
            flex-shrink: 0;
            position: fixed;
            left: 0; top: 0;
            height: 100vh;
            z-index: 30;
        }
        #header-container {
            flex-shrink: 0;
        }

        /* ── Loader ── */
        #page-loader { transition: opacity 0.3s ease, visibility 0.3s ease; z-index: 9999; }
        #page-loader.hidden-loader { visibility: hidden; pointer-events: none; }
        body.loading * { pointer-events: none; }

        /* ── Notification dropdown ── */
        #notification-modal {
            max-width: 320px;
            transform-origin: top right;
            animation: notifFadeIn 0.2s ease;
        }
        @keyframes notifFadeIn {
            from { opacity: 0; transform: scale(0.95) translateY(-10px); }
            to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
        .notification-item { transition: background-color 0.2s; }
        .notification-item.unread { background-color: rgba(216,159,52,0.05); }
        #notification-modal::-webkit-scrollbar { width: 4px; }
        #notification-modal::-webkit-scrollbar-track { background:#f1f1f1; border-radius:4px; }
        #notification-modal::-webkit-scrollbar-thumb { background:#D89F34; border-radius:4px; }
        #notification-modal::-webkit-scrollbar-thumb:hover { background:#957A54; }
        #notification-badge.hidden { display: none; }

        /* ── Sidebar collapse ── */
        .sidebar-collapsed { width: 76px !important; }
        .sidebar-collapsed .nav-text { opacity: 0; width: 0; overflow: hidden; }
        .sidebar-collapsed #sidebar-logo { }
        .main-content-expanded  { margin-left: 72px  !important; }
        .main-content-normal    { margin-left: 288px !important; }
    `;
    document.head.appendChild(style);

    // Apply paint guard immediately — before any content renders
    document.documentElement.classList.add('artezo-loading');
    document.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('artezo-loading');
    });
})();


// ─────────────────────────────────────────────────────────────────────────────
//  HTML CACHE — stores sidebar/header/modals HTML in sessionStorage.
//  First visit: 3 fetches. Every subsequent navigation: 0 fetches.
//  Cache is keyed by version string — bump CACHE_VERSION on HTML changes.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_VERSION = 'v1'; // ← bump this whenever sidebar.html / header.html / modals.html changes
const CACHE_KEY = `artezo_layout_${CACHE_VERSION}`;

const LayoutCache = {
    get() {
        try {
            const raw = sessionStorage.getItem(CACHE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    },
    set(data) {
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* quota exceeded — ignore */ }
    },
    clear() {
        // Clear old cache versions
        Object.keys(sessionStorage)
            .filter(k => k.startsWith('artezo_layout_') && k !== CACHE_KEY)
            .forEach(k => sessionStorage.removeItem(k));
    }
};


// ─────────────────────────────────────────────────────────────────────────────
//  HELPER — resolves relative asset paths once
// ─────────────────────────────────────────────────────────────────────────────
function _resolveBasePath() {
    const subfolders = [
        '/Order_Management/',
        '/Coupon_Management/',
        '/User_Management/',
        '/products.html',
        '/Banner_Management/',
        '/Inventory_Management/',
        '/ProductReview_Management/',
        '/Report_Sales/',
        '/Contact_Management/',
        '/Category_Management/',
        '/Admin_Management/admin.html',
    ];
    const path = window.location.pathname;
    return subfolders.some(s => path.includes(s)) ? '../' : '';
}


// ─────────────────────────────────────────────────────────────────────────────
//  BOOT — runs after DOMContentLoaded
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

    if (typeof Auth === 'undefined') {
        console.error('auth.js must be loaded before components.js');
        window.location.href = '/index.html';
        return;
    }

    // Run auth check AND layout injection in parallel.
    // Layout HTML is painted from cache (synchronous) immediately,
    // so there's zero visual delay even while the auth network call runs.
    const [ok] = await Promise.all([
        Auth.requireLogin(),
        _injectLayoutFromCache(),   // sync if cached, one fetch-round-trip if not
    ]);

    if (!ok) return;

    // Both auth and layout are ready — reveal the page
    document.body.classList.remove('artezo-loading');
    document.body.classList.add('artezo-ready');

    window.layoutComponents = new LayoutComponents();
});


// ─────────────────────────────────────────────────────────────────────────────
//  _injectLayoutFromCache
//  If HTML is in sessionStorage → stamp it synchronously (no network).
//  Otherwise → fetch all three files in parallel, cache, then stamp.
// ─────────────────────────────────────────────────────────────────────────────
async function _injectLayoutFromCache() {
    LayoutCache.clear(); // remove stale versions

    let cached = LayoutCache.get();

    if (!cached) {
        // First visit — fetch all three in parallel
        const base = _resolveBasePath();
        try {
            const [sidebarHtml, headerHtml, modalsHtml] = await Promise.all([
                fetch(`${base}sidebar.html`).then(r => r.text()),
                fetch(`${base}header.html`).then(r => r.text()),
                fetch(`${base}modals.html`).then(r => r.text()),
            ]);
            cached = { sidebarHtml, headerHtml, modalsHtml };
            LayoutCache.set(cached);
        } catch (err) {
            console.error('Layout fetch failed:', err);
            _loadFallbackContent();
            return;
        }
    }

    // Stamp HTML into DOM — synchronous, no reflow delay
    const sidebarContainer = document.getElementById('sidebar-container');
    const headerContainer  = document.getElementById('header-container');

    if (sidebarContainer) sidebarContainer.innerHTML = cached.sidebarHtml;
    if (headerContainer)  headerContainer.innerHTML  = cached.headerHtml;

    // Modals container
    let modalsContainer = document.getElementById('modals-container');
    if (!modalsContainer) {
        modalsContainer = document.createElement('div');
        modalsContainer.id = 'modals-container';
        document.body.appendChild(modalsContainer);
    }
    modalsContainer.innerHTML = cached.modalsHtml;

    if (typeof OrderBadge !== 'undefined') OrderBadge.render();

    document.dispatchEvent(new Event('componentsLoaded'));
    document.dispatchEvent(new Event('modalsLoaded'));
}


function _loadFallbackContent() {
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
    // Reveal even on fallback so the page isn't stuck invisible
    document.body.classList.remove('artezo-loading');
    document.body.classList.add('artezo-ready');
}


// ─────────────────────────────────────────────────────────────────────────────
//  LayoutComponents
// ─────────────────────────────────────────────────────────────────────────────
class LayoutComponents {
    constructor() {
        this.sidebar         = null;
        this.header          = null;
        this.isCollapsed     = false;
        this.isMobileOpen    = false;
        this.isDropdownOpen  = false;
        this._base           = _resolveBasePath();
        this.init();
    }

    init() {
        // All HTML is already in DOM — no async needed here
        this.initializeElements();
        this.initSidebarState();
        this.attachEvents();
        this.checkActiveLink();
        this.handleResize();
        this.setupDropdown();
        this.setupModals();
        this.setupLogoutModal();
        this.setupNotificationModal();
        this.loadUserDisplay();

        window.addEventListener('beforeunload', () => {
            if (this._pollingInterval) clearInterval(this._pollingInterval);
        });
    }

    loadUserDisplay() {
        const profile = Auth.getProfile();
        this.updateUserDisplay(profile && profile.firstName ? profile : null);
    }

    initializeElements() {
        this.sidebar      = document.getElementById('sidebar');
        this.collapseBtn  = document.getElementById('collapse-btn');
        this.collapseIcon = document.getElementById('collapse-icon');
        this.mobileToggle = document.getElementById('mobile-toggle');
        this.mainContent  = document.querySelector('.flex-1');
        this.navLinks     = document.querySelectorAll('.nav-link');
        this.pageTitle    = document.getElementById('page-title');
        this.logo         = document.getElementById('sidebar-logo');
        this.logoutModal  = document.getElementById('logout-modal');
    }

    attachEvents() {
        this.collapseBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleSidebar();
        });

        this.mobileToggle?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMobileSidebar();
        });

        window.addEventListener('resize', () => this.handleResize());

        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.setActiveLink(link);
                if (window.innerWidth <= 1024) this.toggleMobileSidebar();
            });
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && this.isMobileOpen) {
                if (!this.sidebar.contains(e.target) && !this.mobileToggle?.contains(e.target)) {
                    this.toggleMobileSidebar();
                }
            }
        });
    }

    initSidebarState() {
        const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        this.isCollapsed = collapsed;
        this.updateLogo(collapsed);

        if (collapsed && this.sidebar) {
            this.sidebar.classList.add('sidebar-collapsed');
            this.collapseIcon?.classList.replace('fa-chevron-left', 'fa-chevron-right');
            this.mainContent?.classList.add('main-content-expanded');
            this.mainContent?.classList.remove('main-content-normal');
        } else if (this.mainContent && window.innerWidth > 1024) {
            this.mainContent.classList.add('main-content-normal');
        }
    }

    updateLogo(isCollapsed) {
        if (!this.logo) return;
        if (isCollapsed) {
            this.logo.src = '/assets/artezo_fevicon.jpeg';
            this.logo.classList.remove('h-10');
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
            this.sidebar?.classList.add('sidebar-collapsed');
            this.collapseIcon?.classList.replace('fa-chevron-left', 'fa-chevron-right');
            this.mainContent?.classList.add('main-content-expanded');
            this.mainContent?.classList.remove('main-content-normal');
        } else {
            this.sidebar?.classList.remove('sidebar-collapsed');
            this.collapseIcon?.classList.replace('fa-chevron-right', 'fa-chevron-left');
            this.mainContent?.classList.remove('main-content-expanded');
            this.mainContent?.classList.add('main-content-normal');
        }

        this.updateLogo(this.isCollapsed);
        localStorage.setItem('sidebarCollapsed', String(this.isCollapsed));

        window.dispatchEvent(new CustomEvent('sidebarToggle', {
            detail: { collapsed: this.isCollapsed }
        }));
    }

    toggleMobileSidebar() {
        this.isMobileOpen = !this.isMobileOpen;
        this.sidebar?.classList.toggle('mobile-open', this.isMobileOpen);
        document.body.style.overflow = this.isMobileOpen ? 'hidden' : '';
    }

    setActiveLink(clickedLink) {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('data-active');
        });
        clickedLink.classList.add('active');
        clickedLink.setAttribute('data-active', 'true');

        const linkText = clickedLink.querySelector('.nav-text')?.textContent;
        if (this.pageTitle && linkText) this.pageTitle.textContent = `${linkText} / Overview`;
    }

    checkActiveLink() {
        const currentPath = window.location.pathname;

        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const linkText = link.querySelector('.nav-text')?.textContent;

            if (
                (currentPath === '/' && linkText === 'Dashboard') ||
                (href && href === currentPath) ||
                (href && currentPath.endsWith(href))
            ) {
                this.setActiveLink(link);
            }
        });
    }

    handleResize() {
        if (window.innerWidth <= 1024) {
            this.sidebar?.classList.remove('sidebar-collapsed');
            this.mainContent?.classList.remove('main-content-expanded', 'main-content-normal');
            if (this.isCollapsed) {
                this.isCollapsed = false;
                localStorage.setItem('sidebarCollapsed', 'false');
            }
        } else {
            if (this.isMobileOpen) {
                this.isMobileOpen = false;
                this.sidebar?.classList.remove('mobile-open');
                document.body.style.overflow = '';
            }
            if (this.mainContent) {
                this.mainContent.classList.toggle('main-content-expanded', this.isCollapsed);
                this.mainContent.classList.toggle('main-content-normal', !this.isCollapsed);
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

        userDropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                if (item.textContent.trim().toLowerCase().includes('logout')) {
                    this.openLogoutModal();
                }
                userDropdown.classList.add('hidden');
                if (dropdownArrow) dropdownArrow.style.transform = 'rotate(0deg)';
                this.isDropdownOpen = false;
            });
        });
    }

    setupModals() {
        // intentionally empty — login handled by index.html + auth.js
    }

    setupLogoutModal() {
        const cancelBtn  = document.getElementById('cancel-logout');
        const confirmBtn = document.getElementById('confirm-logout');

        cancelBtn?.addEventListener('click', () => this.closeLogoutModal());

        confirmBtn?.addEventListener('click', async () => {
            this.closeLogoutModal();
            this.showNotification('Logging out…', 'info');
            await Auth.logout();
        });

        window.addEventListener('click', (e) => {
            if (e.target === this.logoutModal) this.closeLogoutModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.logoutModal && !this.logoutModal.classList.contains('hidden')) {
                this.closeLogoutModal();
            }
        });
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

    _getAdminId() {
        const profile = Auth.getProfile();
        return profile?.adminId || null;
    }

    setupNotificationModal() {
        const bell    = document.getElementById('notification-bell');
        const modal   = document.getElementById('notification-modal');
        const markAll = document.getElementById('mark-all-read');
        if (!bell || !modal) return;

        let isOpen    = false;
        let hasOpened = false;

        this.fetchNotificationsBadge();

        this._pollingInterval = setInterval(async () => {
            await this.fetchNotificationsBadge();
            if (hasOpened) {
                await this.fetchNotifications(isOpen);
            }
        }, 2 * 60 * 1000);

        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            isOpen = !isOpen;
            modal.classList.toggle('hidden', !isOpen);
            if (isOpen) {
                hasOpened = true;
                this.fetchNotifications(true);
            }
        });

        document.addEventListener('click', (e) => {
            if (!bell.contains(e.target) && !modal.contains(e.target)) {
                modal.classList.add('hidden');
                isOpen = false;
            }
        });

        markAll?.addEventListener('click', (e) => {
            e.preventDefault();
            this._markAllNotificationsRead();
        });

        window.addEventListener('beforeunload', () => {
            if (this._pollingInterval) clearInterval(this._pollingInterval);
        });
    }

    async fetchNotificationsBadge() {
        const adminId = this._getAdminId();
        if (!adminId) return;

        const badge = document.getElementById('notification-badge');
        if (!badge) return;

        try {
            const res = await fetch(`/api/notifications/alerts?adminId=${adminId}`);
            if (!res.ok) { badge.classList.add('hidden'); return; }

            const data  = await res.json();
            const count = parseInt(data.totalUnread) || 0;

            badge.textContent = count;
            if (count > 0) {
                badge.classList.remove('hidden');
                badge.classList.add('bg-[#D89F34]', 'text-[#133F53]');
            } else {
                badge.classList.add('hidden');
                badge.classList.remove('bg-[#D89F34]', 'text-[#133F53]');
            }
        } catch (err) {
            console.warn('Badge poll failed:', err);
            badge.classList.add('hidden');
            badge.classList.remove('bg-[#D89F34]', 'text-[#133F53]');
        }
    }

    async fetchNotifications(renderDOM = true) {
        const adminId = this._getAdminId();
        const list    = document.getElementById('notification-list');
        const badge   = document.getElementById('notification-badge');

        if (!list || !adminId) return;

        if (renderDOM) {
            list.innerHTML = `
                <div class="px-4 py-6 text-center">
                    <p class="text-sm" style="color:#957A54;">Loading...</p>
                </div>`;
        }

        try {
            const res = await fetch(`/api/notifications/alerts?adminId=${adminId}`);
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            this._lastNotifData = data;

            if (renderDOM) {
                list.innerHTML = '';

                const allItems = [
                    ...data.lowStock.map(item => ({
                        icon: 'fa-solid fa-boxes-stacked',
                        fingerprint: item.fingerprint,
                        visited: item.visited,
                        message: `<span style="background:rgba(220,38,38,0.1);color:#dc2626;border:1px solid rgba(220,38,38,0.25);padding:1px 7px;border-radius:999px;font-size:11px;font-weight:600;">Low stock</span> <strong>${item.productName}</strong> — only <strong style="color:#dc2626">${item.availableStock}</strong> left (threshold: ${item.lowStockThreshold})`,
                        time: 'Inventory alert',
                        visitLink: '/Inventory_Management/inventory.html'
                    })),
                    ...data.recentUsers.map(u => ({
                        icon: 'fa-solid fa-user',
                        fingerprint: u.fingerprint,
                        visited: u.visited,
                        message: `New user registered: <strong>${u.firstName} ${u.lastName}</strong>`,
                        time: this._timeAgo(u.createdAt),
                        visitLink: '/User_Management/user.html'
                    })),
                    ...data.contactEnquiries.map(c => ({
                        icon: 'fa-solid fa-envelope',
                        fingerprint: c.fingerprint,
                        visited: c.visited,
                        message: `Contact enquiry from <strong>${c.name}</strong>: ${c.messagePreview}`,
                        time: this._timeAgo(c.createdAt),
                        visitLink: '/Contact_Management/contact.html'
                    }))
                ];

                const visibleItems = allItems.filter(i => !i.visited);

                if (visibleItems.length === 0) {
                    list.innerHTML = `
                        <div class="px-4 py-6 text-center">
                            <p class="text-sm" style="color:#957A54;">No new notifications</p>
                        </div>`;
                } else {
                    visibleItems.forEach(item => {
                        const el = document.createElement('div');
                        el.className = 'px-4 py-3 hover:bg-[#F8F8EA] transition-colors rounded-lg m-2 border border-[#D89F34] notification-item unread';
                        el.innerHTML = `
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-full bg-[#D89F34] bg-opacity-20 flex items-center justify-center flex-shrink-0">
                                    <i class="${item.icon} text-sm" style="color:#D89F34;"></i>
                                </div>
                                <div class="flex-1">
                                    <p class="text-sm" style="color:#133F53;">${item.message}</p>
                                    <div class="flex justify-between">
                                        <p class="text-xs mt-1" style="color:#957A54;">${item.time}</p>
                                        <a href="${item.visitLink}"
                                            title="click to see"
                                            data-fingerprint="${item.fingerprint}"
                                            class="visit-btn border border-[#D89F34] inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-1 rounded-md"
                                            style="color:#133F53;background:rgba(216,159,52,0.15);">
                                                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                                                Visit
                                        </a>
                                    </div>
                                </div>
                                <div class="w-2 h-2 rounded-full bg-[#D89F34] unread-dot flex-shrink-0 mt-1"></div>
                            </div>`;

                        el.querySelector('.visit-btn').addEventListener('click', async (e) => {
                            e.preventDefault();
                            const fp   = e.currentTarget.dataset.fingerprint;
                            const href = e.currentTarget.getAttribute('href');
                            await fetch(`/api/notifications/visit?adminId=${adminId}&fingerprint=${encodeURIComponent(fp)}`, {
                                method: 'POST'
                            });
                            window.location.href = href;
                        });

                        list.appendChild(el);
                    });
                }
            }

            if (badge) {
                badge.textContent = data.totalUnread;
                badge.classList.toggle('hidden', data.totalUnread === 0);
            }

        } catch (err) {
            console.error('Notification fetch failed:', err);
            if (renderDOM) {
                list.innerHTML = `
                    <div class="px-4 py-6 text-center">
                        <p class="text-sm text-red-500">Failed to load notifications</p>
                    </div>`;
            }
        }
    }

    async _markAllNotificationsRead() {
        const adminId = this._getAdminId();
        if (!adminId) return;
        try {
            await fetch(`/api/notifications/mark-all-read?adminId=${adminId}`, { method: 'POST' });
            await this.fetchNotifications();
            this.showNotification('All notifications marked as read', 'success');
        } catch (err) {
            console.error('Mark all read failed:', err);
        }
    }

    _timeAgo(isoString) {
        if (!isoString) return '';
        const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
        if (diff < 60)    return 'Just now';
        if (diff < 3600)  return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    }

    updateUserDisplay(user) {
        const btn = document.getElementById('user-menu-button');
        if (!btn) return;

        const initialsEl = btn.querySelector('div:first-child');
        const nameEl     = btn.querySelector('span.text-sm');
        const dropdown   = document.getElementById('user-dropdown');
        const logoutBtn  = document.getElementById('logout-btn');

        if (user) {
            const initials = ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase();
            const fullName = `${user.firstName} ${user.lastName || ''}`.trim();

            if (initialsEl) initialsEl.textContent = initials;
            if (nameEl)     nameEl.textContent     = fullName;

            if (dropdown) {
                const nameP = dropdown.querySelector('.px-4.py-2 p:first-child');
                const roleP = dropdown.querySelector('.px-4.py-2 p:last-child');
                if (nameP) nameP.textContent = fullName;
                if (roleP) roleP.textContent = user.role || 'ADMIN';
            }

            if (logoutBtn) logoutBtn.style.display = 'flex';
        } else {
            if (initialsEl) initialsEl.textContent = 'G';
            if (nameEl)     nameEl.textContent     = 'Guest';

            if (dropdown) {
                const nameP = dropdown.querySelector('.px-4.py-2 p:first-child');
                const roleP = dropdown.querySelector('.px-4.py-2 p:last-child');
                if (nameP) nameP.textContent = 'Guest User';
                if (roleP) roleP.textContent = '';
            }

            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        const colors = { success: '#10B981', error: '#EF4444', info: '#3B82F6' };
        const icons  = { success: 'fa-regular fa-circle-check', error: 'fa-solid fa-circle-exclamation', info: 'fa-solid fa-circle-info' };

        const el = document.createElement('div');
        el.className = 'fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50';
        el.style.cssText = `background:${colors[type] || colors.info};color:#fff`;
        el.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="${icons[type] || icons.info}"></i>
                <span class="text-sm">${message}</span>
            </div>`;

        document.body.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.3s ease';
            setTimeout(() => el.remove(), 300);
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


// ─────────────────────────────────────────────────────────────────────────────
//  PAGE LOADER
// ─────────────────────────────────────────────────────────────────────────────
class PageLoader {
    constructor() {
        this.loader = document.getElementById('page-loader');
        this.init();
    }

    init() {
        if (document.readyState === 'complete') {
            this.hideLoader();
        } else {
            window.addEventListener('load', () => this.hideLoader());
        }
        this._setupNavigationListeners();
        this._setupHistoryListeners();
    }

    showLoader() {
        if (this.loader) {
            this.loader.classList.remove('hidden-loader');
            this.loader.style.cssText = 'opacity:1;visibility:visible';
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

    _setupNavigationListeners() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            const href = link.getAttribute('href');
            if (!href
                || href.startsWith('http')
                || href.startsWith('#')
                || link.getAttribute('target') === '_blank'
                || link.hasAttribute('download')) return;
            this.showLoader();
        });
    }

    _setupHistoryListeners() {
        window.navigation?.addEventListener('navigate', (e) => {
            if (!e.hashChange && !e.formData) this.showLoader();
        });
        window.addEventListener('popstate', () => this.showLoader());
        window.addEventListener('pageshow',  (e) => { if (e.persisted) this.hideLoader(); });
    }

    static show() { window.pageLoader?.showLoader(); }
    static hide() { window.pageLoader?.hideLoader(); }
}

document.addEventListener('DOMContentLoaded', () => {
    window.pageLoader = new PageLoader();
});















//------------------------------------------------------------------------------//
//     flickering problem -->   without caching html render approach            //
//------------------------------------------------------------------------------//



// // components.js — sidebar, header, modals, page loader
// // Auth is handled entirely by auth.js — no localStorage login/logout here

// document.addEventListener('DOMContentLoaded', async () => {

//     // auth.js must be loaded before components.js
//     if (typeof Auth === 'undefined') {
//         console.error('auth.js must be loaded before components.js');
//         window.location.href = '/index.html';
//         return;
//     }

//     // One session check for the entire page — auth.js caches the result
//     const ok = await Auth.requireLogin();
//     if (!ok) return;

//     // Session valid — boot the layout
//     window.layoutComponents = new LayoutComponents();
// });


// // ─────────────────────────────────────────────────────────────────────────────
// //  HELPER — resolves relative asset paths once, used by loadComponents + loadModals
// // ─────────────────────────────────────────────────────────────────────────────
// function _resolveBasePath() {
//     const subfolders = [
//         '/Order_Management/',
//         '/Coupon_Management/',
//         '/User_Management/',
//         '/products.html',
//         '/Banner_Management/',
//         '/Inventory_Management/',
//         '/ProductReview_Management/',
//         '/Report_Sales/',
//         '/Contact_Management/',
//         '/Category_Management/',
//         '/Admin_Management/admin.html',
//     ];
//     const path = window.location.pathname;
//     return subfolders.some(s => path.includes(s)) ? '../' : '';
// }


// class LayoutComponents {
//     constructor() {
//         this.sidebar         = null;
//         this.header          = null;
//         this.isCollapsed     = false;
//         this.isMobileOpen    = false;
//         this.isDropdownOpen  = false;
//         this._base           = _resolveBasePath();   // computed once
//         this.init();
//     }

//     async init() {
//         await this.loadComponents();
//         await this.loadModals();
//         this.initializeElements();
//         this.initSidebarState();
//         this.attachEvents();
//         this.checkActiveLink();
//         this.handleResize();
//         this.setupDropdown();
//         this.setupModals();
//         this.setupLogoutModal();            // safe — modals already in DOM
//         this.setupNotificationModal();
//         this.loadUserDisplay();             // last: header DOM must exist first

//         // Prevent memory leak / ghost intervals on page navigation
//         window.addEventListener('beforeunload', () => {
//             if (this._pollingInterval) clearInterval(this._pollingInterval);
//         });
//     }

//     // ─────────────────────────────────────────────────────────────
//     //  Load user display — reads cached profile from auth.js
//     //  Zero network calls — profile was fetched during login / session check
//     // ─────────────────────────────────────────────────────────────
//     loadUserDisplay() {
//         const profile = Auth.getProfile();
//         this.updateUserDisplay(profile && profile.firstName ? profile : null);
//     }

//     // ─────────────────────────────────────────────────────────────
//     //  Load sidebar + header HTML
//     // ─────────────────────────────────────────────────────────────
//     async loadComponents() {
//         try {
//             const base = this._base;

//             const [sidebarHtml, headerHtml] = await Promise.all([
//                 fetch(`${base}sidebar.html`).then(r => r.text()),
//                 fetch(`${base}header.html`).then(r => r.text()),
//             ]);

//             document.getElementById('sidebar-container').innerHTML = sidebarHtml;
//             document.getElementById('header-container').innerHTML  = headerHtml;

//             if (typeof OrderBadge !== 'undefined') OrderBadge.render();

//             document.dispatchEvent(new Event('componentsLoaded'));
//         } catch (err) {
//             console.error('Error loading components:', err);
//             this._loadFallbackContent();
//         }
//     }

//     // ─────────────────────────────────────────────────────────────
//     //  Load modals HTML
//     // ─────────────────────────────────────────────────────────────
//     async loadModals() {
//         try {
//             const modalsHtml = await fetch(`${this._base}modals.html`).then(r => r.text());

//             let container = document.getElementById('modals-container');
//             if (!container) {
//                 container = document.createElement('div');
//                 container.id = 'modals-container';
//                 document.body.appendChild(container);
//             }
//             container.innerHTML = modalsHtml;

//             document.dispatchEvent(new Event('modalsLoaded'));
//         } catch (err) {
//             console.error('Error loading modals:', err);
//         }
//     }

//     _loadFallbackContent() {
//         const sidebarContainer = document.getElementById('sidebar-container');
//         const headerContainer  = document.getElementById('header-container');

//         if (sidebarContainer) {
//             sidebarContainer.innerHTML = `
//                 <aside class="bg-[#F8F8EA] w-72 h-screen fixed left-0 top-0 p-4">
//                     <div class="text-[#133F53] font-bold">Artezo</div>
//                 </aside>`;
//         }
//         if (headerContainer) {
//             headerContainer.innerHTML = `
//                 <header class="bg-[#F8F8EA] p-4">
//                     <h2 class="text-[#133F53]">Dashboard</h2>
//                 </header>`;
//         }
//     }

//     initializeElements() {
//         this.sidebar      = document.getElementById('sidebar');
//         this.collapseBtn  = document.getElementById('collapse-btn');
//         this.collapseIcon = document.getElementById('collapse-icon');
//         this.mobileToggle = document.getElementById('mobile-toggle');
//         this.mainContent  = document.querySelector('.flex-1');
//         this.navLinks     = document.querySelectorAll('.nav-link');
//         this.pageTitle    = document.getElementById('page-title');
//         this.logo         = document.getElementById('sidebar-logo');
//         this.logoutModal  = document.getElementById('logout-modal');
//     }

//     attachEvents() {
//         this.collapseBtn?.addEventListener('click', (e) => {
//             e.preventDefault();
//             this.toggleSidebar();
//         });

//         this.mobileToggle?.addEventListener('click', (e) => {
//             e.preventDefault();
//             this.toggleMobileSidebar();
//         });

//         window.addEventListener('resize', () => this.handleResize());

//         this.navLinks.forEach(link => {
//             link.addEventListener('click', () => {
//                 this.setActiveLink(link);
//                 if (window.innerWidth <= 1024) this.toggleMobileSidebar();
//             });
//         });

//         document.addEventListener('click', (e) => {
//             if (window.innerWidth <= 1024 && this.isMobileOpen) {
//                 if (!this.sidebar.contains(e.target) && !this.mobileToggle?.contains(e.target)) {
//                     this.toggleMobileSidebar();
//                 }
//             }
//         });
//     }

//     initSidebarState() {
//         const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
//         this.isCollapsed = collapsed;
//         this.updateLogo(collapsed);

//         if (collapsed && this.sidebar) {
//             this.sidebar.classList.add('sidebar-collapsed');
//             this.collapseIcon?.classList.replace('fa-chevron-left', 'fa-chevron-right');
//             this.mainContent?.classList.add('main-content-expanded');
//             this.mainContent?.classList.remove('main-content-normal');
//         }
//     }

//     updateLogo(isCollapsed) {
//         if (!this.logo) return;
//         if (isCollapsed) {
//             this.logo.src = '/assets/artezo_fevicon.jpeg';
//             this.logo.classList.remove('h-10');
//             this.logo.classList.add('h-8', 'w-8');
//         } else {
//             this.logo.src = '/assets/Artezo-logo.jpg';
//             this.logo.classList.remove('h-8', 'w-8');
//             this.logo.classList.add('h-10');
//         }
//     }

//     toggleSidebar() {
//         this.isCollapsed = !this.isCollapsed;

//         if (this.isCollapsed) {
//             this.sidebar?.classList.add('sidebar-collapsed');
//             this.collapseIcon?.classList.replace('fa-chevron-left', 'fa-chevron-right');
//             this.mainContent?.classList.add('main-content-expanded');
//             this.mainContent?.classList.remove('main-content-normal');
//         } else {
//             this.sidebar?.classList.remove('sidebar-collapsed');
//             this.collapseIcon?.classList.replace('fa-chevron-right', 'fa-chevron-left');
//             this.mainContent?.classList.remove('main-content-expanded');
//             this.mainContent?.classList.add('main-content-normal');
//         }

//         this.updateLogo(this.isCollapsed);
//         localStorage.setItem('sidebarCollapsed', String(this.isCollapsed));

//         window.dispatchEvent(new CustomEvent('sidebarToggle', {
//             detail: { collapsed: this.isCollapsed }
//         }));
//     }

//     toggleMobileSidebar() {
//         this.isMobileOpen = !this.isMobileOpen;
//         this.sidebar?.classList.toggle('mobile-open', this.isMobileOpen);
//         document.body.style.overflow = this.isMobileOpen ? 'hidden' : '';
//     }

//     setActiveLink(clickedLink) {
//         this.navLinks.forEach(link => {
//             link.classList.remove('active');
//             link.removeAttribute('data-active');
//         });
//         clickedLink.classList.add('active');
//         clickedLink.setAttribute('data-active', 'true');

//         const linkText = clickedLink.querySelector('.nav-text')?.textContent;
//         if (this.pageTitle && linkText) this.pageTitle.textContent = `${linkText} / Overview`;
//     }

//     checkActiveLink() {
//         const savedActiveLink = localStorage.getItem('activeLink');
//         const currentPath     = window.location.pathname;

//         this.navLinks.forEach(link => {
//             const linkText = link.querySelector('.nav-text')?.textContent;
//             const href     = link.getAttribute('href');

//             if (
//                 (currentPath === '/' && linkText === 'Dashboard') ||
//                 (savedActiveLink && linkText === savedActiveLink) ||
//                 (href && href === currentPath)
//             ) {
//                 this.setActiveLink(link);
//             }
//         });
//     }

//     handleResize() {
//         if (window.innerWidth <= 1024) {
//             this.sidebar?.classList.remove('sidebar-collapsed');
//             this.mainContent?.classList.remove('main-content-expanded', 'main-content-normal');
//             if (this.isCollapsed) {
//                 this.isCollapsed = false;
//                 localStorage.setItem('sidebarCollapsed', 'false');
//             }
//         } else {
//             if (this.isMobileOpen) {
//                 this.isMobileOpen = false;
//                 this.sidebar?.classList.remove('mobile-open');
//                 document.body.style.overflow = '';
//             }
//             if (this.mainContent) {
//                 this.mainContent.classList.toggle('main-content-expanded', this.isCollapsed);
//                 this.mainContent.classList.toggle('main-content-normal', !this.isCollapsed);
//             }
//         }
//     }

//     setupDropdown() {
//         const userMenuButton = document.getElementById('user-menu-button');
//         const userDropdown   = document.getElementById('user-dropdown');
//         const dropdownArrow  = document.getElementById('dropdown-arrow');

//         if (!userMenuButton || !userDropdown) return;

//         userMenuButton.addEventListener('click', (e) => {
//             e.stopPropagation();
//             this.isDropdownOpen = !this.isDropdownOpen;
//             userDropdown.classList.toggle('hidden', !this.isDropdownOpen);
//             if (dropdownArrow) {
//                 dropdownArrow.style.transform = this.isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)';
//             }
//         });

//         document.addEventListener('click', (e) => {
//             if (!userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
//                 userDropdown.classList.add('hidden');
//                 if (dropdownArrow) dropdownArrow.style.transform = 'rotate(0deg)';
//                 this.isDropdownOpen = false;
//             }
//         });

//         userDropdown.querySelectorAll('.dropdown-item').forEach(item => {
//             item.addEventListener('click', (e) => {
//                 e.preventDefault();
//                 if (item.textContent.trim().toLowerCase().includes('logout')) {
//                     this.openLogoutModal();
//                 }
//                 userDropdown.classList.add('hidden');
//                 if (dropdownArrow) dropdownArrow.style.transform = 'rotate(0deg)';
//                 this.isDropdownOpen = false;
//             });
//         });
//     }

//     setupModals() {
//         // intentionally empty — login handled by index.html + auth.js
//     }

//     // ─────────────────────────────────────────────────────────────
//     //  setupLogoutModal — no setTimeout needed: loadModals() awaited
//     //  before init() calls this, so the DOM is already ready
//     // ─────────────────────────────────────────────────────────────
//     setupLogoutModal() {
//         const cancelBtn  = document.getElementById('cancel-logout');
//         const confirmBtn = document.getElementById('confirm-logout');

//         cancelBtn?.addEventListener('click', () => this.closeLogoutModal());

//         confirmBtn?.addEventListener('click', async () => {
//             this.closeLogoutModal();
//             this.showNotification('Logging out…', 'info');
//             await Auth.logout();    // clears cookies + localStorage + redirects
//         });

//         window.addEventListener('click', (e) => {
//             if (e.target === this.logoutModal) this.closeLogoutModal();
//         });

//         document.addEventListener('keydown', (e) => {
//             if (e.key === 'Escape' && this.logoutModal && !this.logoutModal.classList.contains('hidden')) {
//                 this.closeLogoutModal();
//             }
//         });
//     }

//     openLogoutModal() {
//         if (this.logoutModal) {
//             this.logoutModal.classList.remove('hidden');
//             this.logoutModal.classList.add('flex');
//             document.body.style.overflow = 'hidden';
//         }
//     }

//     closeLogoutModal() {
//         if (this.logoutModal) {
//             this.logoutModal.classList.add('hidden');
//             this.logoutModal.classList.remove('flex');
//             document.body.style.overflow = '';
//         }
//     }

//     // ─────────────────────────────────────────────────────────────
//     //  Notification bell modal
//     // ─────────────────────────────────────────────────────────────


//     // ── Get adminId from your auth profile ──────────────────────
//     _getAdminId() {
//         const profile = Auth.getProfile();
//         return profile?.adminId || null;
//     }

//     setupNotificationModal() {
//     const bell    = document.getElementById('notification-bell');
//     const modal   = document.getElementById('notification-modal');
//     const markAll = document.getElementById('mark-all-read');
//     if (!bell || !modal) return;

//     let isOpen     = false;
//     let hasOpened  = false;   // tracks if dropdown was ever opened this session

//     // ── Initial badge fetch on page load ─────────────────────────
//     this.fetchNotificationsBadge();

//     // ── Polling every 2 minutes ───────────────────────────────────
//     this._pollingInterval = setInterval(async () => {
//         await this.fetchNotificationsBadge();

//         // Always refresh dropdown data in background so it's never stale
//         // whether open or closed — next open will have fresh data ready
//         if (hasOpened) {
//             await this.fetchNotifications(isOpen);  // pass isOpen to control DOM update
//         }
//     }, 2 * 60 * 1000);

//     bell.addEventListener('click', (e) => {
//         e.stopPropagation();
//         isOpen = !isOpen;
//         modal.classList.toggle('hidden', !isOpen);

//         if (isOpen) {
//             hasOpened = true;
//             this.fetchNotifications(true);   // always re-fetch on every open
//         }
//     });

//     document.addEventListener('click', (e) => {
//         if (!bell.contains(e.target) && !modal.contains(e.target)) {
//             modal.classList.add('hidden');
//             isOpen = false;
//         }
//     });

//     markAll?.addEventListener('click', (e) => {
//         e.preventDefault();
//         this._markAllNotificationsRead();
//     });

//     // ── Clean up on page unload ───────────────────────────────────
//     window.addEventListener('beforeunload', () => {
//         if (this._pollingInterval) clearInterval(this._pollingInterval);
//     });
// }

//     // ── Badge-only silent fetch ──────────────────────────────────
    
//     // ── Badge-only silent fetch ──────────────────────────────────
//     async fetchNotificationsBadge() {
//         const adminId = this._getAdminId();
//         if (!adminId) return;

//         const badge = document.getElementById('notification-badge');
//         if (!badge) return;

//         try {
//             const res = await fetch(`/api/notifications/alerts?adminId=${adminId}`);
//             if (!res.ok) {
//                 badge.classList.add('hidden');
//                 return;
//             }

//             const data = await res.json();
//             const count = parseInt(data.totalUnread) || 0;

//             badge.textContent = count;

//             if (count > 0) {
//                 // Show badge with proper colors
//                 badge.classList.remove('hidden');
//                 badge.classList.add('bg-[#D89F34]', 'text-[#133F53]');
//             } else {
//                 // Hide badge completely when count is 0
//                 badge.classList.add('hidden');
//                 // Optional: remove colors when hidden (cleaner)
//                 badge.classList.remove('bg-[#D89F34]', 'text-[#133F53]');
//             }

//             console.log("Badge updated →", count);

//         } catch (err) {
//             console.warn('Badge poll failed:', err);
//             badge.classList.add('hidden');
//             badge.classList.remove('bg-[#D89F34]', 'text-[#133F53]');
//         }
//     }


//     // ─────────────────────────────────────────────────────────────
//     //  fetchNotifications — called on bell click (lazy load)
//     // ─────────────────────────────────────────────────────────────
//     // ── Full dropdown fetch ──────────────────────────────────────
//     async fetchNotifications(renderDOM = true) {
//     const adminId = this._getAdminId();
//     const list    = document.getElementById('notification-list');
//     const badge   = document.getElementById('notification-badge');
   
//     if (!list || !adminId) return;

//     // Only show loading spinner if dropdown is visible
//     if (renderDOM) {
//         list.innerHTML = `
//             <div class="px-4 py-6 text-center">
//                 <p class="text-sm" style="color:#957A54;">Loading...</p>
//             </div>`;
//     }

//     try {
//         const res = await fetch(`/api/notifications/alerts?adminId=${adminId}`);
//         if (!res.ok) throw new Error('Failed');
//         const data = await res.json();
//         this._lastNotifData = data;   // always cache latest data

//         // Only touch the DOM if dropdown is visible
//         if (renderDOM) {
//             list.innerHTML = '';

//             const allItems = [
//                 ...data.lowStock.map(item => ({
//                     icon: 'fa-solid fa-boxes-stacked',
//                     fingerprint: item.fingerprint,
//                     visited: item.visited,
//                     message: `<span style="background:rgba(220,38,38,0.1);color:#dc2626;border:1px solid rgba(220,38,38,0.25);padding:1px 7px;border-radius:999px;font-size:11px;font-weight:600;">Low stock</span> <strong>${item.productName}</strong> — only <strong style="color:#dc2626">${item.availableStock}</strong> left (threshold: ${item.lowStockThreshold})`,
//                     time: 'Inventory alert',
//                     visitLink: '/Inventory_Management/inventory.html'
//                 })),
//                 ...data.recentUsers.map(u => ({
//                     icon: 'fa-solid fa-user',
//                     fingerprint: u.fingerprint,
//                     visited: u.visited,
//                     message: `New user registered: <strong>${u.firstName} ${u.lastName}</strong>`,
//                     time: this._timeAgo(u.createdAt),
//                     visitLink: '/User_Management/user.html'
//                 })),
//                 ...data.contactEnquiries.map(c => ({
//                     icon: 'fa-solid fa-envelope',
//                     fingerprint: c.fingerprint,
//                     visited: c.visited,
//                     message: `Contact enquiry from <strong>${c.name}</strong>: ${c.messagePreview}`,
//                     time: this._timeAgo(c.createdAt),
//                     visitLink: '/Contact_Management/contact.html'
//                 }))
//             ];

//             const visibleItems = allItems.filter(i => !i.visited);

//             if (visibleItems.length === 0) {
//                 list.innerHTML = `
//                     <div class="px-4 py-6 text-center">
//                         <p class="text-sm" style="color:#957A54;">No new notifications</p>
//                     </div>`;
//             } else {
//                 visibleItems.forEach(item => {
//                     const el = document.createElement('div');
//                     el.className = 'px-4 py-3 hover:bg-[#F8F8EA] transition-colors rounded-lg m-2 border border-[#D89F34] notification-item unread';
//                     el.innerHTML = `
//                         <div class="flex items-start gap-3">
//                             <div class="w-8 h-8 rounded-full bg-[#D89F34] bg-opacity-20 flex items-center justify-center flex-shrink-0">
//                                 <i class="${item.icon} text-sm" style="color:#D89F34;"></i>
//                             </div>
//                             <div class="flex-1">
//                                 <p class="text-sm" style="color:#133F53;">${item.message}</p>
//                                 <div class="flex justify-between">
//                                     <p class="text-xs mt-1" style="color:#957A54;">${item.time}</p>
//                                     <a href="${item.visitLink}"
//                                         title="click to see"
//                                         data-fingerprint="${item.fingerprint}"
//                                         class="visit-btn border border-[#D89F34] inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-1 rounded-md"
//                                         style="color:#133F53;background:rgba(216,159,52,0.15);">
//                                             <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
//                                             Visit
//                                     </a>
//                                 </div>
                                
//                             </div>
//                             <div class="w-2 h-2 rounded-full bg-[#D89F34] unread-dot flex-shrink-0 mt-1"></div>
//                         </div>`;

//                     el.querySelector('.visit-btn').addEventListener('click', async (e) => {
//                         e.preventDefault();
//                         const fp   = e.currentTarget.dataset.fingerprint;
//                         const href = e.currentTarget.getAttribute('href');
//                         await fetch(`/api/notifications/visit?adminId=${adminId}&fingerprint=${encodeURIComponent(fp)}`, {
//                             method: 'POST'
//                         });
//                         window.location.href = href;
//                     });

//                     list.appendChild(el);
//                 });
//             }
//         }

//         // Always update badge regardless of renderDOM
//         if (badge) {
//             badge.textContent = data.totalUnread;
//             badge.classList.toggle('hidden', data.totalUnread === 0);
//         }

//     } catch (err) {
//         console.error('Notification fetch failed:', err);
//         if (renderDOM) {
//             list.innerHTML = `
//                 <div class="px-4 py-6 text-center">
//                     <p class="text-sm text-red-500">Failed to load notifications</p>
//                 </div>`;
//         }
//     }
// }

//     // ── Mark all read — hits backend, then re-fetches ────────────
//     async _markAllNotificationsRead() {
//         const adminId = this._getAdminId();
//         if (!adminId) return;

//         try {
//             await fetch(`/api/notifications/mark-all-read?adminId=${adminId}`, {
//                 method: 'POST'
//             });
//             // Re-fetch so UI reflects DB state immediately
//             await this.fetchNotifications();
//             this.showNotification('All notifications marked as read', 'success');
//         } catch (err) {
//             console.error('Mark all read failed:', err);
//         }
//     }

    

//     // ── Relative time helper ─────────────────────────────────────
//     _timeAgo(isoString) {
//         if (!isoString) return '';
//         const date = new Date(isoString);
//         const diff = Math.floor((Date.now() - date.getTime()) / 1000);
//         if (diff < 60)   return 'Just now';
//         if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
//         if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
//         return `${Math.floor(diff / 86400)} days ago`;
//     }

//     // ─────────────────────────────────────────────────────────────
//     //  updateUserDisplay — profile shape: { adminId, firstName, lastName, mobile, role }
//     // ─────────────────────────────────────────────────────────────
//     updateUserDisplay(user) {
//         const btn = document.getElementById('user-menu-button');
//         if (!btn) return;

//         const initialsEl  = btn.querySelector('div:first-child');
//         const nameEl      = btn.querySelector('span.text-sm');
//         const dropdown    = document.getElementById('user-dropdown');
//         const logoutBtn   = document.getElementById('logout-btn');

//         if (user) {
//             const initials = ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase();
//             const fullName = `${user.firstName} ${user.lastName || ''}`.trim();

//             if (initialsEl) initialsEl.textContent = initials;
//             if (nameEl)     nameEl.textContent     = fullName;

//             if (dropdown) {
//                 const nameP = dropdown.querySelector('.px-4.py-2 p:first-child');
//                 const roleP = dropdown.querySelector('.px-4.py-2 p:last-child');
//                 if (nameP) nameP.textContent = fullName;
//                 if (roleP) roleP.textContent = user.role || 'ADMIN';
//             }

//             if (logoutBtn) logoutBtn.style.display = 'flex';
//         } else {
//             if (initialsEl) initialsEl.textContent = 'G';
//             if (nameEl)     nameEl.textContent     = 'Guest';

//             if (dropdown) {
//                 const nameP = dropdown.querySelector('.px-4.py-2 p:first-child');
//                 const roleP = dropdown.querySelector('.px-4.py-2 p:last-child');
//                 if (nameP) nameP.textContent = 'Guest User';
//                 if (roleP) roleP.textContent = '';
//             }

//             if (logoutBtn) logoutBtn.style.display = 'none';
//         }
//     }

//     showNotification(message, type = 'info') {
//         const colors = { success: '#10B981', error: '#EF4444', info: '#3B82F6' };
//         const icons  = { success: 'fa-regular fa-circle-check', error: 'fa-solid fa-circle-exclamation', info: 'fa-solid fa-circle-info' };

//         const el = document.createElement('div');
//         el.className = 'fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50';
//         el.style.cssText = `background:${colors[type] || colors.info};color:#fff`;
//         el.innerHTML = `
//             <div class="flex items-center gap-2">
//                 <i class="${icons[type] || icons.info}"></i>
//                 <span class="text-sm">${message}</span>
//             </div>`;

//         document.body.appendChild(el);
//         setTimeout(() => {
//             el.style.opacity = '0';
//             el.style.transition = 'opacity 0.3s ease';
//             setTimeout(() => el.remove(), 300);
//         }, 3000);
//     }

//     setPageTitle(title) {
//         if (this.pageTitle) this.pageTitle.textContent = title;
//     }

//     isSidebarCollapsed() {
//         return this.isCollapsed;
//     }
// }

// if (typeof module !== 'undefined' && module.exports) {
//     module.exports = LayoutComponents;
// }


// // ─────────────────────────────────────────────────────────────────────────────
// //  PAGE LOADER
// // ─────────────────────────────────────────────────────────────────────────────
// class PageLoader {
//     constructor() {
//         this.loader = document.getElementById('page-loader');
//         this.init();
//     }

//     init() {
//         if (document.readyState === 'complete') {
//             this.hideLoader();
//         } else {
//             window.addEventListener('load', () => this.hideLoader());
//         }
//         this._setupNavigationListeners();
//         this._setupHistoryListeners();
//     }

//     showLoader() {
//         if (this.loader) {
//             this.loader.classList.remove('hidden-loader');
//             this.loader.style.cssText = 'opacity:1;visibility:visible';
//             document.body.style.overflow = 'hidden';
//         }
//     }

//     hideLoader() {
//         if (this.loader) {
//             this.loader.style.opacity = '0';
//             setTimeout(() => {
//                 this.loader.classList.add('hidden-loader');
//                 this.loader.style.visibility = 'hidden';
//                 document.body.style.overflow = '';
//             }, 300);
//         }
//     }

//     _setupNavigationListeners() {
//         document.addEventListener('click', (e) => {
//             const link = e.target.closest('a');
//             if (!link) return;
//             const href = link.getAttribute('href');
//             if (!href
//                 || href.startsWith('http')
//                 || href.startsWith('#')
//                 || link.getAttribute('target') === '_blank'
//                 || link.hasAttribute('download')) return;
//             this.showLoader();
//         });
//     }

//     _setupHistoryListeners() {
//         window.navigation?.addEventListener('navigate', (e) => {
//             if (!e.hashChange && !e.formData) this.showLoader();
//         });
//         window.addEventListener('popstate',  () => this.showLoader());
//         window.addEventListener('pageshow',  (e) => { if (e.persisted) this.hideLoader(); });
//     }

//     static show() { window.pageLoader?.showLoader(); }
//     static hide() { window.pageLoader?.hideLoader(); }
// }

// // PageLoader gets its own DOMContentLoaded — completely independent of LayoutComponents
// document.addEventListener('DOMContentLoaded', () => {
//     window.pageLoader = new PageLoader();
// });


// // ─────────────────────────────────────────────────────────────────────────────
// //  STYLES
// // ─────────────────────────────────────────────────────────────────────────────
// if (!document.querySelector('#loader-style')) {
//     const style = document.createElement('style');
//     style.id = 'loader-style';
//     style.textContent = `
//         #page-loader { transition: opacity 0.3s ease, visibility 0.3s ease; z-index: 9999; }
//         #page-loader.hidden-loader { visibility: hidden; pointer-events: none; }
//         body.loading * { pointer-events: none; }
//         #notification-modal {
//             max-width: 320px;
//             transform-origin: top right;
//             animation: notifFadeIn 0.2s ease;
//         }
//         @keyframes notifFadeIn {
//             from { opacity: 0; transform: scale(0.95) translateY(-10px); }
//             to   { opacity: 1; transform: scale(1)    translateY(0);     }
//         }
//         .notification-item { transition: background-color 0.2s; }
//         .notification-item.unread { background-color: rgba(216,159,52,0.05); }
//         #notification-modal::-webkit-scrollbar { width: 4px; }
//         #notification-modal::-webkit-scrollbar-track { background:#f1f1f1; border-radius:4px; }
//         #notification-modal::-webkit-scrollbar-thumb { background:#D89F34; border-radius:4px; }
//         #notification-modal::-webkit-scrollbar-thumb:hover { background:#957A54; }
//         #notification-badge.hidden { display: none; }
//     `;
//     document.head.appendChild(style);
// }
