// ============================================
// Admin Login JavaScript
// ============================================

// DOM Elements
const adminForm = document.getElementById('adminLoginForm');
const loginBtn = document.getElementById('loginBtn');
const toast = document.getElementById('toast');
const forgotPasswordLink = document.getElementById('forgotPassword');

// ============================================
// Toast Notification Function
// ============================================

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// Loading State Function
// ============================================

function setLoading(isLoading) {
    if (isLoading) {
        loginBtn.classList.add('loading');
        loginBtn.innerHTML = '<span>Authenticating...</span><i class="fas fa-spinner"></i>';
        loginBtn.disabled = true;
    } else {
        loginBtn.classList.remove('loading');
        loginBtn.innerHTML = '<span>Login as Admin</span><i class="fas fa-arrow-right"></i>';
        loginBtn.disabled = false;
    }
}

// ============================================
// Create Default Admin Account
// ============================================

function createDefaultAdmin() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const adminExists = users.find(u => u.email === 'admin@upishield.com' && u.role === 'admin');
    
    if (!adminExists) {
        const newAdmin = {
            userId: 'ADM' + Date.now(),
            username: 'Administrator',
            fullName: 'System Administrator',
            email: 'admin@upishield.com',
            phone: '9999999999',
            password: 'admin123456',
            role: 'admin',
            adminId: 'ADMIN001',
            department: 'IT Security',
            designation: 'System Administrator',
            status: 'active',
            registeredAt: new Date().toISOString(),
            lastLogin: null
        };
        users.push(newAdmin);
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Default admin account created');
    }
}

// ============================================
// Check if Admin is Already Logged In
// ============================================

function checkAlreadyLoggedIn() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
    if (currentUser && currentUser.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
        return true;
    }
    return false;
}

// ============================================
// Handle Admin Login
// ============================================

function handleAdminLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!email || !password) {
        showToast('Please enter both email and password', 'error');
        return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const adminUser = users.find(u => u.email === email && u.password === password && u.role === 'admin');
        
        if (adminUser) {
            const currentAdmin = {
                userId: adminUser.userId,
                username: adminUser.username,
                fullName: adminUser.fullName,
                email: adminUser.email,
                role: 'admin',
                adminId: adminUser.adminId,
                loggedInAt: new Date().toISOString()
            };
            
            if (rememberMe) {
                localStorage.setItem('currentUser', JSON.stringify(currentAdmin));
            } else {
                sessionStorage.setItem('currentUser', JSON.stringify(currentAdmin));
            }
            
            // Update last login
            adminUser.lastLogin = new Date().toISOString();
            localStorage.setItem('users', JSON.stringify(users));
            
            showToast('Login successful! Redirecting to admin dashboard...', 'success');
            
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);
        } else {
            showToast('Invalid admin credentials. Access denied.', 'error');
            setLoading(false);
        }
    }, 1000);
}

// ============================================
// Forgot Password Handler
// ============================================

function handleForgotPassword(event) {
    event.preventDefault();
    const email = prompt('Enter your admin email address:');
    
    if (email) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const adminUser = users.find(u => u.email === email && u.role === 'admin');
        
        if (adminUser) {
            showToast(`Password reset link sent to ${email}`, 'success');
        } else {
            showToast('No admin account found with this email', 'error');
        }
    }
}

// ============================================
// Auto-fill Demo Credentials
// ============================================

function autoFillDemo() {
    const emailInput = document.getElementById('adminEmail');
    const passwordInput = document.getElementById('adminPassword');
    
    if (emailInput && passwordInput) {
        emailInput.value = 'admin@upishield.com';
        passwordInput.value = 'admin123456';
    }
}

// ============================================
// Animate Background Circles
// ============================================

function animateCircles() {
    const circles = document.querySelectorAll('.bg-animation .circle');
    circles.forEach((circle, index) => {
        const duration = 15 + index * 2;
        const delay = index * 1.5;
        circle.style.animation = `float ${duration}s infinite ease-in-out ${delay}s`;
    });
}

// ============================================
// Initialize Page
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (checkAlreadyLoggedIn()) return;
    
    // Create default admin account
    createDefaultAdmin();
    
    // Auto-fill demo credentials
    autoFillDemo();
    
    // Animate background circles
    animateCircles();
    
    // Add event listeners
    adminForm.addEventListener('submit', handleAdminLogin);
    forgotPasswordLink.addEventListener('click', handleForgotPassword);
    
    // Log to console
    console.log('========================================');
    console.log('Admin Login Page Loaded');
    console.log('Demo: admin@upishield.com / admin123456');
    console.log('========================================');
});