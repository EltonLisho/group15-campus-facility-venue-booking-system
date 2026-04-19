let allBookings = [];
let currentFilter = 'all';
let bookingToCancel = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!checkAuth()) {
        window.location.href = 'index.html';
        return;
    }
    
    initMyBookings();
});

async function initMyBookings() {
    // Display user name
    const userNameSpan = document.getElementById('userNameDisplay');
    if (userNameSpan && currentUser) {
        userNameSpan.innerHTML = `<i class="fas fa-user-circle me-1"></i>${currentUser.full_name}`;
    }
    
    // Show admin menu if user is admin
    if (isAdmin()) {
        const adminMenu = document.getElementById('adminMenuNav');
        if (adminMenu) adminMenu.style.display = 'block';
    }
    
    await loadBookings();
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

async function loadBookings() {
    const container = document.getElementById('bookingsList');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    
    allBookings = await getMyBookings();
    displayBookings();
}

function displayBookings() {
    const container = document.getElementById('bookingsList');
    if (!container) return;
    
    let filteredBookings = allBookings;
    if (currentFilter !== 'all') {
        filteredBookings = allBookings.filter(b => b.status === currentFilter);
    }
    
    if (filteredBookings.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No bookings found</h5>
                <a href="dashboard.html" class="btn btn-primary mt-3">Browse Facilities</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredBookings.map(booking => `
        <div class="card booking-card ${booking.status} shadow-sm mb-3">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <h5 class="card-title fw-bold">${escapeHtml(booking.facility_name)}</h5>
                        <p class="card-text text-muted small">
                            <i class="fas fa-calendar-day me-1"></i> ${formatDate(booking.booking_date)}<br>
                            <i class="fas fa-clock me-1"></i> ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}<br>
                            <i class="fas fa-users me-1"></i> ${booking.attendee_count} attendees
                        </p>
                    </div>
                    <div class="col-md-4">
                        <p class="mb-1"><strong>Purpose:</strong> ${escapeHtml(booking.purpose)}</p>
                        ${booking.rejection_reason ? `<p class="text-danger small mb-0"><strong>Reason:</strong> ${escapeHtml(booking.rejection_reason)}</p>` : ''}
                    </div>
                    <div class="col-md-4 text-md-end">
                        <span class="badge badge-${booking.status} mb-2 d-inline-block">
                            ${booking.status.toUpperCase()}
                        </span>
                        ${(booking.status === 'pending' || booking.status === 'approved') ? `
                            <button class="btn btn-outline-danger btn-sm d-block mt-2" onclick="cancelBookingRequest(${booking.id})">
                                <i class="fas fa-times me-1"></i>Cancel
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function setupEventListeners() {
    document.querySelectorAll('#bookingTabs .nav-link').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#bookingTabs .nav-link').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.status;
            displayBookings();
        });
    });
}

function cancelBookingRequest(bookingId) {
    bookingToCancel = bookingId;
    const modal = new bootstrap.Modal(document.getElementById('cancelModal'));
    modal.show();
}

// Make cancelBookingRequest available globally for onclick
window.cancelBookingRequest = cancelBookingRequest;

// Confirm cancel button
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', async () => {
        if (bookingToCancel) {
            const success = await cancelBooking(bookingToCancel);
            if (success) {
                await loadBookings();
                showSuccess('Booking cancelled successfully.');
            } else {
                showError('Failed to cancel booking. Please try again.');
            }
            const modal = bootstrap.Modal.getInstance(document.getElementById('cancelModal'));
            if (modal) modal.hide();
            bookingToCancel = null;
        }
    });
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