document.addEventListener('DOMContentLoaded', function() {
   
    updateNav();
    
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

function updateNav() {
    const isLoggedIn = window.API.isAuthenticated();
    const user = window.API.getCurrentUser();
    
    const authLinks = document.getElementById('authLinks');
    const userLinks = document.getElementById('userLinks');
    const userGreeting = document.getElementById('userGreeting');
    const dashboardLink = document.getElementById('dashboardLink');
    
    if (isLoggedIn && user) {
       
        if (authLinks) authLinks.style.display = 'none';
        if (userLinks) userLinks.style.display = 'flex';
        if (userGreeting) userGreeting.textContent = `👋 ${user.full_name || user.email}`;
        
        if (dashboardLink) {
            if (user.role === 'security' || user.role === 'admin') {
                dashboardLink.style.display = 'block';
            } else {
                dashboardLink.style.display = 'none';
            }
        }
    } else {
       
        if (authLinks) authLinks.style.display = 'flex';
        if (userLinks) userLinks.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    

    if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
    }
    
    if (!email || !password) {
        showError(errorEl, 'Please fill in all fields');
        return;
    }
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        const data = await window.API.apiPost('/auth/login', { email, password });
        
        
        window.API.setToken(data.access_token);
        window.API.setCurrentUser(data.user);
        
        
        window.location.href = '/index.html';
    } catch (error) {
        showError(errorEl, error.message || 'Login failed. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const studentId = document.getElementById('studentId').value.trim();
    const role = document.getElementById('role').value;
    const errorEl = document.getElementById('registerError');
    const successEl = document.getElementById('registerSuccess');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    

    if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
    if (successEl) { successEl.style.display = 'none'; successEl.textContent = ''; }
    

    if (!fullName || !email || !password || !role) {
        showError(errorEl, 'Please fill in all required fields');
        return;
    }
    
    if (password.length < 6) {
        showError(errorEl, 'Password must be at least 6 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        showError(errorEl, 'Passwords do not match');
        return;
    }
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
        
        const data = await window.API.apiPost('/auth/register', {
            full_name: fullName,
            email,
            password,
            student_id: studentId || null,
            role,
        });
        
        if (successEl) {
            successEl.style.display = 'block';
            successEl.textContent = 'Registration successful! Redirecting to login...';
        }
        
        
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
    } catch (error) {
        showError(errorEl, error.message || 'Registration failed. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
    }
}

function handleLogout(event) {
    event.preventDefault();
    window.API.removeToken();
    window.location.href = '/index.html';
}

function showError(element, message) {
    if (!element) return;
    element.style.display = 'block';
    element.textContent = message;
}

window.Auth = {
    updateNav,
    handleLogin,
    handleRegister,
    handleLogout,
};