// Wishlist page logic: manage wishlist items and handle add-to-cart placeholder

document.addEventListener('DOMContentLoaded', function() {
    checkUserAuthentication();
    loadWishlist();
    // Attach event listener for Clear All button (in case wishlist is already loaded)
    attachClearWishlistBtnListener();
});

function attachClearWishlistBtnListener() {
    const clearBtn = document.getElementById('clear-wishlist-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearWishlist);
    }
}

// Check if user is authenticated
function checkUserAuthentication() {
    const session = sessionStorage.getItem('fitpickd_customer_session');
    const cookie = getCookie('fitpickd_customer_session');
    if (session !== 'true' && cookie !== 'true') {
        // Show sign-in message for unsigned users
        showSignInMessage();
        return;
    }
    
    // Update navigation with user menu
    // Removed duplicate updateUserMenu function. Use main.js version.
}

// Show sign-in message for unsigned users
function showSignInMessage() {
    const wishlistContent = document.getElementById('wishlist-content');
    wishlistContent.innerHTML = `
        <div class="text-center py-12">
            <div class="max-w-md mx-auto">
                <i class="fas fa-heart text-6xl text-gray-300 mb-6"></i>
                <h3 class="text-xl font-semibold text-black mb-2">Sign In Required</h3>
                <p class="text-gray-600 mb-6">Please sign in to access your wishlist and save your favorite items.</p>
                <div class="space-y-3">
                    <a href="signin.html" class="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                        Sign In
                    </a>
                    <p class="text-sm text-gray-500">Don't have an account? <a href="signup.html" class="text-black hover:underline">Sign up here</a></p>
                </div>
            </div>
        </div>
    `;
}

// Removed duplicate updateUserMenu function. Use main.js version.

// Load wishlist items
async function loadWishlist() {
    const wishlistLoading = document.getElementById('wishlist-loading');
    const wishlistEmpty = document.getElementById('wishlist-empty');
    const wishlistItems = document.getElementById('wishlist-items');
    const wishlistGrid = document.getElementById('wishlist-grid');
    const wishlistCount = document.getElementById('wishlist-count');
    
    if (wishlistLoading) wishlistLoading.classList.remove('hidden');
    if (wishlistEmpty) wishlistEmpty.classList.add('hidden');
    if (wishlistItems) wishlistItems.classList.add('hidden');
    if (wishlistGrid) wishlistGrid.innerHTML = '';
    
    const customerId = sessionStorage.getItem('fitpickd_customer_id') || getCookie('fitpickd_customer_id');
    if (!customerId) {
        if (wishlistLoading) wishlistLoading.classList.add('hidden');
        if (wishlistEmpty) wishlistEmpty.classList.remove('hidden');
        return;
    }
    let wishlistProducts = [];
    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        const res = await fetch(`${API_BASE}/customers/${customerId}/wishlist`);
        const data = await res.json();
        wishlistProducts = data.wishlist || [];
        // Filter out out-of-stock products from wishlist
        wishlistProducts = wishlistProducts.filter(product => !product.outOfStock);
    } catch (err) {
        if (wishlistLoading) wishlistLoading.classList.add('hidden');
        if (wishlistEmpty) wishlistEmpty.classList.remove('hidden');
        return;
    }
    if (wishlistLoading) wishlistLoading.classList.add('hidden');
    if (!wishlistProducts.length) {
        if (wishlistEmpty) wishlistEmpty.classList.remove('hidden');
        return;
    }
    if (wishlistCount) wishlistCount.textContent = wishlistProducts.length;
    if (wishlistItems) wishlistItems.classList.remove('hidden');
    if (wishlistGrid) wishlistGrid.innerHTML = wishlistProducts.map(product => `
        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover-lift group cursor-pointer" data-product-id="${product._id}">
            <div class="relative aspect-[4/5] w-full">
                <img src="${product.images && product.images.length > 0 ? product.images[0].url : ''}" alt="${product.name}" 
                     class="w-full h-full object-cover lazy-image transition-transform duration-300 group-hover:scale-105" 
                     loading="lazy">
                <!-- Wishlist Heart Icon -->
                <button class="wishlist-btn absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition-colors" data-product-id="${product._id}">
                    <svg class="w-5 h-5 text-pink-500 transition-colors" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                </button>
            </div>
            <div class="p-4">
                <div class="mb-1" style="height: 0.5rem;"></div>
                <h3 class="text-base font-normal text-black mb-2 line-clamp-2">
                    ${product.name}
                </h3>
                <div class="flex justify-between items-center">
                    <span class="text-base font-normal text-black"> ₹ ${product.price && !isNaN(product.price) ? Number(product.price).toFixed(2) : ''}</span>
                </div>
            </div>
        </div>
    `).join('');
    // Add event delegation for wishlist product card and button clicks
    if (wishlistGrid) {
        wishlistGrid.addEventListener('click', function(event) {
            const card = event.target.closest('.product-card');
            const wishlistBtn = event.target.closest('.wishlist-btn');
            if (wishlistBtn) {
                event.stopPropagation();
                const productId = wishlistBtn.getAttribute('data-product-id');
                handleWishlistClick(productId).then(loadWishlist);
                return;
            }
            if (card && card.hasAttribute('data-product-id')) {
                const productId = card.getAttribute('data-product-id');
                window.location.href = 'product.html?id=' + productId;
            }
        });
    }
    // Attach event listener for Clear All button after rendering
    attachClearWishlistBtnListener();
}

// Create wishlist product card
function createWishlistProductCard(product, customerId) {
    const card = document.createElement('div');
    card.className = 'product-card bg-white rounded-lg shadow-md overflow-hidden hover-lift group cursor-pointer';
    const productImage = product.images && product.images.length > 0 ? (product.images[0].url || product.images[0]) : product.image;
    card.innerHTML = `
        <div class="relative aspect-[3/4] w-full">
            <img src="${product.images && product.images.length > 0 ? product.images[0].url : ''}" alt="${product.name}" 
                 class="w-full h-full object-cover lazy-image transition-transform duration-300 group-hover:scale-105" 
                 loading="lazy">
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
    `;
    return card;
}

// Remove item from wishlist (backend)
async function removeFromWishlist(productId, customerId) {
    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        await fetch(`${API_BASE}/customers/${customerId}/wishlist`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId })
        });
        loadWishlist();
        showNotification('Item removed from wishlist', 'success');
    } catch (err) {
        showNotification('Failed to remove from wishlist', 'error');
    }
}

// Clear all wishlist items (backend)
async function clearWishlist() {
    showClearWishlistModal();
}

// Show custom modal for clearing wishlist
function showClearWishlistModal() {
    // Remove existing modal if present
    const existingModal = document.getElementById('clear-wishlist-modal');
    if (existingModal) existingModal.remove();
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'clear-wishlist-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center animate-fade-in">
        <h3 class="text-xl font-semibold mb-4 text-black">Clear Wishlist?</h3>
        <p class="text-gray-600 mb-6">Are you sure you want to clear your entire wishlist? This action cannot be undone.</p>
        <div class="flex justify-center gap-4">
          <button id="cancel-clear-wishlist" class="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors">Cancel</button>
          <button id="confirm-clear-wishlist" class="px-5 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors">Clear All</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    // Focus for accessibility
    setTimeout(() => {
      document.getElementById('confirm-clear-wishlist').focus();
    }, 100);
    // Attach event listeners instead of inline handlers
    document.getElementById('cancel-clear-wishlist').addEventListener('click', () => {
      modal.remove();
    });
    document.getElementById('confirm-clear-wishlist').addEventListener('click', async () => {
      modal.remove();
      await actuallyClearWishlist();
    });
}

// Actually clear wishlist after confirmation
async function actuallyClearWishlist() {
    const customerId = sessionStorage.getItem('fitpickd_customer_id') || getCookie('fitpickd_customer_id');
    if (!customerId) return;
    // Fetch current wishlist
    let wishlistProducts = [];
    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        const res = await fetch(`${API_BASE}/customers/${customerId}/wishlist`);
        const data = await res.json();
        wishlistProducts = data.wishlist || [];
    } catch (err) {
        showNotification('Failed to clear wishlist', 'error');
        return;
    }
    // Remove each product
    for (const product of wishlistProducts) {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        await fetch(`${API_BASE}/customers/${customerId}/wishlist`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product._id })
        });
    }
    loadWishlist();
    showNotification('Wishlist cleared', 'success');
}

// Add to cart function (placeholder)
function addToCart(productId) {
    showNotification('Add to cart functionality coming soon!', 'info');
}

// Get category badge color
function getCategoryBadgeColor(category) {
    switch (category) {
        case 'Shirt':
            return 'bg-blue-100 text-blue-800';
        case 'Polo T-Shirt':
            return 'bg-green-100 text-green-800';
        case 'Trouser':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
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
    notification.className = `notification fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 translate-y-[-100px] opacity-0`;
    
    // Set notification content based on type
    let bgColor, textColor, icon;
    switch (type) {
        case 'success':
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
            icon = 'fas fa-check-circle';
            break;
        case 'error':
            bgColor = 'bg-red-100';
            textColor = 'text-red-800';
            icon = 'fas fa-exclamation-circle';
            break;
        default:
            bgColor = 'bg-blue-100';
            textColor = 'text-blue-800';
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

// Handle wishlist heart icon click: always remove from wishlist on wishlist page
async function handleWishlistClick(productId) {
    const customerId = sessionStorage.getItem('fitpickd_customer_id') || getCookie('fitpickd_customer_id');
    if (!customerId) return;
    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        const response = await fetch(`${API_BASE}/customers/${customerId}/wishlist`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId })
        });
        if (response.ok) {
            showNotification('Removed from wishlist', 'success');
        } else {
            showNotification('Failed to remove from wishlist', 'error');
        }
    } catch (err) {
        showNotification('Failed to remove from wishlist', 'error');
    }
}

 