// ============================================
// UPI Fraud Shield - Login & Registration
// Backend API Integration
// ============================================

const API_URL = 'http://localhost:5001/api';

// DOM Elements
const loginForm = document.getElementById('loginFormElement');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const toast = document.getElementById('toast');
const userTypeBtns = document.querySelectorAll('.user-type-btn');
let selectedUserType = 'user';

// ============================================
// User Type Selector
// ============================================

userTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        userTypeBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        // Set selected user type
        selectedUserType = btn.getAttribute('data-type');
        
        // Update placeholder text
        const emailInput = document.getElementById('loginEmail');
        if (selectedUserType === 'admin') {
            emailInput.placeholder = 'Admin Email Address';
        } else {
            emailInput.placeholder = 'Email Address';
        }
    });
});

// ============================================
// Toast Notification Function
// ============================================

function showToast(message, type = 'success') {
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast?.querySelector('.toast-content i');
    
    if (toastMessage) {
        toastMessage.textContent = message;
    }
    
    if (toastIcon) {
        if (type === 'error') {
            toastIcon.className = 'fas fa-exclamation-circle';
            toastIcon.style.color = '#fc8181';
        } else if (type === 'warning') {
            toastIcon.className = 'fas fa-exclamation-triangle';
            toastIcon.style.color = '#f6ad55';
        } else {
            toastIcon.className = 'fas fa-check-circle';
            toastIcon.style.color = '#48bb78';
        }
    }
    
    if (toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// ============================================
// Check if Already Logged In
// ============================================

const token = localStorage.getItem('token') || sessionStorage.getItem('token');
if (token && (window.location.pathname.includes('login-register.html') || window.location.pathname.includes('index.html'))) {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    if (user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else if (user.role === 'user') {
        window.location.href = 'dashboard.html';
    }
}

// ============================================
// Login Form Submit
// ============================================

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        
        if (!email || !password) {
            showToast('Please enter both email and password', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = loginForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Logging in...</span><i class="fas fa-spinner fa-spin"></i>';
        submitBtn.disabled = true;
        
        try {
            let endpoint = `${API_URL}/auth/login`;
            
            // Use admin login endpoint if admin is selected
            if (selectedUserType === 'admin') {
                endpoint = `${API_URL}/auth/admin/login`;
            }
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Store user data and token
                if (rememberMe) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                } else {
                    sessionStorage.setItem('token', data.token);
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                }
                
                showToast('Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }, 1000);
            } else {
                showToast(data.message || 'Invalid email or password', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast('Cannot connect to server. Make sure backend is running on port 5001', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}


// ============================================
// Forgot Password - Styled Popup
// ============================================

if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Create custom styled dialog
        const modalHtml = `
            <div id="forgotPasswordModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(4px);">
                <div style="background: white; border-radius: 20px; width: 90%; max-width: 400px; overflow: hidden; animation: slideIn 0.3s ease; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
                    <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 20px; text-align: center;">
                        <i class="fas fa-key" style="font-size: 40px; color: white; margin-bottom: 10px;"></i>
                        <h2 style="color: white; margin: 0; font-size: 22px;">Reset Password</h2>
                    </div>
                    <div style="padding: 25px;">
                        <p style="color: #4a5568; margin-bottom: 20px; text-align: center;">Enter your registered email address to receive password reset link.</p>
                        <input type="email" id="resetEmailInput" placeholder="Email Address" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 14px; margin-bottom: 20px; box-sizing: border-box;">
                        <div style="display: flex; gap: 12px;">
                            <button id="resetSubmitBtn" style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: 600;">Send Reset Link</button>
                            <button id="resetCancelBtn" style="flex: 1; background: #e2e8f0; color: #4a5568; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: 600;">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.getElementById('forgotPasswordModal');
        const submitBtn = document.getElementById('resetSubmitBtn');
        const cancelBtn = document.getElementById('resetCancelBtn');
        const emailInput = document.getElementById('resetEmailInput');
        
        submitBtn.addEventListener('click', () => {
            const email = emailInput.value.trim();
            if (email) {
                showToast(`Password reset link sent to ${email}`, 'success');
                modal.remove();
            } else {
                showToast('Please enter your email address', 'error');
            }
        });
        
        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Enter key submit
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitBtn.click();
            }
        });
        
        emailInput.focus();
    });
}
// ============================================
// Check Server Connection
// ============================================

async function checkServerConnection() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        if (data.success) {
            console.log('✅ Backend server is running on port 5001');
        }
    } catch (error) {
        console.warn('⚠️ Backend server not running. Please start with: node server.js');
        showToast('Backend server not connected. Please start the server.', 'warning');
    }
}

checkServerConnection();

console.log('Login page ready - Connected to backend at ' + API_URL);