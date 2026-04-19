let currentFacility = null;
let selectedDate = null;
let selectedTimeSlot = null;
let calendar = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!checkAuth()) {
        window.location.href = 'index.html';
        return;
    }
    
    initFacilityDetails();
});

async function initFacilityDetails() {
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
    
    // Get facility ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const facilityId = urlParams.get('id');
    
    if (!facilityId) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    await loadFacilityDetails(facilityId);
    initCalendar();
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

async function loadFacilityDetails(facilityId) {
    const container = document.getElementById('facilityDetails');
    if (!container) return;
    
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    
    currentFacility = await getFacilityById(facilityId);
    
    if (!currentFacility) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">Facility not found.</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="col-md-5">
            <img src="${currentFacility.image_url || 'https://via.placeholder.com/500x400?text=Facility'}" 
                 class="img-fluid rounded shadow-sm" alt="${escapeHtml(currentFacility.name)}">
        </div>
        <div class="col-md-7">
            <h2>${escapeHtml(currentFacility.name)}</h2>
            <div class="mb-3">
                <span class="badge bg-primary fs-6">Capacity: ${currentFacility.capacity} people</span>
            </div>
            <p><i class="fas fa-location-dot text-primary me-2"></i> <strong>Location:</strong> ${escapeHtml(currentFacility.location)}</p>
            <p><i class="fas fa-tools text-primary me-2"></i> <strong>Equipment:</strong> ${escapeHtml(currentFacility.equipment || 'None specified')}</p>
            <hr>
            <p class="text-muted">Select a date on the calendar to see available time slots.</p>
        </div>
    `;
}

function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
        },
        dateClick: function(info) {
            selectedDate = info.dateStr;
            const selectedDateSpan = document.getElementById('selectedDate');
            if (selectedDateSpan) {
                selectedDateSpan.innerText = formatDate(selectedDate);
            }
            const timeSlotsSection = document.getElementById('timeSlotsSection');
            if (timeSlotsSection) {
                timeSlotsSection.style.display = 'block';
            }
            loadTimeSlots(selectedDate);
        },
        validRange: {
            start: new Date().toISOString().split('T')[0]
        }
    });
    calendar.render();
}

async function loadTimeSlots(date) {
    const grid = document.getElementById('timeSlotsGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary"></div></div>';
    
    const slots = await getAvailability(currentFacility.id, date);
    
    if (slots.length === 0) {
        grid.innerHTML = '<div class="col-12"><div class="alert alert-warning">No available time slots for this date.</div></div>';
        return;
    }
    
    grid.innerHTML = slots.map(slot => `
        <div class="col-md-3 col-sm-4 col-6">
            <button class="time-slot-btn" data-start="${slot.start_time}" data-end="${slot.end_time}">
                ${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}
            </button>
        </div>
    `).join('');
    
    // Add click handlers to time slot buttons
    document.querySelectorAll('.time-slot-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedTimeSlot = {
                start: btn.dataset.start,
                end: btn.dataset.end
            };
            
            // Auto-navigate to booking form after selection
            setTimeout(() => {
                proceedToBooking();
            }, 300);
        });
    });
}

function proceedToBooking() {
    if (selectedDate && selectedTimeSlot && currentFacility) {
        window.location.href = `booking-form.html?facility_id=${currentFacility.id}&facility_name=${encodeURIComponent(currentFacility.name)}&date=${selectedDate}&start_time=${selectedTimeSlot.start}&end_time=${selectedTimeSlot.end}`;
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