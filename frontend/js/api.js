const API_BASE_URL = 'http://localhost:8000';

function getToken() {
    return localStorage.getItem('access_token');
}

function setToken(token) {
    localStorage.setItem('access_token', token);
}

function removeToken() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
}

function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

function isAuthenticated() {
    return !!getToken();
}

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }
    
    const config = {
        ...options,
        headers,
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            
            if (response.status === 401) {
            
                removeToken();
                if (!window.location.pathname.includes('login')) {
                    window.location.href = '/login.html';
                }
            }
            throw new Error(data.detail || data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function apiGet(endpoint) {
    return apiRequest(endpoint, { method: 'GET' });
}

function apiPost(endpoint, data) {
    const isFormData = data instanceof FormData;
    return apiRequest(endpoint, {
        method: 'POST',
        body: isFormData ? data : JSON.stringify(data),
        ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json' } }),
    });
}

function apiPatch(endpoint, data) {
    return apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    });
}

function apiDelete(endpoint) {
    return apiRequest(endpoint, { method: 'DELETE' });
}

window.API = {
    getToken,
    setToken,
    removeToken,
    getCurrentUser,
    setCurrentUser,
    isAuthenticated,
    apiRequest,
    apiGet,
    apiPost,
    apiPatch,
    apiDelete,
    BASE_URL: API_BASE_URL,
};