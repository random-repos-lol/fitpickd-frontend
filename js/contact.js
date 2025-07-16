// Contact page logic: handle contact form submission and WhatsApp integration

document.addEventListener('DOMContentLoaded', function() {
    initializeContactForm();
    initializeFormValidation();
    updateUserNavigation(); // Call updateUserNavigation on page load
    
    // Character counter for message textarea
    const messageTextarea = document.getElementById('message');
    const messageCounter = document.getElementById('message-counter');
    if (messageTextarea && messageCounter) {
        const updateCounter = () => {
            messageCounter.textContent = `${messageTextarea.value.length} / 1000`;
        };
        messageTextarea.addEventListener('input', updateCounter);
        updateCounter(); // Initialize on load
    }
});

// Initialize contact form
function initializeContactForm() {
    const contactForm = document.getElementById('contact-form');
    contactForm.addEventListener('submit', handleContactSubmit);
}

// Handle contact form submission
function handleContactSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const message = formData.get('message');
    
    // Validate form
    if (!validateContactForm(name)) {
        return;
    }
    
    // Build WhatsApp message
    const whatsappMessage = buildWhatsAppMessage(name, message);
    
    // Open WhatsApp
    openWhatsApp(whatsappMessage);
    
    // Show success message
    showNotification('Opening WhatsApp with your message...', 'success');
    
    // Reset form
    event.target.reset();
}

// Validate contact form
function validateContactForm(name) {
    if (!name.trim()) {
        showNotification('Please enter your name.', 'error');
        return false;
    }
    
    return true;
}

// Build WhatsApp message
function buildWhatsAppMessage(name, message) {
    let whatsappMessage = `Hey FitPickd!\n\n`;
    whatsappMessage += `My name is ${name}.`;
    whatsappMessage += `.\n\n`;
    if (message) {
        whatsappMessage += `${message}`;
    }
    return whatsappMessage;
}

// Open WhatsApp with message
function openWhatsApp(message) {
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/919876543210?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
}

// Initialize form validation
function initializeFormValidation() {
    const inputs = document.querySelectorAll('input[required], textarea');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Phone number validation
    if (field.id === 'contact' && value) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanValue = value.replace(/\s/g, '');
        
        if (!phoneRegex.test(cleanValue)) {
            showFieldError(field, 'Please enter a valid phone number');
            return false;
        }
    }
    
    // Name validation
    if (field.id === 'name' && value) {
        if (value.length < 2) {
            showFieldError(field, 'Name must be at least 2 characters long');
            return false;
        }
    }
    
    clearFieldError(field);
    return true;
}

// Show field error
function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('border-red-500');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-red-500 text-sm mt-1';
    errorDiv.textContent = message;
    errorDiv.id = `${field.id}-error`;
    
    field.parentNode.appendChild(errorDiv);
}

// Clear field error
function clearFieldError(field) {
    field.classList.remove('border-red-500');
    
    const errorDiv = document.getElementById(`${field.id}-error`);
    if (errorDiv) {
        errorDiv.remove();
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
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}