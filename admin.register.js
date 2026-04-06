// ============================================
// Admin Registration JavaScript - Complete
// ============================================

// DOM Elements
const adminRegisterForm = document.getElementById('adminRegisterForm');
const adminPassword = document.getElementById('adminPassword');
const adminConfirmPassword = document.getElementById('adminConfirmPassword');
const strengthBars = document.querySelectorAll('.strength-bar');
const strengthText = document.querySelector('.strength-text');
const registerBtn = document.getElementById('registerBtn');
const toast = document.getElementById('toast');
const termsCheckbox = document.getElementById('termsCheckbox');

// Admin Registration Code (Demo code - in production use secure verification)
const ADMIN_REGISTRATION_CODE = 'ADMIN2025';

// Check if already logged in
function checkAlreadyLoggedIn() {
    const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
        return true;
    }
    return false;
}

// Show toast notification
function showToast(message, type = 'success') {
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('.toast-content i');
    
    toastMessage.textContent = message;
    
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
    
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = '';
    
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    
    strengthBars.forEach(bar => bar.className = 'strength-bar');
    
    if (password.length > 0) {
        if (strength === 1) {
            strengthBars[0].classList.add('weak');
            strengthText.textContent = 'Weak';
            strengthText.style.color = '#fc8181';
        } else if (strength === 2) {
            strengthBars[0].classList.add('medium');
            strengthBars[1].classList.add('medium');
            strengthText.textContent = 'Medium';
            strengthText.style.color = '#f6ad55';
        } else if (strength === 3) {
            strengthBars[0].classList.add('strong');
            strengthBars[1].classList.add('strong');
            strengthBars[2].classList.add('strong');
            strengthText.textContent = 'Strong';
            strengthText.style.color = '#48bb78';
        } else if (strength === 4) {
            strengthBars.forEach(bar => bar.classList.add('strong'));
            strengthText.textContent = 'Very Strong';
            strengthText.style.color = '#48bb78';
        }
    } else {
        strengthText.textContent = 'Password strength';
        strengthText.style.color = '#718096';
    }
    
    return strength;
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone number
function isValidPhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
}

// Validate date of birth (must be 18+)
function isValidAge(dob) {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 18;
}

// Validate password strength
function isStrongPassword(password) {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasMinLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
}

// Set button loading state
function setButtonLoading(isLoading) {
    if (isLoading) {
        registerBtn.classList.add('loading');
        registerBtn.innerHTML = '<span>Processing...</span><i class="fas fa-spinner fa-spin"></i>';
        registerBtn.disabled = true;
    } else {
        registerBtn.classList.remove('loading');
        registerBtn.innerHTML = '<span>Register as Administrator</span><i class="fas fa-arrow-right"></i>';
        registerBtn.disabled = false;
    }
}

// Handle admin registration
function handleAdminRegister(event) {
    event.preventDefault();
    
    // Get form values
    const fullName = document.getElementById('adminFullName').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const phone = document.getElementById('adminPhone').value.trim();
    const dob = document.getElementById('adminDob').value;
    const gender = document.getElementById('adminGender').value;
    const adminId = document.getElementById('adminId').value.trim();
    const department = document.getElementById('adminDepartment').value.trim();
    const designation = document.getElementById('adminDesignation').value.trim();
    const password = adminPassword.value;
    const confirmPassword = adminConfirmPassword.value;
    const registrationCode = document.getElementById('adminCode').value.trim();
    
    // Validate all fields
    if (!fullName || !email || !phone || !dob || !gender || !adminId || !department || !designation || !password || !confirmPassword || !registrationCode) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate email
    if (!isValidEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    // Validate phone
    if (!isValidPhone(phone)) {
        showToast('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    
    // Validate age (must be 18+)
    if (!isValidAge(dob)) {
        showToast('You must be at least 18 years old to register as admin', 'error');
        return;
    }
    
    // Validate registration code
    if (registrationCode !== ADMIN_REGISTRATION_CODE) {
        showToast('Invalid admin registration code. Please contact system administrator.', 'error');
        return;
    }
    
    // Validate password match
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    // Validate password strength
    if (!isStrongPassword(password)) {
        showToast('Password must be at least 8 characters with uppercase, lowercase, number and special character', 'error');
        return;
    }
    
    // Validate terms acceptance
    if (!termsCheckbox.checked) {
        showToast('Please accept the Terms of Service and Privacy Policy', 'error');
        return;
    }
    
    setButtonLoading(true);
    
    setTimeout(() => {
        // Check if admin already exists
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const existingAdmin = users.find(u => u.email === email);
        
        if (existingAdmin) {
            showToast('An account with this email already exists', 'error');
            setButtonLoading(false);
            return;
        }
        
        // Create new admin account
        const newAdmin = {
            username: fullName,
            email: email,
            phone: phone,
            dateOfBirth: dob,
            gender: gender,
            adminId: adminId,
            department: department,
            designation: designation,
            password: password,
            role: 'admin',
            registeredAt: new Date().toISOString(),
            status: 'active',
            lastLogin: null
        };
        
        users.push(newAdmin);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Auto login after registration
        const currentUser = {
            username: fullName,
            email: email,
            role: 'admin',
            adminId: adminId,
            department: department,
            designation: designation,
            upiId: `admin_${adminId}@upishield.com`,
            loggedInAt: new Date().toISOString()
        };
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showToast('Admin registration successful! Redirecting to admin dashboard...', 'success');
        
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 1500);
    }, 1000);
}

// Modal handlers
function initModals() {
    const termsModal = document.getElementById('termsModal');
    const privacyModal = document.getElementById('privacyModal');
    const termsLink = document.getElementById('termsLink');
    const privacyLink = document.getElementById('privacyLink');
    const closeBtns = document.querySelectorAll('.close');
    const acceptTerms = document.getElementById('acceptTerms');
    const acceptPrivacy = document.getElementById('acceptPrivacy');
    
    termsLink?.addEventListener('click', (e) => {
        e.preventDefault();
        termsModal.style.display = 'block';
    });
    
    privacyLink?.addEventListener('click', (e) => {
        e.preventDefault();
        privacyModal.style.display = 'block';
    });
    
    acceptTerms?.addEventListener('click', () => {
        termsModal.style.display = 'none';
        showToast('Terms accepted', 'success');
    });
    
    acceptPrivacy?.addEventListener('click', () => {
        privacyModal.style.display = 'none';
        showToast('Privacy policy accepted', 'success');
    });
    
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            termsModal.style.display = 'none';
            privacyModal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === termsModal) termsModal.style.display = 'none';
        if (e.target === privacyModal) privacyModal.style.display = 'none';
    });
}

// Add input validation listeners
function initValidation() {
    const emailInput = document.getElementById('adminEmail');
    const phoneInput = document.getElementById('adminPhone');
    const codeInput = document.getElementById('adminCode');
    const dobInput = document.getElementById('adminDob');
    
    emailInput?.addEventListener('blur', () => {
        if (emailInput.value && !isValidEmail(emailInput.value)) {
            emailInput.style.borderColor = '#ef4444';
            showToast('Please enter a valid email address', 'warning');
        } else {
            emailInput.style.borderColor = '#e2e8f0';
        }
    });
    
    phoneInput?.addEventListener('blur', () => {
        if (phoneInput.value && !isValidPhone(phoneInput.value)) {
            phoneInput.style.borderColor = '#ef4444';
            showToast('Please enter a valid 10-digit phone number', 'warning');
        } else {
            phoneInput.style.borderColor = '#e2e8f0';
        }
    });
    
    codeInput?.addEventListener('input', () => {
        if (codeInput.value === ADMIN_REGISTRATION_CODE) {
            codeInput.style.borderColor = '#48bb78';
            showToast('Valid registration code!', 'success');
        } else if (codeInput.value.length > 0) {
            codeInput.style.borderColor = '#ef4444';
        } else {
            codeInput.style.borderColor = '#e2e8f0';
        }
    });
    
    dobInput?.addEventListener('blur', () => {
        if (dobInput.value && !isValidAge(dobInput.value)) {
            dobInput.style.borderColor = '#ef4444';
            showToast('You must be at least 18 years old', 'warning');
        } else if (dobInput.value) {
            dobInput.style.borderColor = '#48bb78';
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (checkAlreadyLoggedIn()) return;
    
    // Set max date for DOB (18 years ago)
    const dobInput = document.getElementById('adminDob');
    if (dobInput) {
        const today = new Date();
        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        const maxDate = eighteenYearsAgo.toISOString().split('T')[0];
        dobInput.max = maxDate;
    }
    
    // Add event listeners
    adminRegisterForm.addEventListener('submit', handleAdminRegister);
    adminPassword.addEventListener('input', (e) => checkPasswordStrength(e.target.value));
    
    // Initialize modals and validation
    initModals();
    initValidation();
    
    // Add floating animation to circles
    const circles = document.querySelectorAll('.circle');
    circles.forEach((circle, index) => {
        const duration = 15 + index * 2;
        const delay = index * 1.5;
        circle.style.animation = `float ${duration}s infinite ease-in-out ${delay}s`;
    });
    
    // Fade in animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s';
    setTimeout(() => document.body.style.opacity = '1', 100);
});

// Demo admin registration code info
console.log('========================================');
console.log('Admin Registration Code: ADMIN2025');
console.log('========================================');