// ============================================
// UPI Fraud Shield - Admin Dashboard JavaScript
// ============================================

// Dummy Data
let dummyTransactions = [
    { id: 1, date: "2025-03-20", amount: 2500, receiver: "Rahul Sharma", user: "user@upishield.com", status: "safe" },
    { id: 2, date: "2025-03-21", amount: 78500, receiver: "FakeMart Pvt Ltd", user: "user@upishield.com", status: "suspicious" },
    { id: 3, date: "2025-03-22", amount: 450, receiver: "Kiran Cafe", user: "demo@upishield.com", status: "safe" },
    { id: 4, date: "2025-03-22", amount: 122000, receiver: "Unknown Global Trading", user: "user@upishield.com", status: "suspicious" },
    { id: 5, date: "2025-03-23", amount: 1200, receiver: "Groceries Store", user: "demo@upishield.com", status: "safe" },
    { id: 6, date: "2025-03-23", amount: 34000, receiver: "QuickCash Services", user: "user@upishield.com", status: "suspicious" },
    { id: 7, date: "2025-03-24", amount: 560, receiver: "Electricity Bill", user: "demo@upishield.com", status: "safe" },
    { id: 8, date: "2025-03-24", amount: 95000, receiver: "Luxury Goods", user: "user@upishield.com", status: "suspicious" },
    { id: 9, date: "2025-03-25", amount: 1800, receiver: "Mobile Recharge", user: "demo@upishield.com", status: "safe" },
    { id: 10, date: "2025-03-25", amount: 67000, receiver: "Crypto Exchange", user: "user@upishield.com", status: "suspicious" }
];

let currentUser = null;
let fraudChart = null;

// Check admin authentication
function checkAuth() {
    currentUser = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'login-register.html';
        return false;
    }
    return true;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Update Admin Dashboard
function updateDashboard() {
    const total = dummyTransactions.length;
    const fraud = dummyTransactions.filter(t => t.status === 'suspicious').length;
    const safe = total - fraud;
    
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card"><i class="fas fa-exchange-alt"></i><h3>Total Transactions</h3><div class="stat-value">${total}</div></div>
        <div class="stat-card danger"><i class="fas fa-exclamation-triangle"></i><h3>Fraud Detected</h3><div class="stat-value">${fraud}</div></div>
        <div class="stat-card success"><i class="fas fa-check-circle"></i><h3>Safe Transactions</h3><div class="stat-value">${safe}</div></div>
    `;
    
    document.getElementById('totalFraudCases').textContent = fraud;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    document.getElementById('totalUsers').textContent = users.length + 1;
    
    const recent = dummyTransactions.filter(t => t.status === 'suspicious').slice(-5).reverse();
    document.getElementById('recentActivityBody').innerHTML = recent.map(t => `
        <tr>
            <td>${t.date}</td>
            <td>₹${t.amount.toLocaleString()}</td>
            <td>${t.receiver}</td>
            <td>${t.user}</td>
            <td><span class="badge-suspicious">SUSPICIOUS</span></td>
            <td><button class="btn-small" onclick="markTransactionSafe(${t.id})">Mark Safe</button></td>
        </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center">No suspicious transactions</td></tr>';
}

// Update All Transactions
function updateTransactionsTable() {
    const search = document.getElementById('searchTransaction')?.value.toLowerCase() || '';
    const filter = document.getElementById('statusFilter')?.value || 'all';
    
    let filtered = dummyTransactions.filter(t => {
        const matchSearch = t.receiver.toLowerCase().includes(search) || t.amount.toString().includes(search);
        const matchFilter = filter === 'all' || t.status === filter;
        return matchSearch && matchFilter;
    });
    
    document.getElementById('transactionsBody').innerHTML = filtered.map(t => `
        <tr>
            <td>${t.date}</td>
            <td>₹${t.amount.toLocaleString()}</td>
            <td>${t.receiver}</td>
            <td>${t.user}</td>
            <td><span class="badge-${t.status}">${t.status.toUpperCase()}</span></td>
            <td>
                ${t.status === 'suspicious' ? `<button class="btn-small" onclick="markTransactionSafe(${t.id})">✓ Mark Safe</button>` : '✓ Verified'}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center">No transactions found</td></tr>';
}

// Update Fraud Alerts
function updateAlertsList() {
    const suspicious = dummyTransactions.filter(t => t.status === 'suspicious');
    const alertsList = document.getElementById('alertsList');
    
    if (suspicious.length === 0) {
        alertsList.innerHTML = '<div class="alert-item"><div class="alert-info"><h4><i class="fas fa-check-circle"></i> No Fraud Alerts</h4><p>All transactions are safe!</p></div></div>';
        return;
    }
    
    alertsList.innerHTML = suspicious.map(t => `
        <div class="alert-item suspicious">
            <div class="alert-info">
                <h4><i class="fas fa-skull-crosswalk"></i> HIGH RISK - Suspicious Transaction</h4>
                <p><strong>Date:</strong> ${t.date} | <strong>Amount:</strong> ₹${t.amount.toLocaleString()} | <strong>Receiver:</strong> ${t.receiver} | <strong>User:</strong> ${t.user}</p>
                <p><strong>Reason:</strong> Amount exceeds safe threshold</p>
            </div>
            <div class="alert-actions">
                <button class="btn-outline" onclick="markTransactionSafe(${t.id})">✓ Mark Safe</button>
                <button class="btn-danger" onclick="blockUser('${t.user}')">🚫 Block User</button>
            </div>
        </div>
    `).join('');
}

// Update Users List
function updateUsersList() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const adminUser = { username: 'Admin User', email: 'admin@upishield.com', role: 'admin', registeredAt: 'System' };
    const allUsers = [adminUser, ...users];
    
    document.getElementById('usersBody').innerHTML = allUsers.map(u => `
        <tr>
            <td>${u.username}</td>
            <td>${u.email}</td>
            <td><span class="badge-${u.role === 'admin' ? 'danger' : 'safe'}">${u.role.toUpperCase()}</span></td>
            <td>${u.registeredAt || 'N/A'}</td>
            <td>
                ${u.role !== 'admin' ? `<button class="btn-small btn-danger" onclick="deleteUser('${u.email}')">Delete</button>` : 'System Admin'}
            </td>
        </tr>
    `).join('');
}

// Admin Functions
window.markTransactionSafe = function(id) {
    const txn = dummyTransactions.find(t => t.id === id);
    if (txn && txn.status === 'suspicious') {
        txn.status = 'safe';
        updateDashboard();
        updateTransactionsTable();
        updateAlertsList();
        showToast(`Transaction to ${txn.receiver} marked as safe`, 'success');
    }
};

window.blockUser = function(email) {
    if (confirm(`Are you sure you want to block user: ${email}?`)) {
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        users = users.filter(u => u.email !== email);
        localStorage.setItem('users', JSON.stringify(users));
        updateUsersList();
        showToast(`User ${email} has been blocked`, 'warning');
    }
};

window.deleteUser = function(email) {
    if (confirm(`Delete user: ${email}? This action cannot be undone.`)) {
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        users = users.filter(u => u.email !== email);
        localStorage.setItem('users', JSON.stringify(users));
        updateUsersList();
        showToast(`User ${email} deleted`, 'success');
    }
};

// Initialize Chart
function initFraudChart() {
    const ctx = document.getElementById('fraudChart')?.getContext('2d');
    if (!ctx) return;
    if (fraudChart) fraudChart.destroy();
    
    fraudChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
                label: 'Fraudulent Transactions',
                data: [2, 1, 4, 3, 5, 7, 4],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

// Navigation
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById(page).classList.add('active-page');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    if (page === 'reports' && fraudChart) fraudChart.update();
}

// Theme Toggle
function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        toggle.checked = true;
    }
    toggle.addEventListener('change', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });
}

// Logout
function handleLogout() {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login-register.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    document.getElementById('adminNameDisplay').textContent = `👑 Admin: ${currentUser.username}`;
    
    updateDashboard();
    updateTransactionsTable();
    updateAlertsList();
    updateUsersList();
    initFraudChart();
    initThemeToggle();
    
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => { e.preventDefault(); navigateTo(item.getAttribute('data-page')); });
    });
    
    document.getElementById('searchTransaction')?.addEventListener('input', updateTransactionsTable);
    document.getElementById('statusFilter')?.addEventListener('change', updateTransactionsTable);
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => document.getElementById('sidebar')?.classList.toggle('open'));
    
    document.getElementById('updateThresholds')?.addEventListener('click', () => {
        const high = document.getElementById('highThreshold').value;
        const medium = document.getElementById('mediumThreshold').value;
        showToast(`Fraud rules updated: High > ₹${high}, Medium > ₹${medium}`, 'success');
    });
});