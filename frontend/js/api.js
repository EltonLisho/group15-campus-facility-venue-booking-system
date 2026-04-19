// API Service Layer - Handles all backend communication

const API_BASE_URL = 'http://localhost:3000/api';

// Get stored token
function getToken() {
    return localStorage.getItem('token');
}

// Helper function for API calls with authentication
async function apiRequest(endpoint, method = 'GET', data = null) {
    const token = getToken();
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();
        
        if (response.status === 401) {
            // Unauthorized - redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
            return null;
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: 'Network error. Please check if the server is running.' };
    }
}

// Get current user from localStorage
let currentUser = null;

function loadCurrentUser() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    }
    return currentUser;
}

function checkAuth() {
    const token = getToken();
    const user = localStorage.getItem('user');
    return token && user;
}

function isAdmin() {
    const user = loadCurrentUser();
    return user && user.role === 'admin';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    window.location.href = 'index.html';
}

// Authentication Functions
async function login(email, password) {
    const result = await apiRequest('/auth/login', 'POST', { email, password });
    if (result && result.success) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        currentUser = result.user;
        return true;
    }
    return false;
}

// Facility Functions
async function getFacilities() {
    const result = await apiRequest('/facilities', 'GET');
    return result && result.success ? result.data : [];
}

async function getFacilityById(id) {
    const result = await apiRequest(`/facilities/${id}`, 'GET');
    return result && result.success ? result.data : null;
}

async function getAvailability(facilityId, date) {
    const result = await apiRequest(`/facilities/${facilityId}/availability?date=${date}`, 'GET');
    return result && result.success ? result.data : [];
}

async function createFacility(facilityData) {
    const result = await apiRequest('/facilities', 'POST', facilityData);
    return result && result.success;
}

async function updateFacility(id, facilityData) {
    const result = await apiRequest(`/facilities/${id}`, 'PUT', facilityData);
    return result && result.success;
}

async function deleteFacility(id) {
    const result = await apiRequest(`/facilities/${id}`, 'DELETE');
    return result && result.success;
}

// Booking Functions
async function createBooking(bookingData) {
    const result = await apiRequest('/bookings', 'POST', bookingData);
    return result;
}

async function getMyBookings() {
    const result = await apiRequest('/bookings/my', 'GET');
    return result && result.success ? result.data : [];
}

async function cancelBooking(bookingId) {
    const result = await apiRequest(`/bookings/${bookingId}/cancel`, 'PUT');
    return result && result.success;
}

async function getPendingBookings() {
    const result = await apiRequest('/admin/bookings/pending', 'GET');
    return result && result.success ? result.data : [];
}

async function approveBooking(bookingId) {
    const result = await apiRequest(`/admin/bookings/${bookingId}/approve`, 'PUT');
    return result && result.success;
}

async function rejectBooking(bookingId, reason) {
    const result = await apiRequest(`/admin/bookings/${bookingId}/reject`, 'PUT', { reason });
    return result && result.success;
}

// Helper Functions
function showSuccess(message) {
    let successModal = document.getElementById('successModal');
    
    if (!successModal) {
        successModal = document.createElement('div');
        successModal.id = 'successModal';
        successModal.className = 'modal fade';
        successModal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body text-center p-4">
                        <i class="fas fa-check-circle text-success fa-4x mb-3"></i>
                        <h5 id="successMessage">${message}</h5>
                    </div>
                    <div class="modal-footer justify-content-center border-0">
                        <button type="button" class="btn btn-success" data-bs-dismiss="modal">OK</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(successModal);
    }
    
    const successMsg = document.getElementById('successMessage');
    if (successMsg) successMsg.innerText = message;
    
    const modal = new bootstrap.Modal(successModal);
    modal.show();
}

function showError(message) {
    let errorModal = document.getElementById('errorModal');
    
    if (!errorModal) {
        errorModal = document.createElement('div');
        errorModal.id = 'errorModal';
        errorModal.className = 'modal fade';
        errorModal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body text-center p-4">
                        <i class="fas fa-exclamation-circle text-danger fa-4x mb-3"></i>
                        <h5 id="errorMessage">${message}</h5>
                    </div>
                    <div class="modal-footer justify-content-center border-0">
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">OK</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(errorModal);
    }
    
    const errorMsg = document.getElementById('errorMessage');
    if (errorMsg) errorMsg.innerText = message;
    
    const modal = new bootstrap.Modal(errorModal);
    modal.show();
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(time) {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Load current user on page load
loadCurrentUser();