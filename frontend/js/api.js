const API_BASE_URL = "https://lostfoundsystem-production-67bd.up.railway.app";


// TOKEN STORAGE
// We store the JWT in localStorage so it survives page refreshes.


function saveToken(token) {
  localStorage.setItem("access_token", token);
}

function getToken() {
  return localStorage.getItem("access_token");
}

function clearToken() {
  localStorage.removeItem("access_token");
}



// Every API call goes through this function.
// It automatically attaches the JWT token if one exists.

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // If we have a token, attach it as a Bearer token.
 
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // FastAPI returns JSON even for errors 
  const data = await response.json().catch(() => null);

  if (!response.ok) {
   
    const errorMessage = data?.detail || "Something went wrong";
    throw new Error(errorMessage);
  }

  return data;
}


// AUTH ENDPOINTS
// These map directly to your FastAPI auth routes.


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

  // Save the token immediately after a successful login
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


// EXPORTS


export {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  getToken,
};
