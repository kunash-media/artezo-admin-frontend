// js/auth.js

// Mock user database
const users = [
    { 
        email: 'super@artezo.com', 
        password: 'password123', 
        name: 'Super Admin', 
        role: 'super_admin', 
        avatar: 'SA',
        modules: ['dashboard', 'products', 'inventory', 'orders', 'coupons', 'banners', 'users', 'reports', 'contacts', 'admins']
    },
    { 
        email: 'admin@artezo.com', 
        password: 'password123', 
        name: 'Admin User', 
        role: 'admin', 
        avatar: 'AU',
        modules: ['dashboard', 'products', 'inventory', 'orders', 'coupons', 'banners', 'users', 'reports', 'contacts']
    },
    { 
        email: 'manager@artezo.com', 
        password: 'password123', 
        name: 'Manager User', 
        role: 'manager', 
        avatar: 'MU',
        modules: ['dashboard', 'products', 'inventory', 'orders', 'coupons', 'banners', 'reports', 'contacts']
    },
];

// Authentication functions
window.auth = {
    // Get current user
    getCurrentUser: function() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Login function
    login: function(email, password) {
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            const userInfo = {
                id: Date.now(),
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                modules: user.modules
            };

            localStorage.setItem('currentUser', JSON.stringify(userInfo));
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('userModules', JSON.stringify(user.modules));
            
            return { success: true, user: userInfo };
        }
        
        return { success: false, error: 'Invalid credentials' };
    },

    // Logout function
    logout: function() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userModules');
        window.location.href = 'login.html';
    },

    // Check if user is logged in
    isAuthenticated: function() {
        return !!localStorage.getItem('currentUser');
    },

    // Format role name
    formatRole: function(role) {
        if (!role) return 'Administrator';
        return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
};