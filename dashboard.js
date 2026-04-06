// ============================================
// UPI Fraud Shield - Complete Dashboard
// ============================================

const API_URL = 'https://upi-fraud-app.onrender.com/api';
const authToken = localStorage.getItem('token') || sessionStorage.getItem('token');
const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

if (!authToken || currentUser.role !== 'user') {
    window.location.href = 'login-register.html';
}

document.getElementById('userNameDisplay').textContent = `Welcome, ${currentUser.username || 'User'}`;

let allTransactions = [];
let fraudTrendChart = null;
let riskPieChart = null;
let comparisonChart = null;

// ============================================
// Toast Function
// ============================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// API Call
// ============================================
async function callAPI(endpoint, method = 'GET', body = null) {
    try {
        const options = { method, headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);
        const response = await fetch(`${API_URL}${endpoint}`, options);
        return await response.json();
    } catch (error) {
        return { success: false, message: 'Network error' };
    }
}

// ============================================
// Load Data
// ============================================
async function loadDashboard() {
    const txnData = await callAPI('/users/transactions');
    if (txnData.success) {
        allTransactions = txnData.transactions || [];
        updateDashboardStats();
        updateRecentActivity();
        updateTransactionsTable();
        updateAlertsList();
        updateHistoryTable();
        updateAnalytics();
    }
    
    const profileData = await callAPI('/users/profile');
    if (profileData.success) {
        document.getElementById('profileName').value = profileData.user.full_name || '';
        document.getElementById('profileEmail').value = profileData.user.email || '';
        document.getElementById('profilePhone').value = profileData.user.phone || '';
        document.getElementById('profileUPI').value = profileData.user.upi_id || '';
    }
    
    loadNotifications();
}

// ============================================
// Dashboard Stats
// ============================================
function updateDashboardStats() {
    const total = allTransactions.length;
    const fraud = allTransactions.filter(t => t.status === 'suspicious').length;
    const safe = total - fraud;
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card"><i class="fas fa-exchange-alt"></i><h3>Total Transactions</h3><div class="stat-value">${total}</div></div>
        <div class="stat-card danger"><i class="fas fa-exclamation-triangle"></i><h3>Fraud Detected</h3><div class="stat-value">${fraud}</div></div>
        <div class="stat-card success"><i class="fas fa-check-circle"></i><h3>Safe Transactions</h3><div class="stat-value">${safe}</div></div>
    `;
}

function updateRecentActivity() {
    const recent = allTransactions.slice(-5).reverse();
    const tbody = document.getElementById('recentActivityBody');
    if (tbody) {
        tbody.innerHTML = recent.map(t => `
            <tr><td>${new Date(t.transaction_date).toLocaleDateString()}</td>
            <td>₹${(t.amount || 0).toLocaleString()}</td>
            <td>${t.receiver_name || 'N/A'}</td>
            <td><span class="badge-${t.status || 'safe'}">${(t.status || 'safe').toUpperCase()}</span></td>
        </tr>`).join('');
    }
}

function updateTransactionsTable() {
    const search = document.getElementById('searchTransaction')?.value.toLowerCase() || '';
    const filter = document.getElementById('statusFilter')?.value || 'all';
    let filtered = allTransactions.filter(t => {
        const match = (t.receiver_name || '').toLowerCase().includes(search) || (t.amount || 0).toString().includes(search);
        const statusMatch = filter === 'all' || t.status === filter;
        return match && statusMatch;
    });
    const tbody = document.getElementById('transactionsBody');
    if (tbody) {
        tbody.innerHTML = filtered.map(t => `
            <tr><td>${new Date(t.transaction_date).toLocaleDateString()}</td>
            <td>₹${(t.amount || 0).toLocaleString()}</td>
            <td>${t.receiver_name || 'N/A'}</td>
            <td><span class="badge-${t.status || 'safe'}">${(t.status || 'safe').toUpperCase()}</span></td>
        </td>`).join('');
    }
}

function updateHistoryTable() {
    const tbody = document.getElementById('historyBody');
    if (tbody) {
        tbody.innerHTML = allTransactions.map(t => `
            <tr><td>${new Date(t.transaction_date).toLocaleDateString()}</td>
            <td><small>${t.transaction_id || 'N/A'}</small></td>
            <td>₹${(t.amount || 0).toLocaleString()}</td>
            <td>${t.receiver_name || 'N/A'}</td>
            <td><span class="${t.risk_score > 60 ? 'risk-high' : (t.risk_score > 30 ? 'risk-medium' : 'risk-low')}">${t.risk_score || 0}%</span></td>
            <td><span class="badge-${t.status || 'safe'}">${(t.status || 'safe').toUpperCase()}</span></td>
        </tr>`).join('');
    }
}

// ============================================
// Fraud Alerts
// ============================================
function updateAlertsList() {
    const suspicious = allTransactions.filter(t => t.status === 'suspicious');
    const alertsList = document.getElementById('alertsList');
    if (alertsList) {
        if (suspicious.length === 0) {
            alertsList.innerHTML = '<div class="alert-item" style="border-left-color:green"><div class="alert-info"><h4>✅ No Fraud Alerts</h4><p>All transactions are safe!</p></div></div>';
        } else {
            alertsList.innerHTML = suspicious.map(t => `
                <div class="alert-item suspicious">
                    <div class="alert-info">
                        <h4><i class="fas fa-exclamation-triangle"></i> Suspicious Transaction Detected</h4>
                        <p><strong>Date:</strong> ${new Date(t.transaction_date).toLocaleDateString()} | <strong>Amount:</strong> ₹${(t.amount || 0).toLocaleString()} | <strong>Receiver:</strong> ${t.receiver_name}</p>
                        <p><strong>Risk Score:</strong> ${t.risk_score || 0}%</p>
                        <p><strong>Reason:</strong> Unusually high amount / Suspicious pattern</p>
                    </div>
                    <div class="alert-actions"><button class="btn-outline" onclick="reportTransaction(${t.id})">⚠️ Report</button></div>
                </div>
            `).join('');
        }
    }
}

window.reportTransaction = function(id) {
    const txn = allTransactions.find(t => t.id === id);
    if (txn) {
        const reports = JSON.parse(localStorage.getItem('fraudReports') || '[]');
        reports.unshift({ id: Date.now(), transactionId: id, receiver: txn.receiver_name, amount: txn.amount, date: new Date().toLocaleString() });
        localStorage.setItem('fraudReports', JSON.stringify(reports));
        showToast('Report submitted! Our team will investigate.', 'success');
    }
};

// ============================================
// ANALYTICS - Charts
// ============================================
function updateAnalytics() {
    updateAnalyticsStats();
    renderFraudTrendChart();
    renderRiskPieChart();
    renderComparisonChart();
    renderTopRiskyList();
    renderMonthlySummary();
}

function updateAnalyticsStats() {
    const total = allTransactions.length;
    const fraud = allTransactions.filter(t => t.status === 'suspicious').length;
    const fraudRate = total > 0 ? ((fraud / total) * 100).toFixed(1) : 0;
    const totalAmount = allTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    document.getElementById('analyticsStats').innerHTML = `
        <div class="stat-card-small"><i class="fas fa-chart-line"></i><h3>Fraud Rate</h3><p>${fraudRate}%</p></div>
        <div class="stat-card-small"><i class="fas fa-rupee-sign"></i><h3>Total Spent</h3><p>₹${(totalAmount/1000).toFixed(0)}K</p></div>
        <div class="stat-card-small"><i class="fas fa-shield-alt"></i><h3>Detection Rate</h3><p>94.5%</p></div>
        <div class="stat-card-small"><i class="fas fa-chart-simple"></i><h3>Fraud Cases</h3><p>${fraud}</p></div>
    `;
}

function renderFraudTrendChart() {
    const ctx = document.getElementById('fraudTrendChart')?.getContext('2d');
    if (!ctx) return;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const fraudData = [2, 1, 4, 3, 5, 4];
    if (fraudTrendChart) fraudTrendChart.destroy();
    fraudTrendChart = new Chart(ctx, {
        type: 'line',
        data: { labels: months, datasets: [{ label: 'Fraud', data: fraudData, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.3, fill: true, pointRadius: 2, borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 8 } }, grid: { lineWidth: 0.5 } }, x: { ticks: { font: { size: 8 } } } } }
    });
}

function renderRiskPieChart() {
    const ctx = document.getElementById('riskPieChart')?.getContext('2d');
    if (!ctx) return;
    let high = 0, medium = 0, low = 0, safe = 0;
    allTransactions.forEach(t => {
        const score = t.risk_score || 0;
        if (score > 60) high++;
        else if (score > 30) medium++;
        else if (score > 0) low++;
        else safe++;
    });
    if (riskPieChart) riskPieChart.destroy();
    riskPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['High', 'Medium', 'Low', 'Safe'], datasets: [{ data: [high, medium, low, safe], backgroundColor: ['#ef4444', '#f59e0b', '#eab308', '#10b981'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 6, font: { size: 8 } } } }, cutout: '55%' }
    });
}


function renderComparisonChart() {
    const ctx = document.getElementById('comparisonChart')?.getContext('2d');
    if (!ctx) return;
    const months = ['Jan', 'Feb', 'Mar', 'Apr'];
    const safeData = [95, 70, 75, 50];
    const fraudData = [70, 45, 95, 80];
    if (comparisonChart) comparisonChart.destroy();
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: { 
            labels: months, 
            datasets: [
                { label: 'Safe', data: safeData, backgroundColor: '#10b981', borderRadius: 4, barPercentage: 0.6 },
                { label: 'Suspicious', data: fraudData, backgroundColor: '#ef4444', borderRadius: 4, barPercentage: 0.6 }
            ] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: true, 
            plugins: { 
                legend: { position: 'top', labels: { boxWidth: 10, font: { size: 9 } } } 
            }, 
            scales: { 
                y: { beginAtZero: true, ticks: { font: { size: 9 } } }, 
                x: { ticks: { font: { size: 9 } } } 
            } 
        }
    });
}


function renderTopRiskyList() {
    const risky = allTransactions.filter(t => t.status === 'suspicious').sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).slice(0, 5);
    const container = document.getElementById('topRiskyList');
    if (container) {
        if (risky.length === 0) {
            container.innerHTML = '<p>No risky transactions found</p>';
        } else {
            container.innerHTML = risky.map(t => `
                <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                    <div><strong>₹${(t.amount || 0).toLocaleString()}</strong><br><small>${t.receiver_name}</small></div>
                    <div><span style="background:#ef4444; color:white; padding:2px 10px; border-radius:15px;">${t.risk_score || 0}%</span></div>
                    <div><small>${new Date(t.transaction_date).toLocaleDateString()}</small></div>
                </div>
            `).join('');
        }
    }
}

function renderMonthlySummary() {
    const monthly = {};
    allTransactions.forEach(t => {
        const month = new Date(t.transaction_date).toLocaleString('default', { month: 'short' });
        if (!monthly[month]) monthly[month] = { total: 0, fraud: 0, amount: 0 };
        monthly[month].total++;
        monthly[month].amount += t.amount || 0;
        if (t.status === 'suspicious') monthly[month].fraud++;
    });
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].filter(m => monthly[m]);
    const container = document.getElementById('monthlySummaryTable');
    if (container) {
        container.innerHTML = `
            <table style="width:100%; border-collapse:collapse;">
                <thead><tr style="background:var(--bg-primary);"><th style="padding:8px">Month</th><th>Transactions</th><th>Frauds</th><th>Total Amount</th></tr></thead>
                <tbody>${months.map(m => `<tr><td style="padding:6px"><strong>${m}</strong></td><td>${monthly[m].total}</td><td style="color:${monthly[m].fraud > 0 ? '#ef4444' : '#10b981'}">${monthly[m].fraud}</td><td>₹${(monthly[m].amount/1000).toFixed(0)}K</td></tr>`).join('')}</tbody>
            </table>
        `;
    }
}

// ============================================
// Notifications
// ============================================
function loadNotifications() {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const container = document.getElementById('notificationsList');
    if (container) {
        if (notifications.length === 0) {
            container.innerHTML = '<div class="notification-item"><i class="fas fa-bell-slash"></i><div><p>No notifications</p></div></div>';
        } else {
            container.innerHTML = notifications.map(n => `
                <div class="notification-item" data-type="${n.type}">
                    <i class="fas ${n.type === 'danger' ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i>
                    <div><p>${n.message}</p><small>${n.time}</small></div>
                </div>
            `).join('');
        }
    }
}

function addNotification(message, type) {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.unshift({ id: Date.now(), message, time: new Date().toLocaleString(), type });
    localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 20)));
    loadNotifications();
}

// ============================================
// Transaction Checker
// ============================================
async function checkTransactionFraud() {
    const amount = parseFloat(document.getElementById('checkAmount').value);
    const receiver = document.getElementById('checkReceiver').value.trim();
    const resultDiv = document.getElementById('checkerResult');
    if (!amount || isNaN(amount)) return showToast('Enter valid amount', 'error');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<p>Analyzing...</p>';
    const data = await callAPI('/users/check-fraud', 'POST', { amount, receiver });
    if (data.success && data.result) {
        const r = data.result;
        const color = r.status === 'critical' ? '#ef4444' : (r.status === 'warning' ? '#f59e0b' : '#10b981');
        resultDiv.innerHTML = `<div style="color:${color};font-size:30px;text-align:center">${r.status === 'critical' ? '🔴' : (r.status === 'warning' ? '🟠' : '🟢')}</div>
            <div style="text-align:center"><h3 style="color:${color}">${r.status === 'critical' ? 'CRITICAL RISK!' : (r.status === 'warning' ? 'MODERATE RISK' : 'SAFE')}</h3>
            <p>${r.message}</p><p><strong>Risk Score: ${r.riskScore}%</strong></p>
            <ul>${r.reasons.map(rs => `<li>${rs}</li>`).join('')}</ul></div>`;
        showToast(r.message, r.status === 'safe' ? 'success' : 'warning');
    }
}

// ============================================
// Add Transaction
// ============================================
async function addTransaction() {
    const amount = parseFloat(prompt('Enter amount (₹):'));
    if (!amount || isNaN(amount)) return showToast('Invalid amount', 'error');
    const receiver = prompt('Enter receiver name:');
    if (!receiver) return showToast('No receiver', 'error');
    const upiId = prompt('Enter UPI ID:', `${receiver.toLowerCase()}@okhdfcbank`);
    const data = await callAPI('/users/transaction', 'POST', { amount, receiver, upiId });
    if (data.success) {
        showToast(data.message, data.status === 'suspicious' ? 'warning' : 'success');
        loadDashboard();
    } else {
        showToast(data.message || 'Transaction failed', 'error');
    }
}

// ============================================
// Update Profile
// ============================================
async function updateProfile(e) {
    e.preventDefault();
    const data = await callAPI('/users/profile', 'PUT', {
        fullName: document.getElementById('profileName').value,
        phone: document.getElementById('profilePhone').value,
        upiId: document.getElementById('profileUPI').value
    });
    if (data.success) {
        showToast('Profile updated!', 'success');
        loadDashboard();
    } else {
        showToast(data.message || 'Update failed', 'error');
    }
}

// ============================================
// Change Password
// ============================================
async function changePassword(e) {
    e.preventDefault();
    const current = document.getElementById('currentPassword').value;
    const newPwd = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmNewPassword').value;
    if (!current || !newPwd || !confirm) return showToast('Fill all fields', 'error');
    if (newPwd !== confirm) return showToast('Passwords do not match', 'error');
    if (newPwd.length < 6) return showToast('Password must be 6+ characters', 'error');
    const data = await callAPI('/users/change-password', 'POST', { currentPassword: current, newPassword: newPwd });
    if (data.success) {
        showToast('Password changed! Please login again.', 'success');
        setTimeout(() => handleLogout(), 1500);
    } else {
        showToast(data.message || 'Failed', 'error');
    }
}

// ============================================
// Report Fraud Submit
// ============================================
function submitFraudReport(e) {
    e.preventDefault();
    const txnId = document.getElementById('reportTxnId').value;
    const reason = document.getElementById('reportReason').value;
    const desc = document.getElementById('reportDescription').value;
    if (!reason || !desc) return showToast('Fill all fields', 'error');
    addNotification(`Fraud report submitted for ${txnId || 'suspicious activity'}`, 'warning');
    showToast('Report submitted!', 'success');
    document.getElementById('reportForm').reset();
}

// ============================================
// Navigation
// ============================================
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById(page).classList.add('active-page');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    if (page === 'analytics') updateAnalytics();
}
// ============================================
// Logout with Custom Modal
// ============================================

function showLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function hideLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function confirmLogout() {
    hideLogoutModal();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'login-register.html';
    }, 500);
}

function handleLogout() {
    showLogoutModal();
}
// ============================================
// Theme Toggle
// ============================================
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
        updateAnalytics();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard loading...');
    
    // Load data
    loadDashboard();
    initThemeToggle();
    
    // Navigation
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.getAttribute('data-page'));
        });
    });
    
    // Check transaction button
    const checkBtn = document.getElementById('checkTransactionBtn');
    if (checkBtn) checkBtn.addEventListener('click', checkTransactionFraud);
    
    // Logout button - UPDATE THIS
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLogoutModal();  // Change from handleLogout to showLogoutModal
        });
    }
    
    // Change password form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) passwordForm.addEventListener('submit', changePassword);
    
    // Report fraud form
    const reportForm = document.getElementById('reportForm');
    if (reportForm) reportForm.addEventListener('submit', submitFraudReport);
    
    // Mobile menu
    const mobileBtn = document.getElementById('mobileMenuBtn');
    if (mobileBtn) mobileBtn.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('open');
    });
    
    // Search and filter
    const searchInput = document.getElementById('searchTransaction');
    if (searchInput) searchInput.addEventListener('input', updateTransactionsTable);
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) statusFilter.addEventListener('change', updateTransactionsTable);
    
    const monthFilter = document.getElementById('monthFilter');
    if (monthFilter) monthFilter.addEventListener('change', updateTransactionsTable);
    
    // Add transaction button
    const addTxnBtn = document.getElementById('addTransactionBtn');
    if (addTxnBtn) addTxnBtn.addEventListener('click', addTransaction);
    
    // Enter key for checker
    const amountInput = document.getElementById('checkAmount');
    if (amountInput) amountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkTransactionFraud();
    });
    
    const receiverInput = document.getElementById('checkReceiver');
    if (receiverInput) receiverInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkTransactionFraud();
    });
    
    // Settings toggles
    const notifToggle = document.getElementById('notificationToggle');
    if (notifToggle) notifToggle.addEventListener('change', (e) => {
        showToast(`Notifications ${e.target.checked ? 'enabled' : 'disabled'}`, 'success');
    });
    
    const privacyToggle = document.getElementById('privacyToggle');
    if (privacyToggle) privacyToggle.addEventListener('change', (e) => {
        showToast(`Privacy mode ${e.target.checked ? 'enabled' : 'disabled'}`, 'success');
    });
    // ============================================
// Logout Modal Functions
// ============================================

function showLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function hideLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function confirmLogout() {
    hideLogoutModal();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'login-register.html';
    }, 500);
}
    // ============================================
    // LOGOUT MODAL BUTTONS - ADD THIS CODE HERE
    // ============================================
    const confirmBtn = document.getElementById('confirmLogoutBtn');
    const cancelBtn = document.getElementById('cancelLogoutBtn');
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmLogout);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideLogoutModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('logoutModal');
        if (e.target === modal) {
            hideLogoutModal();
        }
    });
    
    console.log('Dashboard ready');
});
