// // roles.js - Define roles and their permissions
// const ROLES = {
//     SUPER_ADMIN: 'super_admin',
//     ADMIN: 'admin',
//     MANAGER: 'manager',
//     EDITOR: 'editor',
//     VIEWER: 'viewer'
// };

// const PERMISSIONS = {
//     [ROLES.SUPER_ADMIN]: {
//         dashboard: ['view', 'export'],
//         products: ['create', 'read', 'update', 'delete', 'export'],
//         inventory: ['create', 'read', 'update', 'delete', 'export'],
//         orders: ['create', 'read', 'update', 'delete', 'export', 'cancel'],
//         coupons: ['create', 'read', 'update', 'delete', 'export'],
//         banners: ['create', 'read', 'update', 'delete', 'export'],
//         users: ['create', 'read', 'update', 'delete', 'export'],
//         reports: ['view', 'export', 'generate'],
//         contacts: ['read', 'update', 'delete', 'reply', 'export'],
//         admins: ['create', 'read', 'update', 'delete', 'export'], // Only super admin
//         settings: ['read', 'update'] // Only super admin
//     },
    
//     [ROLES.ADMIN]: {
//         dashboard: ['view'],
//         products: ['create', 'read', 'update', 'delete', 'export'],
//         inventory: ['create', 'read', 'update', 'export'],
//         orders: ['create', 'read', 'update', 'export'],
//         coupons: ['create', 'read', 'update', 'delete', 'export'],
//         banners: ['create', 'read', 'update', 'delete', 'export'],
//         users: ['read', 'update', 'export'],
//         reports: ['view', 'export'],
//         contacts: ['read', 'update', 'reply', 'export'],
//         admins: [], // No access
//         settings: [] // No access
//     },
    
//     [ROLES.MANAGER]: {
//         dashboard: ['view'],
//         products: ['read', 'update'],
//         inventory: ['read', 'update'],
//         orders: ['read', 'update'],
//         coupons: ['read', 'update'],
//         banners: ['read', 'update'],
//         users: ['read'],
//         reports: ['view'],
//         contacts: ['read', 'reply'],
//         admins: [], // No access
//         settings: [] // No access
//     },
    
//     [ROLES.EDITOR]: {
//         dashboard: ['view'],
//         products: ['read', 'update'],
//         banners: ['create', 'read', 'update'],
//         coupons: ['read'],
//         contacts: ['read', 'reply'],
//         // Rest have no access
//         inventory: [],
//         orders: [],
//         users: [],
//         reports: [],
//         admins: [],
//         settings: []
//     },
    
//     [ROLES.VIEWER]: {
//         dashboard: ['view'],
//         products: ['read'],
//         inventory: ['read'],
//         orders: ['read'],
//         coupons: ['read'],
//         banners: ['read'],
//         users: ['read'],
//         reports: ['view'],
//         contacts: ['read'],
//         // No write access
//         admins: [],
//         settings: []
//     }
// };