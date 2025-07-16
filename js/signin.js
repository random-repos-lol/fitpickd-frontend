// Sign-in page logic: handle authentication and form validation for user login

document.addEventListener('DOMContentLoaded', function() {
    // Password toggle functionality
    const togglePassword = document.getElementById('toggle-customer-password');
    const passwordInput = document.getElementById('customer-password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
    // Attach the event handler to the form
    const form = document.getElementById('customer-login-form');
    if (form) {
        form.addEventListener('submit', handleCustomerLogin);
    }
    // Mobile back button
    const mobileBackBtn = document.getElementById('mobile-back-btn');
    if (mobileBackBtn) {
        mobileBackBtn.addEventListener('click', function() {
            history.back();
        });
}
});

// Handle customer login
function handleCustomerLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('customer-email').value;
    const password = document.getElementById('customer-password').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Call backend API for customer login
    fetch('http://localhost:4000/customers/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store customer session in sessionStorage (consistent with other files)
        sessionStorage.setItem('fitpickd_customer_session', 'true');
            sessionStorage.setItem('fitpickd_customer_id', data.user.id);
        sessionStorage.setItem('fitpickd_customer_name', data.user.firstName);
        sessionStorage.setItem('fitpickd_customer_email', data.user.email);
        sessionStorage.setItem('fitpickd_customer_phone', data.user.phone);
            sessionStorage.setItem('fitpickd_user_role', 'customer');
            
            // Also set cookies for main.js compatibility
            setCookie('customer_id', data.user.id, 7);
            setCookie('customer_name', data.user.firstName, 7);
            setCookie('customer_email', data.user.email, 7);
            setCookie('customer_phone', data.user.phone, 7);
            
            showNotification('Login successful! Redirecting...', 'success');
            
            // Redirect to profile page
        setTimeout(() => {
                window.location.href = '/html/index.html';
        }, 1500);
        } else {
            showNotification(data.error || 'Login failed', 'error');
            document.getElementById('customer-password').value = '';
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
        document.getElementById('customer-password').value = '';
    });
}

// Check if user is already logged in
function checkLoginStatus() {
    const customerSession = sessionStorage.getItem('fitpickd_customer_session');
    
    if (customerSession === 'true') {
        window.location.href = '/html/index.html';
    }
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
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Utility: Set cookie
function setCookie(name, value, days) {
    const expires = days ? `; expires=${new Date(Date.now() + days*24*60*60*1000).toUTCString()}` : '';
    document.cookie = `${name}=${encodeURIComponent(value || '')}${expires}; path=/`;
}

// Check login status when page loads
checkLoginStatus(); 