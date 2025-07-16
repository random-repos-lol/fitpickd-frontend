// Profile page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    checkUserAuthentication();
    loadUserProfile();
    initializeProfileForm();
    // Logout for mobile
    const logoutBtn = document.getElementById('mobile-logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', window.logout);
    // Logout for desktop
    const desktopLogoutBtn = document.getElementById('desktop-logout-btn');
    if (desktopLogoutBtn) desktopLogoutBtn.addEventListener('click', window.logout);
    // Change Password
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) changePasswordBtn.addEventListener('click', changePassword);
    // Delete Account
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) deleteAccountBtn.addEventListener('click', deleteAccount);
    // Change Password Modal Actions
    const closeChangePasswordModalBtn = document.getElementById('close-change-password-modal');
    if (closeChangePasswordModalBtn) closeChangePasswordModalBtn.addEventListener('click', closeChangePasswordModal);
    const cancelChangePasswordBtn = document.getElementById('cancel-change-password-btn');
    if (cancelChangePasswordBtn) cancelChangePasswordBtn.addEventListener('click', closeChangePasswordModal);
    const verifyCurrentPasswordBtn = document.getElementById('verify-current-password-btn');
    if (verifyCurrentPasswordBtn) verifyCurrentPasswordBtn.addEventListener('click', verifyCurrentPassword);
    const backToStep1Btn = document.getElementById('back-to-step1-btn');
    if (backToStep1Btn) backToStep1Btn.addEventListener('click', backToStep1);
    const updatePasswordBtn = document.getElementById('update-password-btn');
    if (updatePasswordBtn) updatePasswordBtn.addEventListener('click', updatePassword);
    // Delete Account Modal Actions
    const closeDeleteAccountModalBtn = document.getElementById('close-delete-account-modal');
    if (closeDeleteAccountModalBtn) closeDeleteAccountModalBtn.addEventListener('click', closeDeleteAccountModal);
    const cancelDeleteAccountBtn = document.getElementById('cancel-delete-account-btn');
    if (cancelDeleteAccountBtn) cancelDeleteAccountBtn.addEventListener('click', closeDeleteAccountModal);
    const verifyDeletePasswordBtn = document.getElementById('verify-delete-password-btn');
    if (verifyDeletePasswordBtn) verifyDeletePasswordBtn.addEventListener('click', verifyDeletePassword);
    const backToDeleteStep1Btn = document.getElementById('back-to-delete-step1-btn');
    if (backToDeleteStep1Btn) backToDeleteStep1Btn.addEventListener('click', backToDeleteStep1);
    const confirmDeleteAccountBtn = document.getElementById('confirm-delete-account-btn');
    if (confirmDeleteAccountBtn) confirmDeleteAccountBtn.addEventListener('click', confirmDeleteAccount);
});

// Check if user is authenticated
function checkUserAuthentication() {
    const session = sessionStorage.getItem('fitpickd_customer_session');
    const cookie = getCookie('customer_id');
    if (session !== 'true' && !cookie) {
        // Show sign-in form for unsigned users
        showSignInForm();
        return;
    }
    // Update navigation with user menu
    updateUserNavigation();
}

// Show sign-in form for unsigned users
function showSignInForm() {
    const profileSection = document.querySelector('section');
    profileSection.innerHTML = `
        <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-12">
                <h1 class="text-4xl font-bold text-black mb-4">Sign In Required</h1>
                <p class="text-gray-600">Please sign in to access your profile</p>
            </div>

            <!-- Sign In Options -->
            <div class="bg-white rounded-lg shadow-lg p-8">
                <div class="text-center mb-8">
                    <h2 class="text-2xl font-semibold text-black mb-4">Sign In to Your Account</h2>
                    <p class="text-gray-600 mb-6">Choose your account type and sign in to access your profile</p>
                </div>
                
                <div class="text-center">
                    <a href="signin.html" class="inline-block bg-black text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors text-lg">
                        <i class="fas fa-sign-in-alt mr-2"></i>Go to Sign In
                    </a>
                </div>
                
                <div class="text-center mt-8">
                    <p class="text-gray-600">Don't have an account? <a href="signup.html" class="text-black hover:underline">Sign up here</a></p>
                </div>
            </div>
        </div>
    `;
}

// Removed duplicate updateUserMenu function. Use main.js version.

// Load user profile data and populate the profile form fields
async function loadUserProfile() {
    const customerId = sessionStorage.getItem('fitpickd_customer_id') || getCookie('fitpickd_customer_id') || localStorage.getItem('fitpickd_customer_id');
    if (!customerId) {
        showError('User data not found. Please sign in again.');
        return;
    }
    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        const res = await fetch(`${API_BASE}/customers`);
        if (!res.ok) throw new Error('Failed to fetch user data');
        const users = await res.json();
        const user = users.find(u => u._id === customerId || u.id === customerId);
        if (!user) {
            showError('User data not found. Please sign in again.');
            return;
        }
        // Populate form fields with user data
        document.getElementById('first-name').value = user.firstName || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
        // Format and display account creation date using createdAt
        const createdDate = user.createdAt ? new Date(user.createdAt) : new Date();
        const formattedDate = createdDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('account-created-date').textContent = formattedDate;
    } catch (err) {
        showError('Failed to load user data. Please try again.');
    }
}

// Initialize profile form
function initializeProfileForm() {
    const form = document.getElementById('profile-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        updateProfile();
    });
}

// Update user profile with new form data and update session/cookies
async function updateProfile() {
    const firstName = document.getElementById('first-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    hideError();
    if (!validateProfileForm(firstName, email, phone)) {
        return;
    }
    const customerId = sessionStorage.getItem('fitpickd_customer_id') || getCookie('fitpickd_customer_id') || localStorage.getItem('fitpickd_customer_id');
    if (!customerId) {
        showError('User data not found. Please sign in again.');
        return;
    }
    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        // Send PATCH request to backend to update user profile
        const res = await fetch(`${API_BASE}/customers/${customerId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, email, phone })
        });
        const responseText = await res.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            showError('Failed to update profile. (Invalid server response)');
            return;
        }
        if (!res.ok) {
            showError(data.error || 'Failed to update profile.');
            return;
        }
        // Update session and cookies with new user data
        sessionStorage.setItem('fitpickd_customer_name', firstName);
        sessionStorage.setItem('fitpickd_customer_email', email);
        sessionStorage.setItem('fitpickd_customer_phone', phone);
        setCookie('fitpickd_customer_name', firstName, 7);
        setCookie('fitpickd_customer_email', email, 7);
        setCookie('fitpickd_customer_phone', phone, 7);
        // Update navigation
        updateUserNavigation();
        // Show success message
        showSuccess('Profile updated successfully!');
    } catch (err) {
        showError('Failed to update profile. Please try again.');
    }
}

// Validate profile form
function validateProfileForm(firstName, email, phone) {
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
    
    return true;
}

// Change password function
let passwordAttempts = 0;
const MAX_ATTEMPTS = 5;

function changePassword() {
    // Reset attempts and show modal
    passwordAttempts = 0;
    document.getElementById('change-password-modal').classList.remove('hidden');
    document.getElementById('step-1').classList.remove('hidden');
    document.getElementById('step-2').classList.add('hidden');
    document.getElementById('modal-error').classList.add('hidden');
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
}

function closeChangePasswordModal() {
    document.getElementById('change-password-modal').classList.add('hidden');
    passwordAttempts = 0;
}

function backToStep1() {
    document.getElementById('step-1').classList.remove('hidden');
    document.getElementById('step-2').classList.add('hidden');
    document.getElementById('modal-error').classList.add('hidden');
    document.getElementById('current-password').value = '';
}

async function verifyCurrentPassword() {
    const currentPassword = document.getElementById('current-password').value;
    if (!currentPassword) {
        showModalError('Please enter your current password.');
        return;
    }

    const customerId = sessionStorage.getItem('fitpickd_customer_id') || getCookie('fitpickd_customer_id') || localStorage.getItem('fitpickd_customer_id');
    if (!customerId) {
        showModalError('User data not found. Please sign in again.');
        return;
    }

    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        // Verify current password with backend
        const res = await fetch(`${API_BASE}/customers/${customerId}/verify-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: currentPassword })
        });

        if (res.ok) {
            // Password is correct, proceed to step 2
            document.getElementById('step-1').classList.add('hidden');
            document.getElementById('step-2').classList.remove('hidden');
            document.getElementById('modal-error').classList.add('hidden');
        } else {
            passwordAttempts++;
            if (passwordAttempts >= MAX_ATTEMPTS) {
                showModalError('Too many failed attempts. Please logout and login again to try again.');
                setTimeout(() => {
                    closeChangePasswordModal();
                    window.logout();
                }, 3000);
            } else {
                showModalError(`Incorrect password. ${MAX_ATTEMPTS - passwordAttempts} attempts remaining.`);
                document.getElementById('current-password').value = '';
            }
        }
    } catch (err) {
        showModalError('Failed to verify password. Please try again.');
    }
}

async function updatePassword() {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!newPassword || newPassword.length < 6) {
        showModalError('New password must be at least 6 characters long.');
        return;
    }

    if (newPassword !== confirmPassword) {
        showModalError('Passwords do not match.');
        return;
    }

    const customerId = sessionStorage.getItem('fitpickd_customer_id') || getCookie('fitpickd_customer_id') || localStorage.getItem('fitpickd_customer_id');
    if (!customerId) {
        showModalError('User data not found. Please sign in again.');
        return;
    }

    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        // Update password in backend
        const res = await fetch(`${API_BASE}/customers/${customerId}/password`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword })
        });

        if (res.ok) {
            showSuccess('Password changed successfully!');
            closeChangePasswordModal();
        } else {
            const data = await res.json();
            showModalError(data.error || 'Failed to update password.');
        }
    } catch (err) {
        showModalError('Failed to update password. Please try again.');
    }
}

function showModalError(message) {
    const errorElement = document.getElementById('modal-error');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

// Delete account function
function deleteAccount() {
    // Show delete account modal
    document.getElementById('delete-account-modal').classList.remove('hidden');
    document.getElementById('delete-step-1').classList.remove('hidden');
    document.getElementById('delete-step-2').classList.add('hidden');
    document.getElementById('delete-modal-error').classList.add('hidden');
    document.getElementById('delete-password').value = '';
}

function closeDeleteAccountModal() {
    document.getElementById('delete-account-modal').classList.add('hidden');
}

function backToDeleteStep1() {
    document.getElementById('delete-step-1').classList.remove('hidden');
    document.getElementById('delete-step-2').classList.add('hidden');
    document.getElementById('delete-modal-error').classList.add('hidden');
    document.getElementById('delete-password').value = '';
}

async function verifyDeletePassword() {
    const password = document.getElementById('delete-password').value;
    if (!password) {
        showDeleteModalError('Please enter your current password.');
        return;
    }

    const customerId = sessionStorage.getItem('fitpickd_customer_id') || getCookie('fitpickd_customer_id') || localStorage.getItem('fitpickd_customer_id');
    if (!customerId) {
        showDeleteModalError('User data not found. Please sign in again.');
        return;
    }

    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        // Verify password with backend
        const res = await fetch(`${API_BASE}/customers/${customerId}/verify-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (res.ok) {
            // Password is correct, proceed to final confirmation
            document.getElementById('delete-step-1').classList.add('hidden');
            document.getElementById('delete-step-2').classList.remove('hidden');
            document.getElementById('delete-modal-error').classList.add('hidden');
        } else {
            showDeleteModalError('Incorrect password. Please try again.');
            document.getElementById('delete-password').value = '';
        }
    } catch (err) {
        showDeleteModalError('Failed to verify password. Please try again.');
    }
}

async function confirmDeleteAccount() {
    const customerId = sessionStorage.getItem('fitpickd_customer_id') || getCookie('fitpickd_customer_id') || localStorage.getItem('fitpickd_customer_id');
    if (!customerId) {
        showDeleteModalError('User data not found. Please sign in again.');
        return;
    }

    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        // Delete account from backend
        const res = await fetch(`${API_BASE}/customers/${customerId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            showSuccess('Account deleted successfully!');
            closeDeleteAccountModal();
            // Logout and redirect to homepage
            setTimeout(() => {
                window.logout();
            }, 1500);
        } else {
            const data = await res.json();
            showDeleteModalError(data.error || 'Failed to delete account.');
        }
    } catch (err) {
        showDeleteModalError('Failed to delete account. Please try again.');
    }
}

function showDeleteModalError(message) {
    const errorElement = document.getElementById('delete-modal-error');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (!errorDiv) return;
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

// Hide error message
function hideError() {
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.add('hidden');
}

// Show success message
function showSuccess(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg max-w-sm bg-green-100 text-green-800 transition-all duration-300 translate-y-[-100px] opacity-0';
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-y-[-100px]', 'opacity-0');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-y-[-100px]', 'opacity-0');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

 

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}
function deleteCookie(name) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
} 

function setCookie(name, value, days) {
    const expires = days
        ? `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}`
        : '';
    document.cookie = `${name}=${encodeURIComponent(value || '')}${expires}; path=/`;
} 