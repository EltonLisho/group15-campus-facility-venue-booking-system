document.addEventListener('DOMContentLoaded', () => {
    // 1. Check authentication FIRST
    if (!checkAuth()) {
        window.location.href = 'index.html';
        return;
    }
    
    // 2. Initialize dashboard
    initDashboard();
});

// Global variable to store facilities
let allFacilities = [];

async function initDashboard() {
    // Display user name
    const userNameSpan = document.getElementById('userNameDisplay');
    if (userNameSpan && currentUser) {
        userNameSpan.innerHTML = `<i class="fas fa-user-circle me-1"></i>${currentUser.full_name}`;
    }
    
    // Show admin menu if user is admin
    if (isAdmin()) {
        const adminMenu = document.getElementById('adminMenu');
        if (adminMenu) adminMenu.style.display = 'block';
    }
    
    // Load facilities
    await loadFacilities();
    
    // Setup event listeners
    setupEventListeners();
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

async function loadFacilities() {
    const grid = document.getElementById('facilitiesGrid');
    if (!grid) return;
    
    grid.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    
    allFacilities = await getFacilities();
    displayFacilities(allFacilities);
}

function displayFacilities(facilities) {
    const grid = document.getElementById('facilitiesGrid');
    if (!grid) return;
    
    if (facilities.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-building fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No facilities available</h5>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = facilities.map(facility => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card facility-card h-100 shadow-sm">
                <img src="${facility.image_url || 'https://via.placeholder.com/400x200?text=Facility'}" 
                     class="card-img-top" alt="${escapeHtml(facility.name)}" style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title fw-bold">${escapeHtml(facility.name)}</h5>
                    <div class="mb-2">
                        <span class="badge bg-primary">Capacity: ${facility.capacity}</span>
                    </div>
                    <p class="card-text text-muted small">
                        <i class="fas fa-location-dot me-1"></i> ${escapeHtml(facility.location)}<br>
                        <i class="fas fa-tools me-1"></i> ${escapeHtml(facility.equipment || 'No equipment listed')}
                    </p>
                </div>
                <div class="card-footer bg-white border-0 pb-3">
                    <button class="btn btn-primary w-100" onclick="viewFacility(${facility.id})">
                        <i class="fas fa-calendar-check me-1"></i>View Details & Book
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Make viewFacility available globally for onclick
window.viewFacility = function(facilityId) {
    window.location.href = `facility-details.html?id=${facilityId}`;
};

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterFacilities);
    }
    
    // Capacity filter
    const capacityFilter = document.getElementById('capacityFilter');
    if (capacityFilter) {
        capacityFilter.addEventListener('change', filterFacilities);
    }
    
    // Reset button
    const resetBtn = document.getElementById('resetFilterBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            const searchInput = document.getElementById('searchInput');
            const capacityFilter = document.getElementById('capacityFilter');
            if (searchInput) searchInput.value = '';
            if (capacityFilter) capacityFilter.value = '0';
            displayFacilities(allFacilities);
        });
    }
}

function filterFacilities() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const minCapacity = parseInt(document.getElementById('capacityFilter')?.value || '0');
    
    let filtered = allFacilities;
    
    if (searchTerm) {
        filtered = filtered.filter(f => f.name.toLowerCase().includes(searchTerm));
    }
    
    if (minCapacity > 0) {
        filtered = filtered.filter(f => f.capacity >= minCapacity);
    }
    
    displayFacilities(filtered);
}

// Helper function to prevent XSS attacks
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}