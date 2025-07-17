// Product detail page logic: load product details, handle image gallery, and share modal

let currentProduct = null;
let currentImageIndex = 0;
let productImages = [];
let selectedSize = null;

document.addEventListener('DOMContentLoaded', function() {
    loadProductDetails();
    // Removed duplicate updateUserNavigation function. Use main.js version.

    // Share modal logic
    const shareBtn = document.getElementById('share-btn');
    const shareModal = document.getElementById('share-modal');
    const closeShareModal = document.getElementById('close-share-modal');
    const shareWhatsapp = document.getElementById('share-whatsapp');
    const shareInstagram = document.getElementById('share-instagram');
    const shareGmail = document.getElementById('share-gmail');

    if (shareBtn && shareModal && closeShareModal) {
        shareBtn.addEventListener('click', () => {
            shareModal.classList.remove('hidden');
        });
        closeShareModal.addEventListener('click', () => {
            shareModal.classList.add('hidden');
        });
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                shareModal.classList.add('hidden');
            }
        });
    }

    function getShareText() {
        const productName = currentProduct ? currentProduct.name : 'this product';
        // Placeholder for link, update with real link in the future
        const link = window.location.href;
        return `Take a look at this style from FitPickd:\n${productName} – tap the link to view it: ${link}`;
    }

    if (shareWhatsapp) {
        shareWhatsapp.addEventListener('click', () => {
            const text = encodeURIComponent(getShareText());
            window.open(`https://wa.me/?text=${text}`, '_blank');
        });
    }
    if (shareInstagram) {
        shareInstagram.addEventListener('click', () => {
            // Instagram DM sharing is not directly supported, so copy text to clipboard and show a notification
            const text = getShareText();
            navigator.clipboard.writeText(text).then(() => {
                alert('Message copied! Open Instagram and paste it in a DM.');
            });
        });
    }
    if (shareGmail) {
        shareGmail.addEventListener('click', () => {
            const subject = encodeURIComponent('Check out this style from FitPickd');
            const body = encodeURIComponent(getShareText());
            window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        });
    }

    // Attach wishlist button event listener on initial load
    const wishlistBtn = document.getElementById('wishlist-btn');
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', handleProductWishlistClick);
    }
});

// Load product details from URL parameter
async function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        window.location.href = 'shop.html';
        return;
    }
    
    // Fetch product from backend
    let product = null;
    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        const res = await fetch(`${API_BASE}/products/available`);
        const products = await res.json();
        product = products.find(p => p._id === productId);
    } catch (err) {
        window.location.href = 'shop.html';
        return;
    }
    
    if (!product) {
        window.location.href = 'shop.html';
        return;
    }
    currentProduct = product;
    productImages = product.images && product.images.length > 0 ? product.images.map(img => img.url) : [];
    // Update page content
    updateProductDisplay();
    loadRelatedProducts();
}

// Update product display
function updateProductDisplay() {
    // Update page title
    document.title = `${currentProduct.name} - FitPickd`;
    
    // Update breadcrumb
    document.getElementById('product-category').textContent = currentProduct.name;
    document.getElementById('product-category-badge').textContent = currentProduct.category;
    
    // Update product information
    document.getElementById('product-title').textContent = currentProduct.name;
    document.getElementById('product-price').textContent = `₹ ${currentProduct.price.toFixed(2)}`;
    document.getElementById('product-description').textContent = currentProduct.description;
    document.getElementById('sku-value').textContent = `FP-${currentProduct._id ? currentProduct._id.slice(-3).padStart(3, '0') : '000'}`;
    
    // Render desktop image grid
    const imageGrid = document.getElementById('image-grid');
    imageGrid.innerHTML = productImages.map((url, idx) => `
        <div class="aspect-[4/5] bg-white rounded-lg overflow-hidden">
            <img src="${url}" alt="${currentProduct.name} - Image ${idx + 1}" class="w-full h-full object-cover">
        </div>
    `).join('');
    
    // Render mobile image slider
    const mobileImageContainer = document.getElementById('mobile-image-container');
    if (mobileImageContainer && productImages.length > 0) {
        mobileImageContainer.innerHTML = `
            <div class="flex transition-transform duration-300 ease-in-out" id="mobile-image-wrapper">
                ${productImages.map((url, idx) => `
                    <div class="w-full flex-shrink-0">
                        <img src="${url}" alt="${currentProduct.name} - Image ${idx + 1}" class="w-full h-80 object-cover mobile-product-img" data-img-idx="${idx}">
                    </div>
                `).join('')}
            </div>
        `;
        // Add image indicators
        const indicators = document.getElementById('image-indicators');
        indicators.innerHTML = productImages.map((_, idx) => `
            <button class="image-indicator w-2 h-2 rounded-full bg-white bg-opacity-50 transition-colors ${idx === 0 ? 'bg-opacity-100' : ''}" 
                    data-image-index="${idx}"></button>
        `).join('');
        // Initialize mobile slider functionality
        initializeMobileSlider();
        // Add event delegation for image indicators
        indicators.addEventListener('click', function(event) {
            const btn = event.target.closest('.image-indicator');
            if (btn) {
                const idx = parseInt(btn.getAttribute('data-image-index'));
                goToImage(idx);
            }
        });
        // --- Add mobile image popup logic ---
        if (window.innerWidth <= 767) {
            const mobileImages = mobileImageContainer.querySelectorAll('img.mobile-product-img');
            const popupModal = document.getElementById('mobile-image-popup-modal');
            const popupImg = document.getElementById('mobile-image-popup-img');
            const closeBtn = document.getElementById('close-mobile-image-popup');
            mobileImages.forEach(img => {
                img.addEventListener('click', function(e) {
                    // Only open popup if click is in center 60% of image
                    const rect = img.getBoundingClientRect();
                    const x = e.touches ? e.touches[0].clientX : e.clientX;
                    const relativeX = x - rect.left;
                    const width = rect.width;
                    if (relativeX > width * 0.2 && relativeX < width * 0.8) {
                        popupImg.src = this.src;
                        popupModal.classList.add('active');
                        e.stopPropagation(); // Prevent edge click handler from firing
                    }
                    // Otherwise, do nothing (edge click handled by slider)
                });
            });
            // Close modal on close button or overlay click
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    popupModal.classList.remove('active');
                    popupImg.src = '';
                });
            }
            if (popupModal) {
                popupModal.addEventListener('click', function(e) {
                    if (e.target === popupModal) {
                        popupModal.classList.remove('active');
                        popupImg.src = '';
                    }
                });
            }
        }
    }
    // Update size options
    updateSizeOptions();
    // Update specifications
    updateSpecifications();
    // Set up order button
    const orderBtn = document.getElementById('order-btn');
    if (orderBtn) {
        // Remove previous event listeners by replacing the node
        const newBtn = orderBtn.cloneNode(true);
        orderBtn.parentNode.replaceChild(newBtn, orderBtn);
        newBtn.addEventListener('click', function() {
            window.FitPickd.openWhatsApp(currentProduct.name, currentProduct.price, selectedSize);
        });
    }
    // Set up wishlist button
    updateWishlistButton();
}

// Initialize mobile slider functionality
function initializeMobileSlider() {
    const wrapper = document.getElementById('mobile-image-wrapper');
    const prevBtn = document.getElementById('prev-image');
    const nextBtn = document.getElementById('next-image');
    const indicators = document.querySelectorAll('#image-indicators button');
    
    let currentIndex = 0;
    const totalImages = productImages.length;
    
    function updateSlider() {
        wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Update indicators
        indicators.forEach((indicator, idx) => {
            indicator.classList.toggle('bg-opacity-100', idx === currentIndex);
            indicator.classList.toggle('bg-opacity-50', idx !== currentIndex);
        });
        
        // Show/hide navigation buttons
        prevBtn.style.display = currentIndex === 0 ? 'none' : 'block';
        nextBtn.style.display = currentIndex === totalImages - 1 ? 'none' : 'block';
    }
    
    // Navigation button handlers
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateSlider();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentIndex < totalImages - 1) {
            currentIndex++;
            updateSlider();
        }
    });
    
    // Touch/swipe functionality
    let startX = 0;
    let endX = 0;
    
    wrapper.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });
    
    wrapper.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && currentIndex < totalImages - 1) {
                // Swipe left - next image
                currentIndex++;
                updateSlider();
            } else if (diff < 0 && currentIndex > 0) {
                // Swipe right - previous image
                currentIndex--;
                updateSlider();
            }
        }
    }

    // --- Add edge click navigation for mobile ---
    if (window.innerWidth <= 767) {
        wrapper.addEventListener('click', function(e) {
            const rect = wrapper.getBoundingClientRect();
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            const relativeX = x - rect.left;
            const width = rect.width;
            if (relativeX < width * 0.2 && currentIndex > 0) {
                // Far left 20%
                currentIndex--;
                updateSlider();
            } else if (relativeX > width * 0.8 && currentIndex < totalImages - 1) {
                // Far right 20%
                currentIndex++;
                updateSlider();
            }
        });
    }
    // --- End edge click navigation ---
    
    // Initialize
    updateSlider();
}

// Global function for image indicators
function goToImage(index) {
    const wrapper = document.getElementById('mobile-image-wrapper');
    const indicators = document.querySelectorAll('#image-indicators button');
    
    if (wrapper && indicators.length > index) {
        wrapper.style.transform = `translateX(-${index * 100}%)`;
        
        // Update indicators
        indicators.forEach((indicator, idx) => {
            indicator.classList.toggle('bg-opacity-100', idx === index);
            indicator.classList.toggle('bg-opacity-50', idx !== index);
        });
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prev-image');
        const nextBtn = document.getElementById('next-image');
        prevBtn.style.display = index === 0 ? 'none' : 'block';
        nextBtn.style.display = index === productImages.length - 1 ? 'none' : 'block';
    }
}

// Update size options
function updateSizeOptions() {
    const container = document.getElementById('size-options');
    container.innerHTML = currentProduct.sizes.map(size => `
        <button class="size-option border-2 border-gray-300 py-2 px-4 rounded-md hover:border-black transition-colors" 
                data-size="${size}">
            ${size}
        </button>
    `).join('');
    // Add event delegation for size selection
    container.addEventListener('click', function(event) {
        const btn = event.target.closest('.size-option');
        if (btn) {
            selectSize(btn.getAttribute('data-size'), btn);
        }
    });
}

// Select size
function selectSize(size, btn) {
    // Remove previous selection
    document.querySelectorAll('.size-option').forEach(b => {
        b.classList.remove('border-black', 'bg-black', 'text-white');
        b.classList.add('border-gray-300');
    });
    // Add selection to clicked button
    if (btn) {
        btn.classList.remove('border-gray-300');
        btn.classList.add('border-black', 'bg-black', 'text-white');
    }
    selectedSize = size; // Update the selectedSize variable
}

// Update specifications
function updateSpecifications() {
    document.getElementById('product-material').textContent = currentProduct.fabricComposition || '—';
    document.getElementById('product-fit').textContent = currentProduct.fit || '—';
    document.getElementById('product-care').textContent = currentProduct.careInstruction || '—';
    document.getElementById('product-origin').textContent = currentProduct.countryOfOrigin || '—';
}

// Load related products
async function loadRelatedProducts() {
    // Fetch all products from backend
    let products = [];
    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        const res = await fetch(`${API_BASE}/products`);
        products = await res.json();
    } catch (err) {
        // fallback: show nothing
        document.getElementById('related-products').innerHTML = '<p class="text-gray-500 col-span-full text-center">No recommendations found.</p>';
        return;
    }
    // Filter for featured products, exclude current product and out-of-stock products
    const featuredProducts = products.filter(p => p.featured && p._id !== currentProduct._id && !p.outOfStock);
    // Pick any 6 (randomized)
    const shuffled = featuredProducts.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 6);
    const container = document.getElementById('related-products');
    if (selected.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-full text-center">No featured products found.</p>';
        return;
    }
    container.innerHTML = selected.map(product => `
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
    // Update heart icons to reflect wishlist status
    const customerId = sessionStorage.getItem('fitpickd_customer_id') || getCookie('fitpickd_customer_id');
    if (customerId) {
        try {
            const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
            const res = await fetch(`${API_BASE}/customers/${customerId}/wishlist`);
            if (res.ok) {
                const data = await res.json();
                const wishlistProductIds = data.wishlist.map(product => product._id || product.id);
                const wishlistButtons = container.querySelectorAll('.wishlist-btn');
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
        } catch (err) {}
    }
    // Add event delegation for related products
    container.addEventListener('click', function(event) {
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

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    // No longer applicable for image slider
});

// Wishlist functionality for product detail page (backend)
async function handleProductWishlistClick() {
    if (!currentProduct) return;
    const customerId = sessionStorage.getItem('fitpickd_customer_id') || getCookie('fitpickd_customer_id');
    if (!customerId) {
        showProductNotification('Please log-in to use this feature', 'info');
        return;
    }
    // Fetch current wishlist
    let wishlist = [];
    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        const res = await fetch(`${API_BASE}/customers/${customerId}/wishlist`);
        const data = await res.json();
        wishlist = (data && data.wishlist) ? data.wishlist.map(p => p._id) : [];
    } catch (err) {}
    const isWishlisted = wishlist.includes(currentProduct._id);
    if (!isWishlisted) {
        // Add to wishlist
        try {
            const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
            await fetch(`${API_BASE}/customers/${customerId}/wishlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: currentProduct._id })
            });
            showProductNotification('Added to wishlist!', 'success');
        } catch (err) {
            showProductNotification('Failed to add to wishlist', 'error');
        }
    } else {
        // Remove from wishlist
        try {
            const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
            await fetch(`${API_BASE}/customers/${customerId}/wishlist`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: currentProduct._id })
            });
            showProductNotification('Removed from wishlist!', 'success');
        } catch (err) {
            showProductNotification('Failed to remove from wishlist', 'error');
        }
    }
    updateWishlistButton();
}

// Custom notification function for product page
function showProductNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.custom-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `custom-notification fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 translate-y-[-100px] opacity-0`;
    
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
            bgColor = 'bg-gray-100';
            textColor = 'text-gray-800';
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

// Update wishlist button appearance (backend)
async function updateWishlistButton() {
    if (!currentProduct) return;
    const wishlistBtn = document.getElementById('wishlist-btn');
    const customerId = sessionStorage.getItem('fitpickd_customer_id') || getCookie('fitpickd_customer_id');
    if (!wishlistBtn) return;
    if (!customerId) return; // Prevent fetch if not signed in
    let wishlist = [];
    try {
        const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://fitpickd-backend.onrender.com';
        const res = await fetch(`${API_BASE}/customers/${customerId}/wishlist`);
        const data = await res.json();
        wishlist = (data && data.wishlist) ? data.wishlist.map(p => p._id) : [];
    } catch (err) {}
    const isInWishlist = wishlist.includes(currentProduct._id);
    if (isInWishlist) {
        wishlistBtn.innerHTML = '<i class="fas fa-heart mr-2 text-red-500"></i>Remove from Wishlist';
        wishlistBtn.classList.add('bg-red-50', 'border-red-500', 'text-red-500');
        wishlistBtn.classList.remove('border-black', 'text-black');
    } else {
        wishlistBtn.innerHTML = '<i class="fas fa-heart mr-2"></i>Add to Wishlist';
        wishlistBtn.classList.remove('bg-red-50', 'border-red-500', 'text-red-500');
        wishlistBtn.classList.add('border-black', 'text-black');
    }
    // Remove any previous event listeners by replacing the node
    const newBtn = wishlistBtn.cloneNode(true);
    wishlistBtn.parentNode.replaceChild(newBtn, wishlistBtn);
    newBtn.addEventListener('click', handleProductWishlistClick);
}

// Export functions for use in other files
window.ProductDetail = {
    selectSize,
    loadProductDetails,
    handleProductWishlistClick
}; 

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}
function deleteCookie(name) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
} 