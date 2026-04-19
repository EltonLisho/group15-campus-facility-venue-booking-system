let pendingBookings = [];
let currentActionBooking = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication AND admin role
    if (!checkAuth() || !isAdmin()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    initAdminDashboard();
});

async function initAdminDashboard() {
    // Display user name
    const userNameSpan = document.getElementById('userNameDisplay');
    if (userNameSpan && currentUser) {
        userNameSpan.innerHTML = `<i class="fas fa-user-circle me-1"></i>${currentUser.full_name} (Admin)`;
    }
    
    await loadPendingBookings();
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // Confirm reject button
    const confirmRejectBtn = document.getElementById('confirmRejectBtn');
    if (confirmRejectBtn) {
        confirmRejectBtn.addEventListener('click', async () => {
            const reason = document.getElementById('rejectReason')?.value.trim();
            if (!reason) {
                showError('Please provide a reason for rejection.');
                return;
            }
            
            const success = await rejectBooking(currentActionBooking, reason);
            if (success) {
                const successMsg = document.getElementById('successMsg');
                if (successMsg) successMsg.innerText = 'Booking rejected successfully.';
                const modal = new bootstrap.Modal(document.getElementById('successModal'));
                modal.show();
                await loadPendingBookings();
                const rejectReasonInput = document.getElementById('rejectReason');
                if (rejectReasonInput) rejectReasonInput.value = '';
            } else {
                showError('Failed to reject booking.');
            }
            
            const rejectModal = bootstrap.Modal.getInstance(document.getElementById('rejectModal'));
            if (rejectModal) rejectModal.hide();
            currentActionBooking = null;
        });
    }
}

async function loadPendingBookings() {
    const container = document.getElementById('pendingList');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    
    pendingBookings = await getPendingBookings();
    displayPendingBookings();
}

function displayPendingBookings() {
    const container = document.getElementById('pendingList');
    if (!container) return;
    
    if (pendingBookings.length === 0) {
        container.innerHTML = `
            <div class="alert alert-success text-center">
                <i class="fas fa-check-circle fa-2x mb-2"></i>
                <h5>No pending approvals</h5>
                <p class="mb-0">All booking requests have been processed.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pendingBookings.map(booking => `
        <div class="card shadow-sm mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <h5 class="fw-bold">${escapeHtml(booking.facility_name)}</h5>
                        <p class="text-muted small">
                            <i class="fas fa-user me-1"></i> ${escapeHtml(booking.user_name)}<br>
                            <i class="fas fa-envelope me-1"></i> ${escapeHtml(booking.user_email)}
                        </p>
                    </div>
                    <div class="col-md-3">
                        <p class="mb-1"><i class="fas fa-calendar-day me-1"></i> ${formatDate(booking.booking_date)}</p>
                        <p class="mb-1"><i class="fas fa-clock me-1"></i> ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</p>
                        <p class="mb-0"><i class="fas fa-users me-1"></i> ${booking.attendee_count} attendees</p>
                    </div>
                    <div class="col-md-4">
                        <p class="mb-1"><strong>Purpose:</strong> ${escapeHtml(booking.purpose)}</p>
                        ${booking.notes ? `<p class="text-muted small mb-0"><strong>Notes:</strong> ${escapeHtml(booking.notes)}</p>` : ''}
                    </div>
                    <div class="col-md-2 text-end">
                        <button class="btn btn-success btn-sm w-100 mb-2" onclick="approveBookingRequest(${booking.id})">
                            <i class="fas fa-check me-1"></i>Approve
                        </button>
                        <button class="btn btn-danger btn-sm w-100" onclick="showRejectModal(${booking.id})">
                            <i class="fas fa-times me-1"></i>Reject
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Make functions available globally for onclick
window.approveBookingRequest = async function(bookingId) {
    const success = await approveBooking(bookingId);
    if (success) {
        const successMsg = document.getElementById('successMsg');
        if (successMsg) successMsg.innerText = 'Booking approved successfully.';
        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        modal.show();
        await loadPendingBookings();
    } else {
        showError('Failed to approve booking.');
    }
};

window.showRejectModal = function(bookingId) {
    currentActionBooking = bookingId;
    const modal = new bootstrap.Modal(document.getElementById('rejectModal'));
    modal.show();
};

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}