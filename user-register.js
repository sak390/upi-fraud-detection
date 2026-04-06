// ============================================
// UPI Fraud Shield - User Registration
// Backend API Integration
// ============================================

const API_URL = 'http://localhost:5000/api';

const registerForm = document.getElementById('userRegisterForm');
const toast = document.getElementById('toast');

function showToast(message, type = 'success') {
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast?.querySelector('.toast-content i');
    
    if (toastMessage) toastMessage.textContent = message;
    
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

// Check if already logged in
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
if (token) {
    window.location.href = 'dashboard.html';
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        
        if (!fullName || !email || !password) {
            showToast('Please fill all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('Passwords do not match!', 'error');
            return;
        }
        
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        const phone = '9' + Math.floor(Math.random() * 900000000 + 100000000);
        
        const submitBtn = registerForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Creating Account...</span><i class="fas fa-spinner fa-spin"></i>';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, phone, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('user', JSON.stringify(data.user));
                
                showToast('Registration successful! Redirecting to dashboard...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showToast(data.message || 'Registration failed', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Registration error:', error);
            showToast('Cannot connect to server. Make sure backend is running on port 5000', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

console.log('Registration page ready');s