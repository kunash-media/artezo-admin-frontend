/**
 * auth.js — centralized authentication module
 *
 * Usage: include on EVERY page
 *   <script src="/auth.js"></script>
 *
 * Protected pages:
 *   Auth.requireLogin();        — redirects to login if not authenticated
 *
 * Login page only:
 *   Auth.redirectIfLoggedIn();  — redirects to dashboard if already logged in
 */

const Auth = (() => {

  const BASE_URL    = '';             // empty = same origin via Live Server proxy
  const LOGIN_PAGE  = '/index.html';
  const DASHBOARD_PAGE = '/dashboard.html';

  // ─────────────────────────────────────────────────────────────
  //  CORE: authenticated API calls with silent refresh on 401
  // ─────────────────────────────────────────────────────────────
  async function apiFetch(path, options = {}) {
    const config = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    let response = await fetch(`${BASE_URL}${path}`, config);

    // skip refresh logic for all auth endpoints to avoid loops
    const isAuthPath = path.includes('/api/admin/auth/');
    if (response.status === 401 && !isAuthPath) {
      const onLoginPage = window.location.pathname === '/index.html'
                       || window.location.pathname === '/';

      if (onLoginPage) return response;

      const refreshed = await _silentRefresh();
      if (refreshed) {
        response = await fetch(`${BASE_URL}${path}`, config);
      } else {
        _clearSession();
        window.location.href = LOGIN_PAGE;
        return null;
      }
    }

    return response;
  }

  // ─────────────────────────────────────────────────────────────
  //  LOGIN
  // ─────────────────────────────────────────────────────────────
  async function login(mobile, password) {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // store only non-sensitive display info — token is in HttpOnly cookie
        localStorage.setItem('admin_mobile', data.mobile  || mobile);
        localStorage.setItem('admin_id',     data.adminId || '');
        localStorage.setItem('admin_role',   data.role    || '');

        // fetch and cache full profile using adminId returned from login
        if (data.adminId) await _fetchAndStoreProfile(data.adminId);

        return { success: true, data };
      } else {
        return { success: false, message: data.message || data.error || 'Login failed' };
      }
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Network error. Is the server running?' };
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  LOGOUT
  // ─────────────────────────────────────────────────────────────
  async function logout() {
    try {
      // raw fetch — bypass apiFetch to avoid redirect loop on 401
      await fetch(`${BASE_URL}/api/admin/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.warn('Logout request failed, clearing session anyway');
    } finally {
      _clearSession();
      window.location.href = LOGIN_PAGE;  // always redirect regardless
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  SESSION CHECK
  //  pings a protected endpoint — 200 = valid cookie, 401 = not logged in
  // ─────────────────────────────────────────────────────────────
  async function isAuthenticated() {
    try {
      const adminId = localStorage.getItem('admin_id');
      if (!adminId) return false;

      const response = await fetch(`${BASE_URL}/api/admin/get-admin-by-adminId/${adminId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        _storeProfile(data);   // keep profile fresh on every session check
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  ROUTE GUARDS
  // ─────────────────────────────────────────────────────────────

  async function requireLogin() {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      window.location.href = LOGIN_PAGE;
    }
    return authenticated;
  }

  async function redirectIfLoggedIn() {
    const authenticated = await isAuthenticated();
    if (authenticated) {
      window.location.href = DASHBOARD_PAGE;
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  INTERNAL HELPERS
  // ─────────────────────────────────────────────────────────────

  async function _silentRefresh() {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async function _fetchAndStoreProfile(adminId) {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/get-admin-by-adminId/${adminId}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        _storeProfile(data);
      }
    } catch {
      console.warn('Could not fetch admin profile');
    }
  }

  function _storeProfile(data) {
    const profile = {
      adminId:   data.adminId            || '',
      firstName: data.adminFirstName     || '',
      lastName:  data.adminLastName      || '',
      mobile:    data.adminMobileNumber  || '',
      role:      data.adminRole          || '',
    };
    localStorage.setItem('admin_profile', JSON.stringify(profile));
  }

  function _clearSession() {
    localStorage.removeItem('admin_mobile');
    localStorage.removeItem('admin_id');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_profile');
  }

  // ─────────────────────────────────────────────────────────────
  //  PUBLIC GETTERS
  // ─────────────────────────────────────────────────────────────

  function getMobile() {
    return localStorage.getItem('admin_mobile') || '';
  }

  function getProfile() {
    try {
      return JSON.parse(localStorage.getItem('admin_profile')) || null;
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  PUBLIC API
  // ─────────────────────────────────────────────────────────────
  return {
    login,
    logout,
    isAuthenticated,
    requireLogin,
    redirectIfLoggedIn,
    apiFetch,
    getMobile,
    getProfile,
  };

})();