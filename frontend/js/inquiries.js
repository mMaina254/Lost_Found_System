document.addEventListener('DOMContentLoaded', function() {
    
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get('id');
    
    if (itemId && document.getElementById('messagesSection')) {
        setupMessaging(itemId);
        loadMessages(itemId);
    }
});


async function loadMessages(itemId) {
    
    const user = window.API.getCurrentUser();
    if (!user) return;
    
    try {
    
        let inquiries = [];
        
        if (user.role === 'student') {
            const myInquiries = await window.API.apiGet('/inquiries/my');
            inquiries = myInquiries.filter(inq => inq.found_item_id === itemId);
        } else {
            const itemInquiries = await window.API.apiGet(`/found-items/${itemId}/inquiries`);
            inquiries = itemInquiries;
        }
        
        if (inquiries.length === 0) {
            document.getElementById('messagesSection').style.display = 'none';
            return;
        }
        
        const inquiry = inquiries[0]; 
        document.getElementById('messagesSection').style.display = 'block';
        document.getElementById('messagesSection').dataset.inquiryId = inquiry.id;
        
        
        await refreshMessages(inquiry.id);
        
    } catch (error) {
        console.error('Failed to load messages:', error);
    }
}

async function refreshMessages(inquiryId) {
    try {
        const messages = await window.API.apiGet(`/inquiries/${inquiryId}/messages`);
        const container = document.getElementById('messagesContainer');
        
        if (!container) return;
        
        if (messages.length === 0) {
            container.innerHTML = '<p class="text-muted">No messages yet. Start the conversation!</p>';
            return;
        }
        
        const user = window.API.getCurrentUser();
        container.innerHTML = messages.map(msg => `
            <div class="message ${msg.sender_user_id === user?.id ? 'message-own' : 'message-other'}">
                <div>${msg.message}</div>
                <div class="message-meta">
                    ${msg.sender?.full_name || 'User'} • ${new Date(msg.sent_at).toLocaleString()}
                </div>
            </div>
        `).join('');
        
        container.scrollTop = container.scrollHeight;
        
    } catch (error) {
        console.error('Failed to refresh messages:', error);
    }
}

function setupMessaging(itemId) {
    const form = document.getElementById('messageForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        const inquiryId = document.getElementById('messagesSection').dataset.inquiryId;
        
        if (!message || !inquiryId) return;
        
        try {
            await window.API.apiPost(`/inquiries/${inquiryId}/messages`, {
                message: message
            });
            
            input.value = '';
            await refreshMessages(inquiryId);
            
        } catch (error) {
            alert('Failed to send message: ' + error.message);
        }
    });
}

async function loadMyClaims() {
    const container = document.getElementById('myClaimsContainer');
    if (!container) return;
    
    try {
        const inquiries = await window.API.apiGet('/inquiries/my');
        
        if (inquiries.length === 0) {
            container.innerHTML = '<p class="text-muted">You haven\'t made any claims yet.</p>';
            return;
        }
        
        const items = await Promise.all(
            inquiries.map(async (inq) => {
                try {
                    const item = await window.API.apiGet(`/found-items/${inq.found_item_id}`);
                    return { ...inq, item };
                } catch {
                    return inq;
                }
            })
        );
        
        container.innerHTML = items.map(inq => `
            <div class="inquiry-card">
                <div class="inquiry-info">
                    <h4>${inq.item?.title || 'Unknown Item'}</h4>
                    <p>Status: <span class="item-status status-${inq.status}">${inq.status.toUpperCase()}</span></p>
                    <p>${inq.claim_description}</p>
                    <small>Submitted: ${new Date(inq.created_at).toLocaleDateString()}</small>
                </div>
                <div class="inquiry-actions">
                    <a href="/item-detail.html?id=${inq.found_item_id}" class="btn btn-outline" style="color:var(--primary);border-color:var(--primary);">View Item</a>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = `<div class="error-message">Failed to load claims: ${error.message}</div>`;
    }
}

async function loadInquiriesForReview() {
    const container = document.getElementById('inquiriesContainer');
    if (!container) return;
    
    try {
       
        const items = await window.API.apiGet('/found-items');
        const myItems = items.filter(item => item.posted_by_id === window.API.getCurrentUser()?.id);
        
        if (myItems.length === 0) {
            container.innerHTML = '<p class="text-muted">You haven\'t posted any items yet.</p>';
            return;
        }
        
        let allInquiries = [];
        for (const item of myItems) {
            try {
                const inquiries = await window.API.apiGet(`/found-items/${item.id}/inquiries`);
                inquiries.forEach(inq => {
                    inq.item = item;
                    allInquiries.push(inq);
                });
            } catch {}
        }
        
        const pendingInquiries = allInquiries.filter(inq => inq.status === 'pending');
        
        if (pendingInquiries.length === 0) {
            container.innerHTML = '<p class="text-muted">No pending inquiries to review.</p>';
            return;
        }
        
        container.innerHTML = pendingInquiries.map(inq => `
            <div class="inquiry-card">
                <div class="inquiry-info">
                    <h4>${inq.item.title}</h4>
                    <p><strong>Claimant:</strong> ${inq.claimant?.full_name || 'Unknown'}</p>
                    <p><strong>Description:</strong> ${inq.claim_description}</p>
                    <small>Submitted: ${new Date(inq.created_at).toLocaleDateString()}</small>
                </div>
                <div class="inquiry-actions">
                    <button class="btn btn-success" onclick="window.Dashboard.approveInquiry('${inq.id}')">Approve</button>
                    <button class="btn btn-danger" onclick="window.Dashboard.rejectInquiry('${inq.id}')">Reject</button>
                    <a href="/item-detail.html?id=${inq.found_item_id}" class="btn btn-outline" style="color:var(--primary);border-color:var(--primary);">View</a>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = `<div class="error-message">Failed to load inquiries: ${error.message}</div>`;
    }
}

window.Inquiries = {
    loadMessages,
    refreshMessages,
    loadMyClaims,
    loadInquiriesForReview,
};