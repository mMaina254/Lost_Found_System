HEAD
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
const API_BASE_URL = "https://lostfoundsystem-production-67bd.up.railway.app";

function saveToken(token) {
  localStorage.setItem("access_token", token);
}

function getToken() {
  return localStorage.getItem("access_token");
}

function clearToken() {
  localStorage.removeItem("access_token");
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

 
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
   
    const errorMessage = data?.detail || "Something went wrong";
    throw new Error(errorMessage);
  }

  return data;
}


async function registerUser({ full_name, email, password, role, student_id }) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ full_name, email, password, role, student_id }),
  });
}

async function loginUser({ email, password }) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  saveToken(data.access_token);
  return data;
}

async function getCurrentUser() {
  return apiRequest("/auth/me", {
    method: "GET",
  });
}

function logoutUser() {
  clearToken();
}

export {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  getToken,
};

