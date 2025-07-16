/**
 * FitPickd Shop Page JavaScript
 * Handles product display, filtering, and search functionality
 */

// Global variables
let currentProducts = [];
let filteredProducts = [];

// Initialize shop page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeShop();
    updateUserNavigation();
    updateWishlistIcons();
});

/**
 * Initialize the shop page: load products, set up filters, and handle search/category filtering
 */
async function initializeShop() {
    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        const res = await fetch(`${API_BASE}/products/available`);
        currentProducts = await res.json();
        filteredProducts = [...currentProducts];
    } catch (err) {
        currentProducts = [];
        filteredProducts = [];
        document.getElementById('products-grid').innerHTML = '<p class="text-red-500">Failed to load products.</p>';
        return;
    }
    initializeFilters();
    initializeSearch();
    displayProducts();
    // Apply category filter from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category) {
        filterByCategory(category);
    }
}

/**
 * Initialize filter buttons functionality
 */
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-black', 'text-white');
                btn.classList.add('bg-white', 'text-black', 'border-2', 'border-black');
            });
            
            // Add active class to clicked button
            this.classList.add('active', 'bg-black', 'text-white');
            this.classList.remove('bg-white', 'text-black', 'border-2', 'border-black');
            
            // Filter products
            const category = this.dataset.category;
            filterByCategory(category);
        });
    });
}

/**
 * Initialize search functionality with debouncing
 */
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = this.value.trim();
            searchProducts(query);
        }, 300);
    });
}

/**
 * Filter products by category
 * @param {string} category - Category to filter by
 */
function filterByCategory(category) {
    if (category === 'all') {
        filteredProducts = [...currentProducts];
    } else {
        filteredProducts = currentProducts.filter(product => product.category === category);
    }
    
    displayProducts();
    updateProductsCount(category);
}

/**
 * Search products by name and description
 * @param {string} query - Search query
 */
function searchProducts(query) {
    if (!query) {
        filteredProducts = [...currentProducts];
    } else {
        filteredProducts = currentProducts.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase())
        );
    }
    displayProducts();
    updateProductsCount();
}

/**
 * Display filtered products in the grid
 */
function displayProducts() {
    const productsGrid = document.getElementById('products-grid');
    const noProducts = document.getElementById('no-products');
    
    if (filteredProducts.length === 0) {
        productsGrid.classList.add('hidden');
        noProducts.classList.remove('hidden');
        return;
    }
    
    productsGrid.classList.remove('hidden');
    noProducts.classList.add('hidden');
    
    productsGrid.innerHTML = filteredProducts.map(product => `
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
    
    // Reinitialize lazy loading for new images
    if (typeof window.initializeLazyLoading === 'function') {
        window.initializeLazyLoading();
    }
    
    // Update wishlist icons after rendering
    updateWishlistIcons();

    // Add event delegation for product card and wishlist button clicks
    productsGrid.addEventListener('click', function(event) {
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
}

/**
 * Update products count display
 * @param {string} category - Current category filter
 */
function updateProductsCount(category) {
    const productsCount = document.getElementById('products-count');
    const totalProducts = currentProducts.length;
    const showingProducts = filteredProducts.length;
    
    if (!category || category === 'all') {
        productsCount.textContent = `Showing all items`;
    } else {
        productsCount.textContent = `Showing ${showingProducts} of ${totalProducts} products`;
    }
}

/**
 * Sort products by various criteria
 * @param {string} sortBy - Sort criteria (price-low, price-high, name)
 */
function sortProducts(sortBy) {
    const sortedProducts = [...filteredProducts];
    
    switch(sortBy) {
        case 'price-low':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            break;
    }
    
    filteredProducts = sortedProducts;
    displayProducts();
}

/**
 * Filter products by price range
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 */
function filterByPriceRange(minPrice, maxPrice) {
    filteredProducts = currentProducts.filter(product => 
        product.price >= minPrice && product.price <= maxPrice
    );
    
    displayProducts();
    updateProductsCount();
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
            const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
            const response = await fetch(`${API_BASE}/customers/${customerId}/wishlist`, {
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
            const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
            const response = await fetch(`${API_BASE}/customers/${customerId}/wishlist`, {
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
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        const response = await fetch(`${API_BASE}/customers/${customerId}/wishlist`);
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

// Expose shop management functions for debugging or future use
window.ShopManager = {
    filterByCategory,
    searchProducts,
    sortProducts,
    filterByPriceRange,
    displayProducts
}; 