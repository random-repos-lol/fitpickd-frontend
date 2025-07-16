// Forgot password page logic: handle password recovery and form validation

document.addEventListener('DOMContentLoaded', function() {
    initializeForgotPassword();
    updateUserNavigation(); // Call updateUserNavigation on page load
});

// Initialize forgot password functionality
function initializeForgotPassword() {
    const googleVerifyBtn = document.getElementById('google-verify-btn');
    if (googleVerifyBtn) {
        googleVerifyBtn.addEventListener('click', handleGoogleVerification);
    }
}

// Handle Google OAuth verification
async function handleGoogleVerification() {
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();
    
    // Validate email
    if (!email) {
        showNotification('Please enter your email address.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    // Store email for later comparison
    sessionStorage.setItem('forgot_password_email', email);
    
    // Redirect to Google OAuth for forgot password
    const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
    const googleAuthURL = `${API_BASE}/auth/google/forgot-password`;
    window.location.href = googleAuthURL;
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Check if user came back from Google OAuth
function checkOAuthReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthEmail = urlParams.get('email');
    const oauthError = urlParams.get('error');
    
    if (oauthEmail) {
        // User successfully authenticated with Google
        const storedEmail = sessionStorage.getItem('forgot_password_email');
        
        if (storedEmail && oauthEmail.toLowerCase() === storedEmail.toLowerCase()) {
            // Emails match, proceed to check password
            checkPasswordForEmail(storedEmail);
        } else {
            // Emails don't match
            showModal('Email Verification Failed', 
                'The email address you entered does not match your Google account email. Please try again with the correct email address.', 
                'error');
        }
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        sessionStorage.removeItem('forgot_password_email');
    } else if (oauthError) {
        // OAuth error
        showModal('Authentication Error', 
            'There was an error with Google authentication. Please try again.', 
            'error');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Check password for the given email
async function checkPasswordForEmail(email) {
    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        const response = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.password) {
                // Account found, show password
                showModal('Password Found', 
                    `Your password is: <strong>${data.password}</strong><br><br>Please save this password securely.`, 
                    'success');
            } else {
                // No account found
                showModal('Account Not Found', 
                    'No account was found with this email address. Please check your email and try again.', 
                    'error');
            }
        } else {
            showModal('Error', data.message || 'An error occurred while checking your account.', 'error');
        }
    } catch (error) {
        console.error('Error checking password:', error);
        showModal('Error', 'An error occurred while checking your account. Please try again.', 'error');
    }
}

// Show modal with content
function showModal(title, content, type = 'info') {
    const modal = document.getElementById('password-modal');
    const modalContent = document.getElementById('modal-content');
    
    // Set modal content based on type
    let icon, bgColor;
    switch (type) {
        case 'success':
            icon = 'fas fa-check-circle text-green-500';
            bgColor = 'text-green-600';
            break;
        case 'error':
            icon = 'fas fa-exclamation-circle text-red-500';
            bgColor = 'text-red-600';
            break;
        default:
            icon = 'fas fa-info-circle text-blue-500';
            bgColor = 'text-blue-600';
    }
    
    modalContent.innerHTML = `
        <div class="text-center">
            <i class="${icon} text-4xl mb-4"></i>
            <h3 class="text-xl font-semibold ${bgColor} mb-2">${title}</h3>
            <p class="text-gray-600">${content}</p>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

// Close modal
function closeModal() {
    const modal = document.getElementById('password-modal');
    modal.classList.add('hidden');
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification fixed top-20 right-4 z-50 p-4 rounded-md shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // Set notification content based on type
    let bgColor, textColor, icon;
    switch (type) {
        case 'success':
            bgColor = 'bg-green-500';
            textColor = 'text-white';
            icon = 'fas fa-check-circle';
            break;
        case 'error':
            bgColor = 'bg-red-500';
            textColor = 'text-white';
            icon = 'fas fa-exclamation-circle';
            break;
        default:
            bgColor = 'bg-blue-500';
            textColor = 'text-white';
            icon = 'fas fa-info-circle';
    }
    
    notification.className += ` ${bgColor} ${textColor}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="${icon} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Check for OAuth return when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkOAuthReturn();
}); 