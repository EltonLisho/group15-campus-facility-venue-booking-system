let bookingData = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!checkAuth()) {
        window.location.href = 'index.html';
        return;
    }
    
    initBookingForm();
});

async function initBookingForm() {
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
    
    // Get booking details from URL
    const urlParams = new URLSearchParams(window.location.search);
    const facilityId = urlParams.get('facility_id');
    const facilityName = urlParams.get('facility_name');
    const date = urlParams.get('date');
    const startTime = urlParams.get('start_time');
    const endTime = urlParams.get('end_time');
    
    if (!facilityId || !date || !startTime) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Display booking summary
    const facilityNameSpan = document.getElementById('facilityName');
    const bookingDateSpan = document.getElementById('bookingDate');
    const bookingTimeSpan = document.getElementById('bookingTime');
    
    if (facilityNameSpan) facilityNameSpan.innerText = decodeURIComponent(facilityName);
    if (bookingDateSpan) bookingDateSpan.innerText = formatDate(date);
    if (bookingTimeSpan) bookingTimeSpan.innerText = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    
    // Load facility to get max capacity
    const facility = await getFacilityById(facilityId);
    if (facility) {
        const maxCapacitySpan = document.getElementById('maxCapacity');
        const attendeeInput = document.getElementById('attendeeCount');
        if (maxCapacitySpan) maxCapacitySpan.innerText = facility.capacity;
        if (attendeeInput) attendeeInput.setAttribute('max', facility.capacity);
    }
    
    // Store booking data for submission
    bookingData = {
        facility_id: parseInt(facilityId),
        booking_date: date,
        start_time: startTime,
        end_time: endTime
    };
    
    // Setup form submission
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', submitBooking);
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

async function submitBooking(e) {
    e.preventDefault();
    
    const purpose = document.getElementById('purpose')?.value.trim();
    const attendeeCount = parseInt(document.getElementById('attendeeCount')?.value || '0');
    const notes = document.getElementById('notes')?.value.trim();
    
    if (!purpose) {
        showError('Please provide a purpose for the booking.');
        return;
    }
    
    if (!attendeeCount || attendeeCount < 1) {
        showError('Please enter a valid number of attendees.');
        return;
    }
    
    const maxCapacity = parseInt(document.getElementById('maxCapacity')?.innerText || '0');
    if (attendeeCount > maxCapacity) {
        showError(`Attendee count cannot exceed facility capacity of ${maxCapacity}.`);
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#bookingForm button[type="submit"]');
    const originalText = submitBtn?.innerHTML;
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';
        submitBtn.disabled = true;
    }
    
    const bookingRequest = {
        ...bookingData,
        purpose: purpose,
        attendee_count: attendeeCount,
        notes: notes || ''
    };
    
    const result = await createBooking(bookingRequest);
    
    // Reset button
    if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
    
    if (result && result.success) {
        // Show success modal
        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        successModal.show();
    } else {
        const errorMsg = result ? result.message : 'Booking failed. Please try again.';
        const errorMsgSpan = document.getElementById('errorMsg');
        if (errorMsgSpan) errorMsgSpan.innerText = errorMsg;
        const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
        errorModal.show();
    }
}