// order-badge.js
// Polls the orders API every 60s from ANY page to detect new orders.
// Shows a gold badge on "Order Management" nav link when new orders arrive.
// Badge clears when user visits orders.html (pagehide sets ob_seen = ob_total).
//
// Flow:
//   Every page → polls API → updates ob_total in localStorage
//   Badge = ob_total - ob_seen  (ob_seen only updates when orders.html is left)
//   orders.html pagehide → ob_seen = ob_total → badge gone on next render

const OrderBadge = (() => {

    const KEY_TOTAL   = 'ob_total';
    const KEY_SEEN    = 'ob_seen';
    const API_URL     = 'http://localhost:8085/api/orders/admin/get-all-orders?page=0&size=1';
    const POLL_MS     = 60000; // poll every 60 seconds
    const TAG         = '[OrderBadge]';

    let _pollTimer = null;

    console.log(TAG, '✅ Loaded on:', window.location.pathname);

    // ── Safe localStorage helpers ─────────────────────────────────────────────
    function lsGet(key) {
        try { return localStorage.getItem(key); }
        catch(e) { console.warn(TAG, 'lsGet blocked:', e.message); return null; }
    }
    function lsSet(key, val) {
        try { localStorage.setItem(key, val); return true; }
        catch(e) { console.warn(TAG, 'lsSet blocked:', e.message); return false; }
    }

    // ── Fetch latest total from API (lightweight — size=1, only reads totalElements) ──
    async function _fetchTotal() {
        try {
            const res = await fetch(API_URL, { credentials: 'include' });
            if (!res.ok) { console.warn(TAG, '_fetchTotal: HTTP', res.status); return null; }
            const json = await res.json();
            const total = json?.data?.page?.totalElements ?? null;
            console.log(TAG, '_fetchTotal() →', total);
            return total;
        } catch(e) {
            console.warn(TAG, '_fetchTotal error:', e.message);
            return null;
        }
    }

    // ── Core: fetch → store → repaint badge ──────────────────────────────────
    async function _poll() {
        const total = await _fetchTotal();
        if (total === null) return; // network error, skip

        const prevTotal = parseInt(lsGet(KEY_TOTAL) ?? '-1', 10);
        const seen      = parseInt(lsGet(KEY_SEEN)  ?? '-1', 10);

        console.log(TAG, `_poll() → fetched=${total}, stored ob_total=${prevTotal}, ob_seen=${seen}`);

        // First ever poll — seed both keys, no badge
        if (prevTotal === -1 || seen === -1) {
            lsSet(KEY_TOTAL, String(total));
            lsSet(KEY_SEEN,  String(total));
            console.log(TAG, 'First ever poll — seeding both keys to', total);
            _repaint();
            return;
        }

        lsSet(KEY_TOTAL, String(total));

        const diff = Math.max(0, total - seen);
        console.log(TAG, `diff=${diff} → badge will show: ${diff > 0}`);
        _repaint();
    }

    // ── Start polling (call once from components.js after sidebar loads) ──────
    function startPolling() {
        console.log(TAG, 'startPolling() — immediate poll + every', POLL_MS / 1000, 's');
        _poll(); // run immediately
        _pollTimer = setInterval(_poll, POLL_MS);
    }

    // ── Stop polling (optional cleanup) ──────────────────────────────────────
    function stopPolling() {
        if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
    }

    // ── Called by orders.html setTotal() after fetching all orders ────────────
    // Updates ob_total with exact count from full fetch (more accurate than size=1)
    function setTotal(currentTotal) {
        console.log(TAG, 'setTotal() called from orders.html with:', currentTotal);
        lsSet(KEY_TOTAL, String(currentTotal));
        // Do NOT touch ob_seen here — that happens on pagehide
        _updateDOM(0); // hide badge while user is ON orders page
    }

    // ── Called via pagehide on orders.html — user is navigating away ──────────
    function markVisited() {
        const total = parseInt(lsGet(KEY_TOTAL) ?? '0', 10);
        console.log(TAG, 'markVisited() — setting ob_seen =', total);
        lsSet(KEY_SEEN, String(total));
    }

    // ── Called by components.js after sidebar is in DOM (replaces old render) ─
    function render() {
        _repaint();
        startPolling();
    }

    // ── Read stored values and paint badge ────────────────────────────────────
    function _repaint() {
        const total = parseInt(lsGet(KEY_TOTAL) ?? '0', 10);
        const seen  = parseInt(lsGet(KEY_SEEN)  ?? '0', 10);
        const diff  = Math.max(0, total - seen);
        console.log(TAG, `_repaint() → total=${total}, seen=${seen}, diff=${diff}`);
        _updateDOM(diff);
    }

    // ── Find Order Management nav link via .nav-text span ────────────────────
    function _findOrderLink() {
        for (const span of document.querySelectorAll('.nav-link .nav-text')) {
            if (span.textContent.trim() === 'Order Management') {
                return span.closest('.nav-link');
            }
        }
        return null;
    }

    // ── Paint or hide badge on the nav link ──────────────────────────────────
    function _updateDOM(count) {
        const tryPaint = () => {
            const link = _findOrderLink();
            if (!link) return false;

            link.style.display    = 'flex';
            link.style.alignItems = 'center';

            const icon      = link.querySelector('i');
            const navText   = link.querySelector('.nav-text');
            const sidebar   = document.getElementById('sidebar');
            const collapsed = sidebar?.classList.contains('sidebar-collapsed');

            // Always find or create badge
            let badge = document.querySelector('.ob-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'ob-badge';
            } else {
                badge.remove(); // reposition cleanly each time
            }

            if (collapsed && icon) {
                // Collapsed mode: tiny dot on top-right corner of the icon
                icon.style.position = 'relative';
                icon.style.display  = 'inline-block';
                icon.appendChild(badge);
                badge.style.cssText = [
                    'position:absolute',
                    'top:-5px',
                    'right:-7px',
                    'display:none',
                    'align-items:center',
                    'justify-content:center',
                    'min-width:14px',
                    'height:14px',
                    'border-radius:9999px',
                    'background:#D89F34',
                    'color:#133F53',
                    'font-size:8px',
                    'font-weight:700',
                    'padding:0 3px',
                    'line-height:1',
                    'box-shadow:0 0 0 2px #F8F8EA',
                ].join(';');
            } else {
                // Expanded mode: inline pill right after the nav-text, tight margin
                if (navText) {
                    navText.after(badge);
                } else {
                    link.appendChild(badge);
                }
                badge.style.cssText = [
                    'position:static',
                    'display:none',
                    'align-items:center',
                    'justify-content:center',
                    'min-width:18px',
                    'height:18px',
                    'border-radius:9999px',
                    'background:#D89F34',
                    'color:#133F53',
                    'font-size:10px',
                    'font-weight:700',
                    'padding:0 5px',
                    'margin-left:4px',
                    'line-height:1',
                    'flex-shrink:0',
                    'box-shadow:0 0 0 2px #F8F8EA',
                ].join(';');
            }

            if (count > 0) {
                badge.textContent   = count > 99 ? '99+' : String(count);
                badge.style.display = 'inline-flex';
                console.log(TAG, '✅ Badge SHOWN:', badge.textContent, collapsed ? '(collapsed)' : '(expanded)');
            } else {
                badge.style.display = 'none';
                console.log(TAG, 'Badge hidden');
            }
            return true;
        };

        if (!tryPaint()) {
            const observer = new MutationObserver(() => {
                if (tryPaint()) observer.disconnect();
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        // Re-run when sidebar collapses/expands so badge repositions
        window.addEventListener('sidebarToggle', () => _updateDOM(count), { once: true });
    }

    return { render, setTotal, markVisited, stopPolling };
})();