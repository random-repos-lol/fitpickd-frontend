/**
 * FitPickd Main JavaScript
 * Core functionality for the FitPickd e-commerce platform
 */

// Global variables
const products = [];

// Main entry point: initialize core features when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeMobileMenu();
    loadProducts();
    initializeLazyLoading();
    addScrollEffects();
    if (typeof updateUserNavigation === 'function') updateUserNavigation();
    updateWishlistIcons();
});

/**
 * Initialize mobile menu functionality
 * Handles both desktop and mobile navigation menus
 */
function initializeMobileMenu() {
    // Desktop navigation mobile menu
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenuButton.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }

    // Mobile navigation menu
    const mobileMenuButton2 = document.getElementById('mobile-menu-button-2');
    const mobileMenu2 = document.getElementById('mobile-menu-2');

    if (mobileMenuButton2 && mobileMenu2) {
        mobileMenuButton2.addEventListener('click', function() {
            mobileMenu2.classList.toggle('hidden');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenuButton2.contains(event.target) && !mobileMenu2.contains(event.target)) {
                mobileMenu2.classList.add('hidden');
            }
        });
    }
}

/**
 * Load and display featured products on homepage
 */
async function loadProducts() {
    const featuredProductsContainer = document.getElementById('featured-products');
    if (!featuredProductsContainer) return;

    try {
        const res = await fetch('http://localhost:4000/products');
        const products = await res.json();
        
        // Filter featured products and exclude out-of-stock products
        const featuredProducts = products.filter(p => p.featured && !p.outOfStock);

        if (featuredProducts.length === 0) {
            featuredProductsContainer.innerHTML = '<p class="text-gray-500">No featured products at the moment.</p>';
            return;
        }

        // Refactored: Remove inline onclicks, use event delegation
        featuredProductsContainer.innerHTML = featuredProducts.map(product => `
            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover-lift group cursor-pointer" data-product-id="${product._id}">
                <div class="relative aspect-[3/4] w-full">
                    <img src="${product.images && product.images.length > 0 ? product.images[0].url : ''}" alt="${product.name}" 
                         class="w-full h-full object-cover lazy-image transition-transform duration-300 group-hover:scale-105" 
                         loading="lazy">
                    <!-- Wishlist Heart Icon -->
                    <button class="wishlist-btn absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition-colors" data-product-id="${product._id}">
                        <svg class="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                    </button>
                </div>
                <div class="p-3">
                    <div class="mb-1" style="height: 0.5rem;"></div>
                    <h3 class="text-base font-normal text-black mb-1 line-clamp-2">
                        ${product.name}
                    </h3>
                    <div class="flex justify-between items-center">
                        <span class="text-base font-normal text-black">₹ ${product.price.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `).join('');
        // Add event delegation for product card and wishlist button clicks
        featuredProductsContainer.addEventListener('click', function(event) {
            const card = event.target.closest('.product-card');
            const wishlistBtn = event.target.closest('.wishlist-btn');
            if (wishlistBtn) {
                event.stopPropagation();
                const productId = wishlistBtn.getAttribute('data-product-id');
                handleWishlistClick(productId);
                return;
            }
            if (card && card.hasAttribute('data-product-id')) {
                const productId = card.getAttribute('data-product-id');
                window.location.href = 'product.html?id=' + productId;
            }
        });
    } catch (err) {
        featuredProductsContainer.innerHTML = '<p class="text-red-500">Failed to load products.</p>';
    }
}

/**
 * Initialize lazy loading for images
 * Uses Intersection Observer API for performance
 */
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.remove('lazy-image');
                    img.src = img.src;
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }
}

/**
 * Add scroll effects and animations
 * Observes elements for fade-in animations
 */
function addScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.product-card, .fade-in-up');
    animateElements.forEach(el => observer.observe(el));
}

/**
 * Open WhatsApp with product information
 * @param {string} productName - Name of the product
 * @param {number} price - Price of the product
 * @param {string} size - Selected size (default: 'Not selected')
 */
function openWhatsApp(productName, price, size = 'Not selected') {
    const message = `Hi! I'm interested in the ${productName} (Size: ${size}, Price: ₹ ${price.toFixed(2)}). Could you please share the order details and availability?`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/919876543210?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
}

/**
 * Format price in Indian currency format
 * @param {number} price - Price to format
 * @returns {string} Formatted price string
 */
function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(price);
}

/**
 * Save products to localStorage
 * @param {Array} products - Products array to save
 */
function saveProducts(products) {
    localStorage.setItem('fitpickd_products', JSON.stringify(products));
}

/**
 * Get products from localStorage
 * @returns {Array} Products array from localStorage
 */
function getProducts() {
    const stored = localStorage.getItem('fitpickd_products');
    return stored ? JSON.parse(stored) : products;
}

/**
 * Add new product to localStorage (for admin)
 * @param {Object} product - Product object to add
 * @returns {Object} Added product with ID
 */
function addProduct(product) {
    const currentProducts = getProducts();
    const newProduct = {
        ...product,
        id: Date.now()
    };
    currentProducts.push(newProduct);
    saveProducts(currentProducts);
    return newProduct;
}

/**
 * Update product in localStorage (for admin)
 * @param {number} id - Product ID
 * @param {Object} updates - Updates to apply
 * @returns {Object|null} Updated product or null if not found
 */
function updateProduct(id, updates) {
    const currentProducts = getProducts();
    const index = currentProducts.findIndex(p => p.id === id);
    if (index !== -1) {
        currentProducts[index] = { ...currentProducts[index], ...updates };
        saveProducts(currentProducts);
        return currentProducts[index];
    }
    return null;
}

/**
 * Delete product from localStorage (for admin)
 * @param {number} id - Product ID to delete
 */
function deleteProduct(id) {
    const currentProducts = getProducts();
    const filteredProducts = currentProducts.filter(p => p.id !== id);
    saveProducts(filteredProducts);
}

/**
 * Search products by query
 * @param {string} query - Search query
 * @returns {Array} Filtered products
 */
function searchProducts(query) {
    const currentProducts = getProducts();
    if (!query) return currentProducts;
    
    return currentProducts.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
    );
}

/**
 * Filter products by category
 * @param {string} category - Category to filter by
 * @returns {Array} Filtered products
 */
function filterProductsByCategory(category) {
    const currentProducts = getProducts();
    if (category === 'all') return currentProducts;
    
    return currentProducts.filter(product => product.category === category);
}

/**
 * Handle wishlist click for products
 * @param {string} productId - Product ID to add/remove from wishlist
 */
async function handleWishlistClick(productId) {
    const customerId = getCookie('customer_id');
    if (!customerId) {
        showNotification('Please sign in to add items to wishlist', 'warning');
        return;
    }
    try {
        const heartIcon = event.target.closest('button').querySelector('svg');
        const isInWishlist = heartIcon.classList.contains('text-red-500');
        if (isInWishlist) {
            // Remove from wishlist
            const response = await fetch(`http://localhost:4000/customers/${customerId}/wishlist`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });
            if (response.ok) {
                showNotification('Removed from wishlist', 'success');
                await updateWishlistIcons();
            }
        } else {
            // Add to wishlist
            const response = await fetch(`http://localhost:4000/customers/${customerId}/wishlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });
            if (response.ok) {
                showNotification('Added to wishlist', 'success');
                await updateWishlistIcons();
            }
        }
    } catch (error) {
        console.error('Wishlist operation failed:', error);
        showNotification('Failed to update wishlist', 'error');
    }
}

/**
 * Update wishlist icons based on current wishlist state
 */
async function updateWishlistIcons() {
    const customerId = getCookie('customer_id');
    if (!customerId) return;

    try {
        const response = await fetch(`http://localhost:4000/customers/${customerId}/wishlist`);
        if (response.ok) {
            const data = await response.json();
            const wishlistProductIds = data.wishlist.map(product => product._id || product.id);

            // Update all heart icons on the page using data-product-id
            const wishlistButtons = document.querySelectorAll('.wishlist-btn');
            wishlistButtons.forEach(btn => {
                const productId = btn.getAttribute('data-product-id');
                const svg = btn.querySelector('svg');
                if (!svg) return;
                if (wishlistProductIds.includes(productId)) {
                    svg.classList.remove('text-gray-400');
                    svg.classList.add('text-red-500');
                } else {
                    svg.classList.remove('text-red-500');
                    svg.classList.add('text-gray-400');
                }
            });
        }
    } catch (error) {
        console.error('Failed to update wishlist icons:', error);
    }
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (info, success, warning, error)
 */
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // Set background color based on type
    const bgColors = {
        info: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500'
    };
    
    notification.classList.add(bgColors[type] || bgColors.info);
    notification.innerHTML = `
        <div class="flex items-center text-white">
            <span class="flex-1">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

/**
 * Get cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Delete cookie by name
 * @param {string} name - Cookie name to delete
 */
function deleteCookie(name) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
}

/**
 * Update user navigation based on authentication status
 */
function updateUserNavigation() {
    const userMenu = document.getElementById('user-menu');
    if (!userMenu) return;

    const customerId = getCookie('customer_id');
    const customerName = getCookie('customer_name');

    if (customerId && customerName) {
        // User is logged in
        userMenu.innerHTML = `
            <div class="hidden md:flex items-center space-x-4">
                <a href="/wishlist.html" class="bg-transparent text-white px-4 py-2 rounded-md font-medium hover:bg-white hover:text-black transition-colors flex items-center" title="Wishlist">
                    <i class="far fa-heart text-xl text-white fa-fw"></i>
                </a>
                <a href="/profile.html" class="bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 hover:text-white transition-colors flex items-center" title="Profile">
                    <i class="far fa-user text-xl text-white fa-fw"></i>
                </a>
            </div>
        `;
    } else {
        // User is not logged in - show sign in/sign up buttons
        userMenu.innerHTML = `
            <a href="/signin.html" class="hidden md:inline-block bg-white text-black px-6 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors">Sign In</a>
            <a href="/signup.html" class="hidden md:inline-block bg-transparent text-white px-6 py-2 rounded-md font-medium hover:bg-white hover:text-black transition-colors">Sign Up</a>
        `;
    }
}

/**
 * Log out the user, clear all session and cookie data, and redirect to homepage
 */
function logout() {
    deleteCookie('customer_id');
    deleteCookie('customer_name');
    deleteCookie('customer_email');
    deleteCookie('customer_phone');
    deleteCookie('fitpickd_customer_session');
    deleteCookie('fitpickd_customer_id');
    deleteCookie('fitpickd_customer_name');
    deleteCookie('fitpickd_customer_email');
    deleteCookie('fitpickd_customer_phone');
    deleteCookie('fitpickd_user_role');
    sessionStorage.removeItem('fitpickd_customer_session');
    sessionStorage.removeItem('fitpickd_customer_id');
    sessionStorage.removeItem('fitpickd_customer_name');
    sessionStorage.removeItem('fitpickd_customer_email');
    sessionStorage.removeItem('fitpickd_customer_phone');
    sessionStorage.removeItem('fitpickd_user_role');
    updateUserNavigation();
    showNotification('You have been logged out.', 'info');
    setTimeout(() => {
        window.location.replace('/index.html');
    }, 1200);
}

// Make functions globally available
window.openWhatsApp = openWhatsApp;
window.formatPrice = formatPrice;
window.handleWishlistClick = handleWishlistClick;
window.logout = logout;
window.showNotification = showNotification; 

// Expose openWhatsApp globally for use in product.js
window.FitPickd = window.FitPickd || {};
window.FitPickd.openWhatsApp = openWhatsApp; 