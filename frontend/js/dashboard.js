/**
 * Dashboard Module - Security staff dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and role
    const user = window.API.getCurrentUser();
    const isLoggedIn = window.API.isAuthenticated();
    
    if (!isLoggedIn) {
        window.location.href = '/login.html';
        return;
    }
    
    // Show appropriate dashboard
    const securityDashboard = document.getElementById('securityDashboard');
    const studentDashboard = document.getElementById('studentDashboard');
    const roleInfo = document.getElementById('dashboardRoleInfo');
    
    if (user.role === 'security' || user.role === 'admin') {
        if (securityDashboard) securityDashboard.style.display = 'block';
        if (studentDashboard) studentDashboard.style.display = 'none';
        if (roleInfo) roleInfo.textContent = `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard`;
        
        // Setup post item form
        setupPostItemForm();
        
        // Load inquiries for review
        window.Inquiries.loadInquiriesForReview();
        
        // Load my posted items
        loadMyItems();
        
    } else if (user.role === 'student') {
        if (securityDashboard) securityDashboard.style.display = 'none';
        if (studentDashboard) studentDashboard.style.display = 'block';
        if (roleInfo) roleInfo.textContent = 'Student Dashboard';
        
        // Load student's claims
        window.Inquiries.loadMyClaims();
    } else {
        // Unknown role, redirect
        window.location.href = '/index.html';
    }
});

// Setup post item form
function setupPostItemForm() {
    const form = document.getElementById('postItemForm');
    if (!form) return;
    
    // Set default date to today
    const dateInput = document.getElementById('itemDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const title = document.getElementById('itemTitle').value.trim();
        const category = document.getElementById('itemCategory').value;
        const location = document.getElementById('itemLocation').value.trim();
        const date = document.getElementById('itemDate').value;
        const description = document.getElementById('itemDescription').value.trim();
        const files = document.getElementById('itemImages').files;
        
        const errorEl = document.getElementById('postItemError');
        const successEl = document.getElementById('postItemSuccess');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Clear messages
        if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
        if (successEl) { successEl.style.display = 'none'; successEl.textContent = ''; }
        
        // Validate
        if (!title || !category || !location || !date || !description) {
            showMessage(errorEl, 'Please fill in all required fields.', 'error');
            return;
        }
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Posting...';
            
            // First, create the item
            const itemData = await window.API.apiPost('/found-items', {
                title,
                category,
                location_found: location,
                date_found: date,
                description,
                status: 'unclaimed'
            });
            
            // Then upload images if any
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const formData = new FormData();
                    formData.append('file', files[i]);
                    
                    await window.API.apiPost(`/found-items/${itemData.id}/images`, formData);
                }
            }
            
            showMessage(successEl, 'Item posted successfully!', 'success');
            form.reset();
            
            // Reset date
            if (dateInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.value = today;
            }
            
            // Reload items list
            loadMyItems();
            window.Inquiries.loadInquiriesForReview();
            
        } catch (error) {
            showMessage(errorEl, error.message || 'Failed to post item. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post Item';
        }
    });
}

// Load my posted items
async function loadMyItems() {
    const container = document.getElementById('myItemsContainer');
    if (!container) return;
    
    try {
        const items = await window.API.apiGet('/found-items');
        const user = window.API.getCurrentUser();
        const myItems = items.filter(item => item.posted_by_id === user?.id);
        
        if (myItems.length === 0) {
            container.innerHTML = '<p class="text-muted">You haven\'t posted any items yet.</p>';
            return;
        }
        
        container.innerHTML = myItems.map(item => `
            <div class="inquiry-card">
                <div class="inquiry-info">
                    <h4>${item.title}</h4>
                    <p>
                        <span class="item-status status-${item.status}">${item.status.replace('_', ' ').toUpperCase()}</span>
                        <span> • ${item.category}</span>
                        <span> • ${item.location_found}</span>
                    </p>
                    <p>${item.description}</p>
                    <small>Posted: ${new Date(item.created_at).toLocaleDateString()}</small>
                </div>
                <div class="inquiry-actions">
                    <a href="/item-detail.html?id=${item.id}" class="btn btn-outline" style="color:var(--primary);border-color:var(--primary);">View</a>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = `<div class="error-message">Failed to load items: ${error.message}</div>`;
    }
}

// Approve inquiry
async function approveInquiry(inquiryId) {
    if (!confirm('Approve this claim?')) return;
    
    try {
        await window.API.apiPatch(`/inquiries/${inquiryId}/status`, { status: 'approved' });
        alert('Claim approved successfully!');
        
        // Refresh data
        window.Inquiries.loadInquiriesForReview();
        loadMyItems();
    } catch (error) {
        alert('Failed to approve claim: ' + error.message);
    }
}

// Reject inquiry
async function rejectInquiry(inquiryId) {
    if (!confirm('Reject this claim?')) return;
    
    try {
        await window.API.apiPatch(`/inquiries/${inquiryId}/status`, { status: 'rejected' });
        alert('Claim rejected.');
        
        // Refresh data
        window.Inquiries.loadInquiriesForReview();
        loadMyItems();
    } catch (error) {
        alert('Failed to reject claim: ' + error.message);
    }
}

// Helper: Show message
function showMessage(element, message, type) {
    if (!element) return;
    element.style.display = 'block';
    element.textContent = message;
    element.className = type === 'error' ? 'error-message' : 'success-message';
}

// Expose functions globally
window.Dashboard = {
    approveInquiry,
    rejectInquiry,
    loadMyItems,
};