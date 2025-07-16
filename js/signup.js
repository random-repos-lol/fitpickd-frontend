// Initialize the sign-up form and handle user registration
function initializeSignupForm() {
    const form = document.getElementById('signup-form');
    const errorMessage = document.getElementById('error-message');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const firstName = document.getElementById('first-name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        hideError();
        if (!validateForm(firstName, email, phone, password, confirmPassword)) {
            return;
        }
        // Only allow signup if email is verified via Google
        if (!googleVerifiedEmail || googleVerifiedEmail !== email) {
            showError('Please verify your email with Google before signing up.');
            return;
        }
        // Check if email or phone already exists in the database
        try {
            const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
            const res = await fetch(`${API_BASE}/customers`);
            if (res.ok) {
                const users = await res.json();
                if (users.some(u => u.email === email)) {
                    showError('This email address is already registered.');
                    return;
                }
                if (users.some(u => u.phone === phone)) {
                    showError('This phone number is already registered.');
                    return;
                }
            }
        } catch (err) {
            showError('Could not check for existing users. Please try again.');
            return;
        }
        // Send to backend
        try {
            const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
            const res = await fetch(`${API_BASE}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, email, phone, password })
            });
            if (res.ok) {
                showSuccess('Account created successfully! Redirecting to sign in...');
                setTimeout(() => {
                    window.location.href = 'signin.html';
                }, 2000);
            } else {
                const data = await res.json();
                showError(data.error || 'Could not create account');
            }
        } catch (err) {
            showError('Network error. Please try again.');
        }
    });
}

// Validate form data
function validateForm(firstName, email, phone, password, confirmPassword) {
    // First name validation
    if (!firstName || firstName.length < 2) {
        showError('First name must be at least 2 characters long.');
        return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showError('Please enter a valid email address.');
        return false;
    }
    
    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phone || !phoneRegex.test(phone)) {
        showError('Please enter a valid 10-digit phone number.');
        return false;
    }
    
    // Password validation
    if (!password || password.length < 6) {
        showError('Password must be at least 6 characters long.');
        return false;
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
        showError('Passwords do not match.');
        return false;
    }
    
    return true;
}

// Check if user already exists
function userExists(email, phone) {
    const users = JSON.parse(localStorage.getItem('fitpickd_users') || '[]');
    return users.some(user => user.email === email || user.phone === phone);
}

// Save user to localStorage
function saveUser(user) {
    const users = JSON.parse(localStorage.getItem('fitpickd_users') || '[]');
    users.push(user);
    localStorage.setItem('fitpickd_users', JSON.stringify(users));
}

// Initialize password toggle functionality
function initializePasswordToggles() {
    const togglePassword = document.getElementById('toggle-password');
    const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
    
    toggleConfirmPassword.addEventListener('click', function() {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
}

// Show error message
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

// Hide error message
function hideError() {
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.add('hidden');
}

// Show success message
function showSuccess(message) {
    // Remove existing notifications
    document.querySelectorAll('.fitpickd-success-notification').forEach(el => el.remove());
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'fitpickd-success-notification fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg max-w-sm bg-green-100 text-green-800 transition-all duration-300 translate-y-[-100px] opacity-0';
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.remove('translate-y-[-100px]', 'opacity-0');
    }, 100);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function enableCreateAccountIfValid() {
    const firstName = document.getElementById('first-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const createAccountBtn = document.querySelector('#signup-form button[type="submit"]');
    if (
        firstName.length >= 2 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
        /^[0-9]{10}$/.test(phone) &&
        password.length >= 6 &&
        password === confirmPassword &&
        googleVerifiedEmail &&
        googleVerifiedEmail === email
    ) {
        createAccountBtn.disabled = false;
        createAccountBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
        createAccountBtn.classList.add('bg-black', 'hover:bg-gray-800');
    } else {
        createAccountBtn.disabled = true;
        createAccountBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
        createAccountBtn.classList.remove('bg-black', 'hover:bg-gray-800');
    }
}

window.enableCreateAccountIfValid = enableCreateAccountIfValid;
window.showSuccess = showSuccess;

// Google OAuth for email verification
let googleVerifiedEmail = null;

function initializeGoogleOAuth() {
    const googleBtn = document.getElementById('google-verify-btn');
    if (!googleBtn) return;
    googleBtn.addEventListener('click', function() {
        // Redirect to backend Google OAuth endpoint
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        window.location.href = `${API_BASE}/auth/google`;
    });

    // On page load, check for verified_email in query params
    const urlParams = new URLSearchParams(window.location.search);
    const verifiedEmail = urlParams.get('verified_email');
    if (verifiedEmail) {
        document.getElementById('email').value = verifiedEmail;
        document.getElementById('email').readOnly = true;
        document.getElementById('verified-email').value = verifiedEmail;
        googleVerifiedEmail = verifiedEmail;
        showSuccess('Email verified with Google!');
        enableCreateAccountIfValid();
    }
}

// Export functions for potential use
window.SignupManager = {
    validateForm,
    userExists,
    saveUser
}; 

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}
// Removed redirect that blocked access to signup page for non-logged-in users
// const session = sessionStorage.getItem('fitpickd_customer_session');
// const cookie = getCookie('fitpickd_customer_session');
// if (session !== 'true' && cookie !== 'true') {
//     window.location.href = 'signin.html';
// }
function deleteCookie(name) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
}

// Removed duplicate updateUserNavigation function. Use main.js version. 