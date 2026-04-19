let allFacilities = [];
let facilityToDelete = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication AND admin role
    if (!checkAuth() || !isAdmin()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    initAdminFacilities();
});

async function initAdminFacilities() {
    // Display user name
    const userNameSpan = document.getElementById('userNameDisplay');
    if (userNameSpan && currentUser) {
        userNameSpan.innerHTML = `<i class="fas fa-user-circle me-1"></i>${currentUser.full_name} (Admin)`;
    }
    
    await loadFacilities();
    
    // Save facility button
    const saveFacilityBtn = document.getElementById('saveFacilityBtn');
    if (saveFacilityBtn) {
        saveFacilityBtn.addEventListener('click', saveFacility);
    }
    
    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteFacilityConfirm);
    }
    
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
    const container = document.getElementById('facilitiesTable');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    
    allFacilities = await getFacilities();
    displayFacilitiesTable();
}

function displayFacilitiesTable() {
    const container = document.getElementById('facilitiesTable');
    if (!container) return;
    
    if (allFacilities.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-info-circle fa-2x mb-2"></i>
                <h5>No facilities found</h5>
                <button class="btn btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#facilityModal" onclick="resetForm()">
                    <i class="fas fa-plus me-1"></i>Add Your First Facility
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover admin-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Capacity</th>
                        <th>Location</th>
                        <th>Equipment</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${allFacilities.map(facility => `
                        <tr>
                            <td>
                                <img src="${facility.image_url || 'https://via.placeholder.com/50x50?text=Facility'}" 
                                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                            </td>
                            <td class="fw-bold">${escapeHtml(facility.name)}</td>
                            <td>${facility.capacity}</td>
                            <td>${escapeHtml(facility.location)}</td>
                            <td class="small">${escapeHtml(facility.equipment ? facility.equipment.substring(0, 50) : '-')}${facility.equipment && facility.equipment.length > 50 ? '...' : ''}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary me-1" onclick="editFacility(${facility.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteFacilityRequest(${facility.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Make functions available globally for onclick
window.resetForm = function() {
    const modalTitle = document.getElementById('modalTitle');
    const facilityId = document.getElementById('facilityId');
    const facilityName = document.getElementById('facilityName');
    const capacity = document.getElementById('capacity');
    const location = document.getElementById('location');
    const equipment = document.getElementById('equipment');
    const imageUrl = document.getElementById('imageUrl');
    
    if (modalTitle) modalTitle.innerText = 'Add Facility';
    if (facilityId) facilityId.value = '';
    if (facilityName) facilityName.value = '';
    if (capacity) capacity.value = '';
    if (location) location.value = '';
    if (equipment) equipment.value = '';
    if (imageUrl) imageUrl.value = '';
};

window.editFacility = function(facilityId) {
    const facility = allFacilities.find(f => f.id === facilityId);
    if (!facility) return;
    
    const modalTitle = document.getElementById('modalTitle');
    const facilityIdInput = document.getElementById('facilityId');
    const facilityNameInput = document.getElementById('facilityName');
    const capacityInput = document.getElementById('capacity');
    const locationInput = document.getElementById('location');
    const equipmentInput = document.getElementById('equipment');
    const imageUrlInput = document.getElementById('imageUrl');
    
    if (modalTitle) modalTitle.innerText = 'Edit Facility';
    if (facilityIdInput) facilityIdInput.value = facility.id;
    if (facilityNameInput) facilityNameInput.value = facility.name;
    if (capacityInput) capacityInput.value = facility.capacity;
    if (locationInput) locationInput.value = facility.location;
    if (equipmentInput) equipmentInput.value = facility.equipment || '';
    if (imageUrlInput) imageUrlInput.value = facility.image_url || '';
    
    const modal = new bootstrap.Modal(document.getElementById('facilityModal'));
    modal.show();
};

window.deleteFacilityRequest = function(facilityId) {
    facilityToDelete = facilityId;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
};

async function saveFacility() {
    const facilityData = {
        name: document.getElementById('facilityName')?.value.trim(),
        capacity: parseInt(document.getElementById('capacity')?.value || '0'),
        location: document.getElementById('location')?.value.trim(),
        equipment: document.getElementById('equipment')?.value.trim(),
        image_url: document.getElementById('imageUrl')?.value.trim()
    };
    
    if (!facilityData.name || !facilityData.capacity || !facilityData.location) {
        showError('Please fill in all required fields.');
        return;
    }
    
    let success;
    const facilityId = document.getElementById('facilityId')?.value;
    
    if (facilityId) {
        success = await updateFacility(facilityId, facilityData);
    } else {
        success = await createFacility(facilityData);
    }
    
    if (success) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('facilityModal'));
        if (modal) modal.hide();
        await loadFacilities();
        showSuccess(facilityId ? 'Facility updated successfully.' : 'Facility added successfully.');
        window.resetForm();
    } else {
        showError('Failed to save facility. Please try again.');
    }
}

async function deleteFacilityConfirm() {
    if (facilityToDelete) {
        const success = await deleteFacility(facilityToDelete);
        if (success) {
            await loadFacilities();
            showSuccess('Facility deleted successfully.');
        } else {
            showError('Failed to delete facility. It may have future bookings.');
        }
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        if (modal) modal.hide();
        facilityToDelete = null;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}