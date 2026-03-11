let currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (currentUser) {
    setTimeout(() => {
        setupDashboard();
        showView('dashboard-container');
    }, 100);
}
let currentView = 'dashboard';
let cart = [];
let selectedSupplierId = null;
let notifications = [];
let dataCache = {};

// Initialize Lucide icons
function initIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Skeleton Loader
function showSkeleton(view) {
    // Only show skeleton if we don't have cached data for this view
    if (dataCache[view]) return;

    const area = document.getElementById('main-content-area');
    let html = '';

    const header = `
        <div class="space-y-8 animate-pulse">
            <div class="h-8 bg-slate-200 rounded w-1/3 mb-8"></div>
    `;

    if (view === 'dashboard') {
        html = `
            ${header}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="h-32 bg-slate-200 rounded-xl"></div>
                <div class="h-32 bg-slate-200 rounded-xl"></div>
                <div class="h-32 bg-slate-200 rounded-xl"></div>
            </div>
            <div class="h-24 bg-slate-200 rounded-xl mt-6"></div>
        </div>`;
    } else if (view === 'available' || view === 'stock' || view === 'orders' || view === 'customers') {
        html = `
            ${header}
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div class="h-12 bg-slate-100 border-b border-slate-200"></div>
                <div class="p-6 space-y-4">
                    <div class="h-12 bg-slate-50 rounded"></div>
                    <div class="h-12 bg-slate-50 rounded"></div>
                    <div class="h-12 bg-slate-50 rounded"></div>
                    <div class="h-12 bg-slate-50 rounded"></div>
                    <div class="h-12 bg-slate-50 rounded"></div>
                </div>
            </div>
        </div>`;
    } else if (view === 'suppliers') {
        html = `
            ${header}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="h-40 bg-slate-200 rounded-xl"></div>
                <div class="h-40 bg-slate-200 rounded-xl"></div>
                <div class="h-40 bg-slate-200 rounded-xl"></div>
                <div class="h-40 bg-slate-200 rounded-xl"></div>
                <div class="h-40 bg-slate-200 rounded-xl"></div>
                <div class="h-40 bg-slate-200 rounded-xl"></div>
            </div>
        </div>`;
    } else if (view === 'billing') {
        html = `
            ${header}
            <div class="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div class="h-8 bg-slate-100 w-1/2 rounded"></div>
                <div class="flex gap-4">
                    <div class="h-10 bg-slate-100 flex-1 rounded"></div>
                    <div class="h-10 bg-slate-100 w-32 rounded"></div>
                    <div class="h-10 bg-slate-100 w-24 rounded"></div>
                </div>
                <div class="h-64 bg-slate-50 rounded"></div>
            </div>
        </div>`;
    } else if (view === 'cart') {
        html = `
            ${header}
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 space-y-4">
                    <div class="h-24 bg-slate-200 rounded-xl"></div>
                    <div class="h-24 bg-slate-200 rounded-xl"></div>
                    <div class="h-24 bg-slate-200 rounded-xl"></div>
                </div>
                <div class="h-64 bg-slate-200 rounded-xl"></div>
            </div>
        </div>`;
    } else if (view === 'profile') {
        html = `
            <div class="max-w-md mx-auto space-y-8 animate-pulse">
                <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <div class="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4"></div>
                    <div class="h-8 bg-slate-200 w-1/2 mx-auto mb-2 rounded"></div>
                    <div class="h-4 bg-slate-200 w-1/3 mx-auto rounded"></div>
                    <div class="mt-8 space-y-4">
                        <div class="h-16 bg-slate-50 rounded-xl"></div>
                        <div class="h-16 bg-slate-50 rounded-xl"></div>
                    </div>
                </div>
            </div>`;
    } else {
        // Default spinner for unknown views
        html = '<div class="flex items-center justify-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div></div>';
    }

    area.innerHTML = html;
}

// Navigation
function showView(viewId) {
    const authContainer = document.getElementById('auth-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const authViews = ['login-form', 'register-form', 'otp-form'];

    if (viewId === 'dashboard-container') {
        authContainer.classList.add('hidden');
        dashboardContainer.classList.remove('hidden');
    } else {
        dashboardContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
        authViews.forEach(v => document.getElementById(v).classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
    }
    initIcons();
}

// Auth Logic
document.getElementById('go-to-register').onclick = () => showView('register-form');
document.getElementById('back-to-login').onclick = () => showView('login-form');

document.getElementById('login-form-element').onsubmit = async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value;
    const password = document.getElementById('login-password').value;
    const role = document.getElementById('login-role').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password, role })
        });
        const data = await res.json();
        if (res.ok) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            setupDashboard();
            showView('dashboard-container');
        } else {
            errorDiv.textContent = data.error;
            errorDiv.classList.remove('hidden');
        }
    } catch (err) {
        errorDiv.textContent = 'Connection failed';
        errorDiv.classList.remove('hidden');
    }
};

document.getElementById('register-form-element').onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const role = document.getElementById('reg-role').value;
    const errorDiv = document.getElementById('register-error');

    if (password !== confirm) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.classList.remove('hidden');
        return;
    }

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, phone, password, role })
        });
        const data = await res.json();
        if (res.ok) {
            window.tempUserId = data.id;
            showView('otp-form');
        } else {
            errorDiv.textContent = data.error;
            errorDiv.classList.remove('hidden');
        }
    } catch (err) {
        errorDiv.textContent = 'Registration failed';
        errorDiv.classList.remove('hidden');
    }
};

document.getElementById('verify-otp-btn').onclick = async () => {
    const otpInputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(otpInputs).map(i => i.value).join('');
    const errorDiv = document.getElementById('otp-error');

    try {
        const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: window.tempUserId, otp })
        });
        if (res.ok) {
            showView('login-form');
        } else {
            errorDiv.textContent = 'Invalid OTP (Try 123456)';
            errorDiv.classList.remove('hidden');
        }
    } catch (err) {
        errorDiv.textContent = 'Verification failed';
        errorDiv.classList.remove('hidden');
    }
};

document.getElementById('logout-btn').onclick = () => {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showView('login-form');
};

// Dashboard Logic
function refreshHeader() {
    if (!currentUser) return;
    const username = currentUser.username || 'User';
    const role = currentUser.role || 'member';
    
    document.getElementById('user-display-name').textContent = username;
    document.getElementById('user-display-role').textContent = role;
    const avatar = document.getElementById('user-avatar');
    avatar.textContent = (username[0] || '?').toUpperCase();
    avatar.classList.add('cursor-pointer', 'hover:bg-stone-200', 'transition-colors');
    avatar.onclick = () => {
        currentView = 'profile';
        document.getElementById('current-view-title').textContent = 'Profile';
        renderSidebar();
        renderContent('profile');
    };

    // Add notification bell to header
    const header = document.querySelector('header .flex.items-center.gap-4');
    if (header && !document.getElementById('notif-bell')) {
        const bellContainer = document.createElement('div');
        bellContainer.id = 'notif-bell';
        bellContainer.className = 'relative cursor-pointer mr-2';
        bellContainer.innerHTML = `
            <i data-lucide="bell" class="w-6 h-6 text-slate-400"></i>
            <span id="notif-count" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full">0</span>
        `;
        bellContainer.onclick = toggleNotifications;
        header.insertBefore(bellContainer, header.firstChild);
    }
    
    // Update branding based on role
    const branding = document.getElementById('sidebar-branding');
    if (branding) branding.textContent = role.toUpperCase();
}

function setupDashboard() {
    refreshHeader();
    renderSidebar();
    renderContent('dashboard');
}

function renderSidebar() {
    if (!currentUser) return;
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = '';
    
    const menus = {
        customer: [
            { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
            { id: 'suppliers', label: 'Choose Supplier', icon: 'users' },
            { id: 'available', label: 'Available', icon: 'package' },
            { id: 'billing', label: 'Billing', icon: 'receipt' },
            { id: 'cart', label: 'Cart', icon: 'shopping-cart' },
            { id: 'profile', label: 'Profile', icon: 'user' },
        ],
        supplier: [
            { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
            { id: 'add-product', label: 'Add Product', icon: 'plus-square' },
            { id: 'availability', label: 'Send Stock', icon: 'send' },
            { id: 'orders', label: 'Orders', icon: 'receipt' },
            { id: 'profile', label: 'Profile', icon: 'user' },
        ],
        inventory: [
            { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
            { id: 'stock', label: 'Stock', icon: 'package' },
            { id: 'sales', label: 'Sales', icon: 'trending-up' },
            { id: 'suppliers', label: 'Suppliers', icon: 'users' },
            { id: 'customers', label: 'Customers', icon: 'user-check' },
            { id: 'profile', label: 'Profile', icon: 'user' },
        ]
    };

    const menuItems = menus[currentUser.role] || [];
    menuItems.forEach(item => {
        const btn = document.createElement('button');
        btn.className = `w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${currentView === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`;
        btn.innerHTML = `<i data-lucide="${item.icon}" class="w-5 h-5"></i> <span class="font-medium">${item.label}</span>`;
        btn.onclick = () => {
            currentView = item.id;
            document.getElementById('current-view-title').textContent = item.label;
            renderSidebar();
            renderContent(item.id);
        };
        nav.appendChild(btn);
    });
    initIcons();
}

function renderDashboard(data = {}, roleTitle) {
    const area = document.getElementById('main-content-area');
    const { 
        notifications: dataNotifs = [], 
        myProds = [], 
        totalQty = 0, 
        totalWeight = 0, 
        orders = [], 
        stats = { total_products: 0, total_quantity: 0, total_weight: 0, low_stock_count: 0, total_customers: 0 } 
    } = data || {};

    // Use global notifications if data doesn't have them
    const globalNotifs = Array.isArray(window.notifications) ? window.notifications : [];
    const displayNotifs = dataNotifs.length > 0 ? dataNotifs : globalNotifs;

    if (currentUser.role === 'supplier') {
        area.innerHTML = `
            <div class="space-y-8">
                <h1 class="text-3xl font-bold text-slate-800">Welcome, ${roleTitle}</h1>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-[#3498db] p-8 rounded-xl text-white shadow-lg flex flex-col items-center justify-center text-center">
                        <p class="text-4xl font-bold mb-2">${myProds.length}</p>
                        <p class="text-sm font-medium opacity-90 uppercase tracking-wider">Total Products</p>
                    </div>
                    <div class="bg-[#f39c12] p-8 rounded-xl text-white shadow-lg flex flex-col items-center justify-center text-center">
                        <p class="text-4xl font-bold mb-2">${totalQty.toLocaleString()}</p>
                        <p class="text-sm font-medium opacity-90 uppercase tracking-wider">Total Quantity</p>
                    </div>
                    <div class="bg-[#27ae60] p-8 rounded-xl text-white shadow-lg flex flex-col items-center justify-center text-center">
                        <p class="text-4xl font-bold mb-2">${totalWeight.toLocaleString()} <span class="text-xl">kg</span></p>
                        <p class="text-sm font-medium opacity-90 uppercase tracking-wider">Total Weight</p>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div class="flex items-center gap-6">
                        <div class="flex items-center gap-2">
                            <span class="text-slate-400 text-sm">Filter by:</span>
                            <span class="font-bold text-slate-700">All</span>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400"></i>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-slate-400 text-sm">Customers</span>
                        <span class="font-bold text-slate-700">${new Set(orders.map(o => o.customer_id)).size}</span>
                    </div>
                </div>

                ${displayNotifs.length > 0 ? `
                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <i data-lucide="bell" class="w-5 h-5 text-blue-500"></i> Recent Alerts
                        </h3>
                        <div class="space-y-3">
                            ${displayNotifs.slice(0, 3).map(n => `
                                <div class="flex items-start gap-3 p-3 rounded-lg ${!n.is_read ? 'bg-blue-50' : 'bg-slate-50'}">
                                    <div class="mt-1">
                                        <i data-lucide="${n.is_read ? 'check-circle' : 'circle'}" class="w-4 h-4 ${!n.is_read ? 'text-blue-500' : 'text-slate-400'}"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm text-slate-700">${n.message}</p>
                                        <p class="text-[10px] text-slate-400 mt-1">${new Date(n.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <i data-lucide="shopping-bag" class="w-5 h-5 text-emerald-500"></i> Recent Orders
                    </h3>
                    <div class="space-y-4">
                        ${orders.slice(0, 5).map(o => `
                            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div>
                                    <p class="text-sm font-bold text-slate-900">#ORD-${o.id}</p>
                                    <p class="text-xs text-slate-500">${o.customer_name}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-bold ${o.status === 'Paid' || o.status === 'completed' || o.status === 'confirmed' ? 'text-emerald-600' : 'text-slate-600'}">
                                        ₹${o.total_amount.toFixed(2)}
                                    </p>
                                    <p class="text-[10px] font-bold uppercase ${o.status === 'Paid' || o.status === 'completed' ? 'text-emerald-500' : 'text-slate-400'}">
                                        ${o.status === 'Paid' || o.status === 'completed' || o.status === 'confirmed' ? 'Paid' : o.status}
                                    </p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } else if (currentUser.role === 'inventory') {
        area.innerHTML = `
            <div class="space-y-8">
                <h1 class="text-3xl font-bold text-slate-800">Welcome, ${roleTitle}</h1>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-[#2980b9] p-8 rounded-xl text-white shadow-lg flex flex-col items-center justify-center text-center">
                        <p class="text-4xl font-bold mb-2">${stats.total_products || 0}</p>
                        <p class="text-sm font-medium opacity-90 uppercase tracking-wider">Total Products</p>
                    </div>
                    <div class="bg-[#3498db] p-8 rounded-xl text-white shadow-lg flex flex-col items-center justify-center text-center">
                        <p class="text-4xl font-bold mb-2">${(stats.total_quantity || 0).toLocaleString()}</p>
                        <p class="text-sm font-medium opacity-90 uppercase tracking-wider">Total Quantity</p>
                    </div>
                    <div class="bg-[#27ae60] p-8 rounded-xl text-white shadow-lg flex flex-col items-center justify-center text-center">
                        <p class="text-4xl font-bold mb-2">${(stats.total_weight || 0).toLocaleString()} <span class="text-xl">kg</span></p>
                        <p class="text-sm font-medium opacity-90 uppercase tracking-wider">Total Weight</p>
                    </div>
                    <div class="bg-[#16a085] p-8 rounded-xl text-white shadow-lg flex flex-col items-center justify-center text-center">
                        <p class="text-4xl font-bold mb-2">${stats.low_stock_count || 0}</p>
                        <p class="text-sm font-medium opacity-90 uppercase tracking-wider">Low Stock</p>
                    </div>
                </div>

                ${displayNotifs.filter(n => n.type === 'low_stock').length > 0 ? `
                    <div class="bg-red-50 p-6 rounded-xl border border-red-100">
                        <h3 class="font-bold text-red-800 mb-4 flex items-center gap-2">
                            <i data-lucide="alert-triangle" class="w-5 h-5"></i> Critical Low Stock Alerts
                        </h3>
                        <div class="space-y-3">
                            ${displayNotifs.filter(n => n.type === 'low_stock').slice(0, 3).map(n => `
                                <div class="flex items-start gap-3 p-3 bg-white rounded-lg border border-red-100 shadow-sm">
                                    <div class="mt-1">
                                        <i data-lucide="alert-circle" class="w-4 h-4 text-red-500"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm text-red-700 font-medium">${n.message}</p>
                                        <p class="text-[10px] text-red-400 mt-1">${new Date(n.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-around text-center">
                    <div>
                        <p class="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Business</p>
                        <p class="text-xl font-bold text-slate-800">89%</p>
                    </div>
                    <div class="h-10 w-px bg-slate-100"></div>
                    <div>
                        <p class="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Customers</p>
                        <p class="text-xl font-bold text-slate-800">${stats.total_customers}</p>
                    </div>
                    <div class="h-10 w-px bg-slate-100"></div>
                    <div>
                        <p class="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Retention</p>
                        <p class="text-xl font-bold text-slate-800">39%</p>
                    </div>
                    <div class="h-10 w-px bg-slate-100"></div>
                    <div>
                        <p class="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Total Customers</p>
                        <div class="flex items-center gap-2 justify-center">
                            <span class="text-xl font-bold text-slate-800">${stats.total_customers}</span>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (currentUser.role === 'customer') {
        area.innerHTML = `
            <div class="space-y-8">
                <h1 class="text-3xl font-bold text-slate-800">Welcome, ${roleTitle}</h1>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="bg-[#3498db] p-8 rounded-xl text-white shadow-lg flex flex-col items-center justify-center text-center">
                        <p class="text-4xl font-bold mb-2">${orders.length}</p>
                        <p class="text-sm font-medium opacity-90 uppercase tracking-wider">My Orders</p>
                    </div>
                    <div class="bg-[#9b59b6] p-8 rounded-xl text-white shadow-lg flex flex-col items-center justify-center text-center">
                        <p class="text-4xl font-bold mb-2">${orders.filter(o => o.status === 'pending' || o.status === 'Paid' || o.status === 'confirmed').length}</p>
                        <p class="text-sm font-medium opacity-90 uppercase tracking-wider">Active Orders</p>
                    </div>
                    <div class="bg-[#2ecc71] p-8 rounded-xl text-white shadow-lg flex flex-col items-center justify-center text-center">
                        <p class="text-4xl font-bold mb-2">${orders.filter(o => o.status === 'completed').length}</p>
                        <p class="text-sm font-medium opacity-90 uppercase tracking-wider">Completed Orders</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        area.innerHTML = `
            <div class="space-y-8">
                <div class="bg-[#1e293b] p-8 -mx-8 -mt-8 mb-8">
                    <h1 class="text-3xl font-bold text-white">Welcome, ${roleTitle}</h1>
                    <p class="text-slate-400 mt-2">FrostFlow ERP • Customer Portal</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">System Status</h3>
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <p class="text-2xl font-bold text-slate-800">Online</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-12 rounded-2xl border border-stone-200 text-center shadow-sm">
                    <div class="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-stone-100">
                        <i data-lucide="layout-dashboard" class="w-10 h-10 text-stone-300"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-stone-800 mb-3">Welcome to your Dashboard</h3>
                    <p class="text-stone-500 max-w-lg mx-auto leading-relaxed">
                        To get started, please use the sidebar on the left. 
                        You can choose a supplier from the <span class="font-bold text-stone-800">"Choose Supplier"</span> section to browse and order products.
                    </p>
                </div>
            </div>
        `;
    }
    initIcons();
}

function renderAvailability(products = []) {
    const area = document.getElementById('main-content-area');
    const list = Array.isArray(products) ? products : [];
    const myProducts = list.filter(p => p.supplier_id === currentUser.id);
    
    area.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-stone-900">Stock Availability</h2>
                <button onclick="renderContent('add-product')" class="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i> Add New Product
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${myProducts.map(p => `
                    <div class="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                        <h4 class="font-bold text-lg mb-1">${p.name}</h4>
                        <p class="text-stone-500 text-sm mb-4">${p.category} • ₹${p.price.toFixed(2)}</p>
                        <div class="flex justify-between items-center p-3 bg-stone-50 rounded-xl mb-4">
                            <span class="text-xs font-bold text-stone-500 uppercase">Current Stock</span>
                            <span class="font-bold text-stone-900">${p.stock || 0} units</span>
                        </div>
                        <div class="space-y-3">
                            <div class="flex gap-2">
                                <input type="number" id="stock-qty-${p.id}" placeholder="Qty" class="w-20 px-2 py-1 rounded-lg border border-stone-200 outline-none text-sm">
                                <button onclick="window.sendStock(${p.id})" class="flex-1 bg-stone-900 text-white py-1 rounded-lg text-sm font-bold hover:bg-stone-800">Send Stock</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    initIcons();
}

function renderOrders(orders = []) {
    const area = document.getElementById('main-content-area');
    const list = Array.isArray(orders) ? orders : [];
    area.innerHTML = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-stone-900">Customer Orders</h2>
            <div class="space-y-4">
                ${list.map(o => `
                    <div class="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="font-mono text-sm font-bold">#ORD-${o.id}</span>
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${o.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'} flex items-center gap-1">
                                    ${o.status}
                                    ${o.status === 'completed' || o.status === 'confirmed' ? '<i data-lucide="check" class="w-3 h-3"></i>' : ''}
                                </span>
                            </div>
                            <p class="text-sm font-medium text-stone-900">Customer: ${o.customer_name}</p>
                            <p class="text-sm font-bold ${o.status === 'Paid' || o.status === 'completed' || o.status === 'confirmed' ? 'text-emerald-600' : 'text-stone-600'}">
                                ${o.status === 'Paid' || o.status === 'completed' || o.status === 'confirmed' ? 'Amount Paid' : 'Total Amount'}: ₹${o.total_amount.toFixed(2)}
                            </p>
                            <p class="text-xs text-stone-500">${new Date(o.created_at).toLocaleString()}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            ${o.status === 'pending' || o.status === 'Paid' ? `
                                <button onclick="window.updateStatus(${o.id}, 'confirmed')" class="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600">Accept</button>
                                <button onclick="window.updateStatus(${o.id}, 'rejected')" class="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-600">Reject</button>
                            ` : ''}
                            ${o.status === 'confirmed' ? `
                                <button onclick="window.updateStatus(${o.id}, 'completed')" class="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-stone-800">Complete</button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    initIcons();
}

function renderCustomers(orders = []) {
    const area = document.getElementById('main-content-area');
    const list = Array.isArray(orders) ? orders : [];
    const customers = Array.from(new Set(list.map(o => o.customer_id))).map(id => {
        return list.find(o => o.customer_id === id);
    });

    area.innerHTML = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-stone-900">My Customers</h2>
            <div class="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                <table class="w-full text-left">
                    <thead class="bg-stone-50 border-b border-stone-200">
                        <tr>
                            <th class="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Name</th>
                            <th class="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Last Order</th>
                            <th class="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Total Orders</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-stone-100">
                        ${customers.map(c => `
                            <tr>
                                <td class="px-6 py-4 font-bold text-stone-900">${c.customer_name}</td>
                                <td class="px-6 py-4 text-sm text-stone-500">${new Date(c.created_at).toLocaleDateString()}</td>
                                <td class="px-6 py-4 text-sm text-stone-900">${list.filter(o => o.customer_id === c.customer_id).length}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    initIcons();
}

function renderStock(products = []) {
    const area = document.getElementById('main-content-area');
    const list = Array.isArray(products) ? products : [];
    area.innerHTML = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-stone-900">Inventory Stock</h2>
            <div class="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                <table class="w-full text-left">
                    <thead class="bg-stone-50 border-b border-stone-200">
                        <tr>
                            <th class="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Product</th>
                            <th class="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Supplier</th>
                            <th class="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Quantity</th>
                            <th class="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-stone-100">
                        ${list.map(p => `
                            <tr>
                                <td class="px-6 py-4 font-bold text-stone-900">${p.name}</td>
                                <td class="px-6 py-4 text-sm text-stone-500">${p.supplier_name}</td>
                                <td class="px-6 py-4 text-sm text-stone-900 font-mono">${p.stock || 0}</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${p.stock > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
                                        ${p.stock > 10 ? 'Available' : 'Low Stock'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    initIcons();
}

function renderSales(stats = {}) {
    const area = document.getElementById('main-content-area');
    const s = stats || {};
    area.innerHTML = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-stone-900">Sales & Revenue</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                    <p class="text-xs font-bold text-stone-500 uppercase mb-1">Estimated Revenue</p>
                    <p class="text-4xl font-bold text-stone-900">₹${((s.total_quantity || 0) * 12.5).toFixed(2)}</p>
                    <p class="text-xs text-emerald-500 mt-2">↑ 12% from last month</p>
                </div>
                <div class="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                    <p class="text-xs font-bold text-stone-500 uppercase mb-1">Estimated Orders</p>
                    <p class="text-4xl font-bold text-stone-900">${Math.floor((s.total_quantity || 0) / 5)}</p>
                    <p class="text-xs text-stone-400 mt-2">Average order value: ₹62.50</p>
                </div>
            </div>
        </div>
    `;
    initIcons();
}

function renderSuppliers(suppliersList = [], stats) {
    const area = document.getElementById('main-content-area');
    const list = Array.isArray(suppliersList) ? suppliersList : [];
    if (currentUser.role === 'inventory') {
        area.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-stone-900">Supplier Management</h2>
                    <div class="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                        <p class="text-xs font-bold text-blue-600 uppercase">Active Suppliers</p>
                        <p class="text-xl font-bold text-blue-900">${stats ? stats.total_suppliers : '...'}</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${list.map(s => `
                        <div class="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center font-bold text-stone-600">
                                    ${(s.username ? s.username[0] : '?').toUpperCase()}
                                </div>
                                <div>
                                    <h4 class="font-bold text-stone-900">${s.username || 'Supplier'}</h4>
                                    <p class="text-stone-500 text-xs">${s.email || 'No Email'}</p>
                                </div>
                            </div>
                            <div class="pt-4 border-t border-stone-50 flex justify-between items-center">
                                <span class="text-xs font-bold text-stone-400 uppercase">Products</span>
                                <span class="font-bold text-stone-900">${s.product_count || 0}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        area.innerHTML = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-stone-900">Choose a Supplier</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${list.map(s => `
                        <div class="bg-white p-6 rounded-2xl border ${selectedSupplierId === s.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-stone-200'} shadow-sm hover:shadow-md transition-all">
                            <div class="flex items-center gap-4 mb-4 cursor-pointer" onclick="selectSupplier(${s.id})">
                                <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                                    ${(s.username ? s.username[0] : '?').toUpperCase()}
                                </div>
                                <div>
                                    <h4 class="font-bold text-stone-900 hover:text-blue-600 transition-colors">${s.username || 'Supplier'}</h4>
                                    <p class="text-stone-500 text-xs">${s.email || 'No Email'}</p>
                                    <p class="text-stone-400 text-[10px] mt-1">${s.product_count || 0} Products Available</p>
                                </div>
                            </div>
                            <button onclick="selectSupplier(${s.id})" class="w-full ${selectedSupplierId === s.id ? 'bg-blue-600' : 'bg-stone-900'} text-white py-2 rounded-xl font-bold hover:opacity-90 transition-colors">
                                ${selectedSupplierId === s.id ? 'Selected' : 'Select Supplier'}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    initIcons();
}

function renderAvailable(products = [], suppliers = []) {
    const area = document.getElementById('main-content-area');
    const prodList = Array.isArray(products) ? products : [];
    const suppList = Array.isArray(suppliers) ? suppliers : [];
    const selectedSupplier = selectedSupplierId ? suppList.find(s => s.id === selectedSupplierId) : null;
    let filteredProducts = prodList;

    if (selectedSupplierId) {
        filteredProducts = prodList.filter(p => p.supplier_id === selectedSupplierId);
    }

    area.innerHTML = `
        <div class="space-y-6">
            <div class="bg-[#1e293b] p-6 -mx-8 -mt-8 mb-8">
                <h1 class="text-2xl font-bold text-white">Available Products</h1>
            </div>

            ${selectedSupplier ? `
                <div class="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center justify-between mb-6">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white">
                            ${(selectedSupplier.username ? selectedSupplier.username[0] : '?').toUpperCase()}
                        </div>
                        <div>
                            <h3 class="font-bold text-blue-900">${selectedSupplier.username || 'Supplier'}</h3>
                            <p class="text-blue-700 text-sm">${selectedSupplier.email || 'No Email'}</p>
                        </div>
                    </div>
                    <button onclick="clearSupplierFilter()" class="text-sm bg-white text-blue-600 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 font-bold transition-colors flex items-center gap-1">
                        <i data-lucide="x" class="w-4 h-4"></i> Change Supplier
                    </button>
                </div>
            ` : `
                <div class="flex items-center justify-between">
                    <p class="text-stone-500 text-sm">Browse available products below. Click "Available" in sidebar for full list or "Billing" to place an order.</p>
                </div>
            `}

            <div class="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-stone-50 border-b border-stone-200">
                        <tr>
                            <th class="px-6 py-4 text-sm font-bold text-stone-700">Product</th>
                            <th class="px-6 py-4 text-sm font-bold text-stone-700">Price (₹)</th>
                            <th class="px-6 py-4 text-sm font-bold text-stone-700">Stock</th>
                            <th class="px-6 py-4 text-sm font-bold text-stone-700">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-stone-100">
                        ${filteredProducts.length === 0 ? `
                            <tr><td colspan="4" class="px-6 py-12 text-center text-stone-400">No products available</td></tr>
                        ` : filteredProducts.map(p => `
                            <tr class="hover:bg-stone-50 transition-colors">
                                <td class="px-6 py-4">
                                    <div class="font-bold text-stone-900">${p.name}</div>
                                    <div class="text-xs text-stone-500">${p.category} • ${p.supplier_name}</div>
                                </td>
                                <td class="px-6 py-4 text-stone-900 font-medium">₹${(p.price || 0).toFixed(2)}</td>
                                <td class="px-6 py-4">
                                    <span class="text-xs font-bold ${(p.stock || 0) > 0 ? 'text-emerald-600' : 'text-red-500'} uppercase">
                                        ${(p.stock || 0) > 0 ? `${p.stock} in stock` : 'Out of stock'}
                                    </span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex gap-2">
                                        <button onclick="window.addToCart(${p.id})" class="bg-[#2c3e50] text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors">
                                            Add to Cart
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    initIcons();
}

function renderBilling(products = [], orders = []) {
    const area = document.getElementById('main-content-area');
    const prodList = Array.isArray(products) ? products : [];
    const orderList = Array.isArray(orders) ? orders : [];
    
    if (!window.billingItems) window.billingItems = [];
    
    const subtotal = window.billingItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const gst = subtotal * 0.18;
    const total = subtotal + gst;

    const paidOrders = orderList.filter(o => o.status === 'Paid' || o.status === 'completed');

    area.innerHTML = `
        <div class="space-y-8">
            <div class="bg-[#1e293b] p-6 -mx-8 -mt-8 mb-8 flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-white">Billing Dashboard</h1>
                    <p class="text-slate-400 text-sm">Create invoices and manage payments</p>
                </div>
                <div class="flex items-center gap-4">
                    <div class="bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-right">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Balance</p>
                        <p class="text-lg font-bold text-emerald-400">₹${(currentUser.balance || 0).toFixed(2)}</p>
                    </div>
                    <button onclick="window.newBilling()" class="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2">
                        <i data-lucide="plus" class="w-4 h-4"></i> New Billing
                    </button>
                </div>
            </div>

            <div class="bg-white p-8 rounded-xl border border-stone-200 shadow-sm space-y-6">
                <div class="flex justify-between items-start border-b border-stone-100 pb-6">
                    <div>
                        <h2 class="text-xl font-bold text-stone-800">Invoice # INV-${Math.floor(100000 + Math.random() * 900000)}</h2>
                        <p class="text-stone-500 text-sm mt-1">Date: ${new Date().toLocaleString()}</p>
                    </div>
                </div>

                <div class="flex gap-4 items-end bg-stone-50 p-4 rounded-xl border border-stone-100">
                    <div class="flex-1">
                        <label class="block text-[10px] font-bold text-stone-500 uppercase mb-1">Select Product</label>
                        <select id="bill-prod-select" class="w-full px-4 py-2 rounded-lg border border-stone-200 outline-none bg-white text-sm">
                            <option value="">Select Product</option>
                            ${prodList.map(p => `<option value="${p.id}">${p.name} (₹${p.price})</option>`).join('')}
                        </select>
                    </div>
                    <div class="w-32">
                        <label class="block text-[10px] font-bold text-stone-500 uppercase mb-1">Qty</label>
                        <input type="number" id="bill-prod-qty" placeholder="Qty" class="w-full px-4 py-2 rounded-lg border border-stone-200 outline-none text-sm">
                    </div>
                    <button onclick="addToBilling()" class="bg-[#2c3e50] text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-700 transition-colors text-sm">Add</button>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th class="px-6 py-3 text-xs font-bold text-stone-500 uppercase">Product</th>
                                <th class="px-6 py-3 text-xs font-bold text-stone-500 uppercase">Qty</th>
                                <th class="px-6 py-3 text-xs font-bold text-stone-500 uppercase">Price</th>
                                <th class="px-6 py-3 text-xs font-bold text-stone-500 uppercase">Subtotal</th>
                                <th class="px-6 py-3 text-xs font-bold text-stone-500 uppercase text-center">Remove</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-stone-100">
                            ${window.billingItems.length === 0 ? `
                                <tr><td colspan="5" class="px-6 py-8 text-center text-stone-400">No items added to invoice</td></tr>
                            ` : window.billingItems.map((item, idx) => `
                                <tr>
                                    <td class="px-6 py-4 font-medium text-stone-800">${item.name}</td>
                                    <td class="px-6 py-4 text-stone-600">${item.quantity}</td>
                                    <td class="px-6 py-4 text-stone-600">₹${item.price.toFixed(2)}</td>
                                    <td class="px-6 py-4 text-stone-800 font-bold">₹${(item.price * item.quantity).toFixed(2)}</td>
                                    <td class="px-6 py-4 text-center">
                                        <button onclick="removeFromBilling(${idx})" class="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="flex flex-col items-end space-y-2 pt-6 border-t border-stone-100">
                    <div class="flex justify-between w-64 text-sm">
                        <span class="text-stone-500 font-bold">Subtotal:</span>
                        <span class="text-stone-800 font-bold">₹${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between w-64 text-sm">
                        <span class="text-stone-500 font-bold">GST (18%):</span>
                        <span class="text-stone-800 font-bold">₹${gst.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between w-64 text-xl font-bold pt-2">
                        <span class="text-stone-800">Grand Total:</span>
                        <span class="text-stone-800">₹${total.toFixed(2)}</span>
                    </div>
                </div>

                <div class="flex justify-center gap-4 pt-8 no-print">
                    <button onclick="window.processBillingPayment()" class="bg-[#2ecc71] text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-600 transition-colors">Pay Now</button>
                    <button onclick="window.print()" class="bg-[#3498db] text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors">Print</button>
                    <button onclick="window.downloadInvoice()" class="bg-[#9b59b6] text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-600 transition-colors">Download Receipt</button>
                    <button onclick="window.downloadHistory()" class="bg-[#e67e22] text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors">Download History</button>
                </div>
            </div>

            ${paidOrders.length > 0 ? `
            <div class="space-y-4">
                <div class="flex justify-between items-center no-print">
                    <h3 class="text-lg font-bold text-stone-800">Recent Billing History</h3>
                    <button onclick="window.clearBillingHistory()" class="text-xs font-bold text-red-500 hover:underline">Clear All History</button>
                </div>
                <div class="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                    <table class="w-full text-left">
                        <thead class="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th class="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Order ID</th>
                                <th class="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Date</th>
                                <th class="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Status</th>
                                <th class="px-6 py-4 text-xs font-bold text-stone-500 uppercase">Total</th>
                                <th class="px-6 py-4 text-xs font-bold text-stone-500 uppercase text-center no-print">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-stone-100">
                            ${paidOrders.map(o => `
                                <tr>
                                    <td class="px-6 py-4 font-mono text-sm">#ORD-${o.id}</td>
                                    <td class="px-6 py-4 text-sm text-stone-500">${new Date(o.created_at).toLocaleDateString()}</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${o.status === 'completed' || o.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}">
                                            ${o.status}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-sm font-bold text-stone-900">₹${o.total_amount.toFixed(2)}</td>
                                    <td class="px-6 py-4 text-center no-print space-x-2">
                                        <button onclick="window.downloadInvoice(${o.id})" class="text-xs font-bold text-blue-500 hover:underline">Download</button>
                                        <button onclick="window.cancelOrder(${o.id})" class="text-xs font-bold text-red-500 hover:underline">Cancel Request</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}
        </div>
        <style>
            @media print {
                body * {
                    visibility: hidden;
                }
                #main-content-area, #main-content-area * {
                    visibility: visible;
                }
                #main-content-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    padding: 0;
                    margin: 0;
                }
                .no-print, .sidebar, header, #sidebar-nav, .bg-\\[\\#1e293b\\], button {
                    display: none !important;
                }
                .bg-white {
                    border: none !important;
                    box-shadow: none !important;
                }
            }
        </style>
    `;
    initIcons();
}

function renderProfile(user) {
    const area = document.getElementById('main-content-area');
    const username = user.username || 'User';
    const balance = typeof user.balance === 'number' ? user.balance : 0;
    
    area.innerHTML = `
        <div class="max-w-md mx-auto space-y-8">
            <div class="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm text-center">
                <div class="w-24 h-24 bg-stone-100 rounded-full border border-stone-200 flex items-center justify-center font-bold text-3xl text-stone-600 mx-auto mb-4">
                    ${(username[0] || '?').toUpperCase()}
                </div>
                <h2 class="text-2xl font-bold text-stone-900">${username}</h2>
                <p class="text-stone-500 capitalize">${user.role || 'Member'}</p>
                <div class="mt-8 space-y-4 text-left">
                    <div class="p-4 bg-stone-50 rounded-xl border border-stone-100">
                        <p class="text-xs font-bold text-stone-400 uppercase">Wallet Balance</p>
                        <p class="text-2xl font-bold text-emerald-600">₹${balance.toFixed(2)}</p>
                    </div>
                    <div class="p-4 bg-stone-50 rounded-xl border border-stone-100">
                        <p class="text-xs font-bold text-stone-400 uppercase">Email Address</p>
                        <p class="text-stone-900 font-medium">${user.email || 'N/A'}</p>
                    </div>
                    <div class="p-4 bg-stone-50 rounded-xl border border-stone-100">
                        <p class="text-xs font-bold text-stone-400 uppercase">Account ID</p>
                        <p class="text-stone-900 font-mono">#USR-${user.id || '000'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    initIcons();
}

async function renderContent(view) {
    if (!currentUser && view !== 'login-form' && view !== 'register-form' && view !== 'otp-form') {
        showView('login-form');
        return;
    }
    const area = document.getElementById('main-content-area');
    
    // Immediate feedback from cache if available
    if (dataCache[view]) {
        if (view === 'dashboard') {
            const role = currentUser.role || 'member';
            const roleTitle = role.charAt(0).toUpperCase() + role.slice(1);
            renderDashboard(dataCache[view], roleTitle);
        } else if (view === 'availability') {
            renderAvailability(dataCache[view]);
        } else if (view === 'orders') {
            renderOrders(dataCache[view]);
        } else if (view === 'customers') {
            renderCustomers(dataCache[view]);
        } else if (view === 'stock') {
            renderStock(dataCache[view]);
        } else if (view === 'sales') {
            renderSales(dataCache[view]);
        } else if (view === 'suppliers') {
            renderSuppliers(dataCache[view].suppliers, dataCache[view].stats);
        } else if (view === 'available') {
            renderAvailable(dataCache[view].products, dataCache[view].suppliers);
        } else if (view === 'billing') {
            renderBilling(dataCache[view].products, dataCache[view].orders);
        } else if (view === 'profile') {
            renderProfile(dataCache[view]);
        }
        // Don't return yet, fetch fresh data in background
    } else {
        showSkeleton(view);
    }

    if (view === 'dashboard') {
        const role = currentUser.role || 'member';
        const roleTitle = role.charAt(0).toUpperCase() + role.slice(1);
        
        // Fetch notifications
        const notifRes = await fetch(`/api/notifications/${currentUser.id}`);
        notifications = await notifRes.json();
        updateNotifCount();

        let dashboardData = {};
        if (currentUser.role === 'supplier') {
            const res = await fetch(`/api/orders/supplier/${currentUser.id}`);
            const orders = await res.json();
            const prodRes = await fetch('/api/products');
            const allProds = await prodRes.json();
            const myProds = allProds.filter(p => p.supplier_id === currentUser.id);
            
            const totalQty = myProds.reduce((sum, p) => sum + (p.stock || 0), 0);
            const totalWeight = totalQty * 0.5; // Mock weight calculation

            dashboardData = { myProds, totalQty, totalWeight, orders };
        } else if (currentUser.role === 'inventory') {
            const res = await fetch('/api/inventory/stats');
            const stats = await res.json();
            dashboardData = { stats };
        } else if (currentUser.role === 'customer') {
            const res = await fetch(`/api/orders/customer/${currentUser.id}`);
            const orders = await res.json();
            dashboardData = { orders };
        }

        dataCache.dashboard = dashboardData;
        renderDashboard(dashboardData, roleTitle);

    } else if (view === 'add-product') {
        area.innerHTML = `
            <div class="max-w-2xl space-y-6">
                <h2 class="text-2xl font-bold text-stone-900">Add New Product</h2>
                <form id="add-product-form" class="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-stone-500 uppercase mb-1">Product Name</label>
                        <input type="text" id="prod-name" required class="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-stone-500 uppercase mb-1">Price (₹)</label>
                            <input type="number" id="prod-price" step="0.01" required class="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-stone-500 uppercase mb-1">Category</label>
                            <select id="prod-cat" class="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none bg-white">
                                <option>Frozen</option>
                                <option>Chilled</option>
                                <option>Dry</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-stone-500 uppercase mb-1">Initial Quantity</label>
                            <input type="number" id="prod-qty" required class="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none" value="0">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-stone-500 uppercase mb-1">Initial Weight (kg)</label>
                            <input type="number" id="prod-weight" step="0.1" required class="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none" value="0">
                        </div>
                    </div>
                    <button type="submit" class="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors">Create Product</button>
                </form>
            </div>
        `;
        document.getElementById('add-product-form').onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('prod-name').value;
            const price = parseFloat(document.getElementById('prod-price').value);
            const category = document.getElementById('prod-cat').value;
            const quantity = parseFloat(document.getElementById('prod-qty').value);
            const weight = parseFloat(document.getElementById('prod-weight').value);

            try {
                const res = await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, description: '', price, category, quantity, weight, supplier_id: currentUser.id })
                });
                if (res.ok) {
                    alert('Product added successfully!');
                    renderContent('availability');
                }
            } catch (err) {
                alert('Failed to add product');
            }
        };
    } else if (view === 'availability') {
        const res = await fetch('/api/products');
        const products = await res.json();
        dataCache.availability = products;
        renderAvailability(products);
    } else if (view === 'orders') {
        const res = await fetch(`/api/orders/supplier/${currentUser.id}`);
        const orders = await res.json();
        dataCache.orders = orders;
        renderOrders(orders);
    } else if (view === 'customers') {
        const res = await fetch(`/api/orders/supplier/${currentUser.id}`);
        const orders = await res.json();
        dataCache.customers = orders;
        renderCustomers(orders);
    } else if (view === 'stock') {
        const res = await fetch('/api/products');
        const products = await res.json();
        dataCache.stock = products;
        renderStock(products);
    } else if (view === 'sales') {
        const res = await fetch('/api/inventory/stats');
        const stats = await res.json();
        dataCache.sales = stats;
        renderSales(stats);
    } else if (view === 'suppliers') {
        const res = await fetch('/api/suppliers');
        const suppliersList = await res.json();
        let stats = null;
        if (currentUser.role === 'inventory') {
            const statsRes = await fetch('/api/inventory/stats');
            stats = await statsRes.json();
        }
        dataCache.suppliers = { suppliers: suppliersList, stats };
        renderSuppliers(suppliersList, stats);
    } else if (view === 'cart') {
        area.innerHTML = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-stone-900">Your Shopping Cart</h2>
                <div id="cart-items-container" class="space-y-4">
                    ${cart.length === 0 ? `
                        <div class="bg-white p-12 rounded-2xl border border-stone-200 text-center">
                            <i data-lucide="shopping-cart" class="w-12 h-12 text-stone-300 mx-auto mb-4"></i>
                            <p class="text-stone-500">Your cart is empty</p>
                        </div>
                    ` : `
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div class="lg:col-span-2 space-y-4">
                                ${cart.map(item => `
                                    <div class="bg-white p-4 rounded-2xl border border-stone-200 flex items-center gap-4">
                                        <div class="flex-1">
                                            <h4 class="font-bold text-stone-900">${item.name}</h4>
                                            <p class="text-stone-500 text-sm">₹${item.price} / unit</p>
                                        </div>
                                        <div class="flex items-center gap-3 bg-stone-50 p-1 rounded-xl border border-stone-200">
                                            <button onclick="updateCartQty(${item.id}, -1)" class="p-1 hover:bg-white rounded-lg"><i data-lucide="minus" class="w-4 h-4"></i></button>
                                            <span class="w-8 text-center font-bold">${item.quantity}</span>
                                            <button onclick="updateCartQty(${item.id}, 1)" class="p-1 hover:bg-white rounded-lg"><i data-lucide="plus" class="w-4 h-4"></i></button>
                                        </div>
                                        <button onclick="removeFromCart(${item.id})" class="p-2 text-red-500 hover:bg-red-50 rounded-xl">
                                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-fit space-y-6">
                                <h3 class="font-bold text-lg border-b border-stone-100 pb-4">Order Summary</h3>
                                <div class="space-y-2 text-sm">
                                    <div class="flex justify-between text-stone-500">
                                        <span>Subtotal</span>
                                        <span>₹${cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}</span>
                                    </div>
                                    <div class="flex justify-between text-stone-500">
                                        <span>GST (18%)</span>
                                        <span>₹${(cart.reduce((sum, i) => sum + i.price * i.quantity, 0) * 0.18).toFixed(2)}</span>
                                    </div>
                                    <div class="flex justify-between text-lg font-bold text-stone-900 pt-4 border-t border-stone-100">
                                        <span>Total</span>
                                        <span>₹${(cart.reduce((sum, i) => sum + i.price * i.quantity, 0) * 1.18).toFixed(2)}</span>
                                    </div>
                                </div>
                                <button onclick="placeOrder()" class="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800">Checkout</button>
                            </div>
                        </div>
                    `}
                </div>
            </div>
        `;
        initIcons();
    } else if (view === 'available') {
        const res = await fetch('/api/products');
        const products = await res.json();
        const supRes = await fetch('/api/suppliers');
        const suppliers = await supRes.json();
        dataCache.available = { products, suppliers };
        renderAvailable(products, suppliers);
    } else if (view === 'billing') {
        const prodRes = await fetch('/api/products');
        const products = await prodRes.json();
        const ordersRes = await fetch(`/api/orders/customer/${currentUser.id}`);
        const orders = await ordersRes.json();
        dataCache.billing = { products, orders };
        renderBilling(products, orders);
    } else if (view === 'profile') {
        const res = await fetch(`/api/users/${currentUser.id}`);
        if (res.ok) {
            const user = await res.json();
            currentUser = { ...currentUser, ...user };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            refreshHeader();
        }
        dataCache.profile = currentUser;
        renderProfile(currentUser);
    } else {
        area.innerHTML = `<div class="p-12 text-center text-stone-400">View "${view}" is under development</div>`;
    }
    initIcons();
}

// OTP Input handling
document.querySelectorAll('.otp-input').forEach((input, i, inputs) => {
    input.oninput = (e) => {
        if (e.target.value && i < 5) inputs[i + 1].focus();
    };
    input.onkeydown = (e) => {
        if (e.key === 'Backspace' && !e.target.value && i > 0) inputs[i - 1].focus();
    };
});

window.sendStock = async (productId) => {
    const qty = parseFloat(document.getElementById(`stock-qty-${productId}`).value);
    if (!qty || qty <= 0) return alert('Enter valid quantity');
    
    try {
        const res = await fetch('/api/inventory/supply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ supplier_id: currentUser.id, product_id: productId, quantity: qty, weight: qty * 0.5 })
        });
        if (res.ok) {
            alert('Stock sent!');
            renderContent('availability');
        }
    } catch (err) {
        alert('Failed to send stock');
    }
};

window.updateStatus = async (orderId, status) => {
    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            renderContent('orders');
        }
    } catch (err) {
        alert('Update failed');
    }
};

window.addToCart = async (productId) => {
    let products = [];
    if (dataCache.available && dataCache.available.products) {
        products = dataCache.available.products;
    } else {
        const res = await fetch('/api/products');
        products = await res.json();
    }
    
    const product = products.find(p => p.id === productId);
    
    if (cart.length > 0 && cart[0].supplier_id !== product.supplier_id) {
        if (!confirm('Your cart contains items from another supplier. Clear cart and add this item?')) {
            return;
        }
        cart = [];
    }
    
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    alert(`${product.name} added to cart!`);
    if (currentView === 'cart') renderContent('cart');
};

window.selectSupplier = (supplierId) => {
    selectedSupplierId = supplierId;
    renderContent('suppliers');
    alert('Supplier selected! Now showing products from this supplier.');
    setTimeout(() => renderContent('available'), 500);
};

window.clearSupplierFilter = () => {
    selectedSupplierId = null;
    renderContent('available');
};

window.updateNotifCount = () => {
    const count = notifications.filter(n => !n.is_read).length;
    const badge = document.getElementById('notif-count');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
};

window.toggleNotifications = async () => {
    const existing = document.getElementById('notif-panel');
    if (existing) {
        existing.remove();
        return;
    }

    const list = Array.isArray(notifications) ? notifications : [];

    const panel = document.createElement('div');
    panel.id = 'notif-panel';
    panel.className = 'absolute top-16 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden';
    panel.innerHTML = `
        <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 class="font-bold text-slate-800">Notifications</h3>
            <button onclick="markAllRead()" class="text-xs text-blue-600 hover:underline">Mark all as read</button>
        </div>
        <div class="max-h-96 overflow-y-auto divide-y divide-slate-50">
            ${list.length === 0 ? `
                <div class="p-8 text-center text-slate-400 text-sm">No notifications</div>
            ` : list.map(n => `
                <div class="p-4 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-blue-50/30' : ''}">
                    <p class="text-sm text-slate-800">${n.message}</p>
                    <p class="text-[10px] text-slate-400 mt-1">${new Date(n.created_at).toLocaleString()}</p>
                </div>
            `).join('')}
        </div>
    `;
    document.body.appendChild(panel);
};

window.markAllRead = async () => {
    await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
    });
    if (Array.isArray(notifications)) {
        notifications.forEach(n => n.is_read = 1);
    }
    updateNotifCount();
    const panel = document.getElementById('notif-panel');
    if (panel) panel.remove();
};

window.addToBilling = async () => {
    const select = document.getElementById('bill-prod-select');
    const qtyInput = document.getElementById('bill-prod-qty');
    const productId = parseInt(select.value);
    const quantity = parseInt(qtyInput.value);

    if (!productId || !quantity || quantity <= 0) {
        alert('Please select a product and enter a valid quantity.');
        return;
    }

    let products = [];
    if (dataCache.billing && dataCache.billing.products) {
        products = dataCache.billing.products;
    } else {
        const res = await fetch('/api/products');
        products = await res.json();
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (!window.billingItems) window.billingItems = [];

    // Check if item is from the same supplier
    if (window.billingItems.length > 0) {
        if (window.billingItems[0].supplier_id !== product.supplier_id) {
            alert('All items in an invoice must be from the same supplier. Please clear the current invoice to add products from a different supplier.');
            return;
        }
    }

    const existing = window.billingItems.find(i => i.id === productId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        window.billingItems.push({ ...product, quantity });
    }

    qtyInput.value = '';
    renderContent('billing');
};

window.removeFromBilling = (idx) => {
    window.billingItems.splice(idx, 1);
    renderContent('billing');
};

window.downloadInvoice = async (orderId = null) => {
    let items = [];
    let date = new Date().toLocaleString();
    let invoiceNo = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

    if (orderId) {
        try {
            const res = await fetch(`/api/orders/${orderId}/items`);
            items = await res.json();
            invoiceNo = `INV-${orderId}`;
            // We'd ideally fetch the order date too, but using current for now
        } catch (err) {
            return alert('Failed to fetch order details');
        }
    } else {
        items = window.billingItems || [];
    }

    if (!items || items.length === 0) return alert('No items to download');
    
    let content = "RECEIPT\n\n";
    content += `Customer: ${currentUser ? currentUser.username : 'Guest'}\n`;
    content += `Date: ${date}\n`;
    content += `Invoice #: ${invoiceNo}\n\n`;
    content += "------------------------------------------------\n";
    content += "Product                Qty    Price      Subtotal\n";
    content += "------------------------------------------------\n";
    
    items.forEach(item => {
        const name = (item.name || 'Product').padEnd(22).substring(0, 22);
        const qty = item.quantity.toString().padEnd(6);
        const price = `₹${item.price.toFixed(2)}`.padEnd(10);
        const sub = `₹${(item.price * item.quantity).toFixed(2)}`;
        content += `${name} ${qty} ${price} ${sub}\n`;
    });
    
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    
    content += "------------------------------------------------\n";
    content += `Subtotal:              ₹${subtotal.toFixed(2)}\n`;
    content += `GST (18%):             ₹${gst.toFixed(2)}\n`;
    content += `Grand Total:           ₹${total.toFixed(2)}\n`;
    content += "------------------------------------------------\n";
    content += "Thank you for your business!\n";
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${invoiceNo}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};

window.processBillingPayment = async () => {
    if (!window.billingItems || window.billingItems.length === 0) {
        alert('No items in invoice.');
        return;
    }

    const subtotal = window.billingItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const gst = subtotal * 0.18;
    const total = subtotal + gst;

    const supplierId = window.billingItems[0].supplier_id;

    if (currentUser.balance < total) {
        alert('Insufficient balance! Please contact support to top up your account.');
        return;
    }

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_id: currentUser.id,
                supplier_id: supplierId,
                items: window.billingItems,
                total_amount: total,
                gst_amount: gst,
                status: 'Paid'
            })
        });

        if (res.ok) {
            currentUser.balance -= total;
            alert('Order confirmed! The amount has been deducted from your balance.');
            window.billingItems = []; 
            renderContent('billing');
        }
    } catch (err) {
        alert('Payment failed.');
    }
};

window.newBilling = () => {
    window.billingItems = [];
    renderContent('billing');
};

window.downloadHistory = async () => {
    try {
        const res = await fetch(`/api/orders/customer/${currentUser.id}`);
        const orders = await res.json();
        const paidOrders = orders.filter(o => o.status === 'Paid' || o.status === 'completed');
        
        if (paidOrders.length === 0) return alert('No history to download');
        
        const data = JSON.stringify(paidOrders, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billing_history_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (err) {
        alert('Failed to download history');
    }
};

window.clearBillingHistory = async () => {
    if (!confirm('Are you sure you want to delete all billing history? This cannot be undone.')) return;
    try {
        const res = await fetch(`/api/orders/customer/${currentUser.id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            renderContent('billing');
        }
    } catch (err) {
        alert('Failed to clear history');
    }
};

window.cancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    try {
        // Find the order to get its total for optimistic update
        const ordersRes = await fetch(`/api/orders/customer/${currentUser.id}`);
        const orders = await ordersRes.json();
        const order = orders.find(o => o.id === orderId);

        const res = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            if (order && order.status === 'Paid') {
                currentUser.balance += order.total_amount;
            }
            alert('Order cancelled successfully! The amount has been refunded to your account.');
            renderContent('billing');
        } else {
            alert('Failed to cancel order');
        }
    } catch (err) {
        alert('Failed to cancel order');
    }
};

window.updateCartQty = (productId, delta) => {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity = Math.max(1, item.quantity + delta);
        renderContent('cart');
    }
};

window.removeFromCart = (productId) => {
    cart = cart.filter(i => i.id !== productId);
    renderContent('cart');
};

window.placeOrder = async () => {
    if (cart.length === 0) return;
    
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    
    // For simplicity, we use the first item's supplier
    const supplierId = cart[0].supplier_id;

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_id: currentUser.id,
                supplier_id: supplierId,
                items: cart,
                total_amount: total,
                gst_amount: gst
            })
        });
        if (res.ok) {
            cart = [];
            alert('Order placed successfully!');
            renderContent('billing');
        }
    } catch (err) {
        alert('Checkout failed');
    }
};

initIcons();
