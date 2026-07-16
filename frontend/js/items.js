document.addEventListener('DOMContentLoaded', function() {
    const pathname = window.location.pathname;
    
    if (pathname.includes('index.html') || pathname === '/' || pathname.endsWith('/')) {
        loadItems();
        setupFilters();
    }
    
    if (pathname.includes('item-detail.html')) {
        loadItemDetail();
    }
});


async function loadItems(filters = {}) {
    const container = document.getElementById('itemsContainer');
    const spinner = document.getElementById('loadingSpinner');
    
    if (!container) return;
    
    try {
        
        if (spinner) spinner.style.display = 'block';
        container.innerHTML = '';
        
        
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.status) params.append('status', filters.status);
        
        const queryString = params.toString() ? `?${params.toString()}` : '';
        const data = await window.API.apiGet(`/found-items${queryString}`);
        
        
        if (spinner) spinner.style.display = 'none';
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px;">
                    <p>No items found. Check back later!</p>
                </div>
            `;
            return;
        }
        
        
        container.innerHTML = data.map(item => renderItemCard(item)).join('');
        
    } catch (error) {
        if (spinner) spinner.style.display = 'none';
        container.innerHTML = `
            <div class="error-message" style="grid-column:1/-1;text-align:center;padding:20px;">
                <p>Failed to load items: ${error.message}</p>
            </div>
        `;
    }
}


function renderItemCard(item) {
    const statusClass = `status-${item.status}`;
    const statusLabel = item.status.replace('_', ' ').toUpperCase();
    const imageUrl = item.images && item.images.length > 0 
        ? item.images.find(img => img.is_primary)?.url || item.images[0]?.url 
        : '/images/placeholder.png';
    
    return `
        <div class="item-card" onclick="window.location.href='/item-detail.html?id=${item.id}'">
            <img src="${imageUrl}" alt="${item.title}" class="item-card-image" />
            <div class="item-card-content">
                <h3>${item.title}</h3>
                <div class="item-meta">
                    <span class="item-status ${statusClass}">${statusLabel}</span>
                    <span>• ${item.category}</span>
                    <span>• ${item.location_found}</span>
                </div>
                <p class="item-description">${item.description}</p>
            </div>
        </div>
    `;
}


async function loadItemDetail() {
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id');
    
    if (!itemId) {
        window.location.href = '/index.html';
        return;
    }
    
    const spinner = document.getElementById('loadingSpinner');
    const content = document.getElementById('itemContent');
    
    try {
        const item = await window.API.apiGet(`/found-items/${itemId}`);
        
        if (spinner) spinner.style.display = 'none';
        if (content) content.style.display = 'block';
        
        renderItemDetail(item);
        
    
        const user = window.API.getCurrentUser();
        const isLoggedIn = window.API.isAuthenticated();
        const canClaim = isLoggedIn && user && user.role === 'student' && item.status === 'unclaimed';
        
        const inquirySection = document.getElementById('inquirySection');
        if (inquirySection) {
            if (canClaim) {
                inquirySection.style.display = 'block';
                setupClaimForm(item.id);
            } else {
                inquirySection.style.display = 'none';
            }
        }
        
    } catch (error) {
        if (spinner) spinner.style.display = 'none';
        if (content) {
            content.style.display = 'block';
            content.innerHTML = `
                <div class="error-message">
                    <p>Failed to load item details: ${error.message}</p>
                    <a href="/index.html" class="btn btn-primary" style="margin-top:12px;">Back to Browse</a>
                </div>
            `;
        }
    }
}

function renderItemDetail(item) {
    
    document.getElementById('itemTitle').textContent = item.title;
    
    
    const statusEl = document.getElementById('itemStatus');
    statusEl.textContent = item.status.replace('_', ' ').toUpperCase();
    statusEl.className = `item-status status-${item.status}`;
    
    
    document.getElementById('itemCategory').textContent = item.category;
    document.getElementById('itemLocation').textContent = item.location_found;
    document.getElementById('itemDate').textContent = new Date(item.date_found).toLocaleDateString();
    document.getElementById('itemPostedBy').textContent = item.posted_by?.full_name || 'Unknown';
    document.getElementById('itemDescription').textContent = item.description;
    
    const imagesContainer = document.getElementById('itemImages');
    if (imagesContainer) {
        if (item.images && item.images.length > 0) {
            const primary = item.images.find(img => img.is_primary) || item.images[0];
            const thumbnails = item.images.filter(img => img.id !== primary.id);
            
            imagesContainer.innerHTML = `
                <img src="${primary.url}" alt="${item.title}" class="main-image" />
                <div class="image-thumbnails">
                    ${thumbnails.map(img => `
                        <img src="${img.url}" alt="${item.title}" onclick="this.parentElement.parentElement.querySelector('.main-image').src='${img.url}'" />
                    `).join('')}
                </div>
            `;
        } else {
            imagesContainer.innerHTML = `
                <img src="/images/placeholder.png" alt="No image available" class="main-image" />
            `;
        }
    }
}

function setupFilters() {
    const applyBtn = document.getElementById('applyFilters');
    if (!applyBtn) return;
    
    applyBtn.addEventListener('click', function() {
        const category = document.getElementById('categoryFilter').value;
        const status = document.getElementById('statusFilter').value;
        
        loadItems({ category, status });
    });
}

function setupClaimForm(itemId) {
    const form = document.getElementById('claimForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const description = document.getElementById('claimDescription').value.trim();
        const messageEl = document.getElementById('claimMessage');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (!description) {
            showMessage(messageEl, 'Please describe why this is your item.', 'error');
            return;
        }
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            
            await window.API.apiPost(`/found-items/${itemId}/inquiries`, {
                claim_description: description
            });
            
            showMessage(messageEl, 'Claim submitted successfully! Security staff will review your claim.', 'success');
            form.reset();
            submitBtn.textContent = 'Claim Submitted ✓';
            submitBtn.disabled = true;
            
        } catch (error) {
            showMessage(messageEl, error.message || 'Failed to submit claim. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Claim';
        }
    });
}

function showMessage(element, message, type) {
    if (!element) return;
    element.style.display = 'block';
    element.textContent = message;
    element.className = type === 'error' ? 'error-message' : 'success-message';
}