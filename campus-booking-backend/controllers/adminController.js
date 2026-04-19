const pool = require('../config/db');

// @desc    Get all pending bookings
// @route   GET /api/admin/bookings/pending
const getPendingBookings = async (req, res) => {
    try {
        const [bookings] = await pool.execute(
            `SELECT b.id, b.booking_date, b.start_time, b.end_time, b.purpose, b.attendee_count, 
                    b.notes, b.created_at,
                    f.id as facility_id, f.name as facility_name, f.location, f.capacity,
                    u.id as user_id, u.email as user_email, u.full_name as user_name
             FROM bookings b
             JOIN facilities f ON b.facility_id = f.id
             JOIN users u ON b.user_id = u.id
             WHERE b.status = 'pending'
             ORDER BY b.booking_date ASC, b.start_time ASC`,
            []
        );
        
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Approve a booking
// @route   PUT /api/admin/bookings/:id/approve
const approveBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        
        const [result] = await pool.execute(
            'UPDATE bookings SET status = "approved" WHERE id = ? AND status = "pending"',
            [bookingId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found or already processed' });
        }
        
        res.json({ success: true, message: 'Booking approved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Reject a booking
// @route   PUT /api/admin/bookings/:id/reject
const rejectBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { reason } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE bookings SET status = "rejected", rejection_reason = ? WHERE id = ? AND status = "pending"',
            [reason, bookingId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found or already processed' });
        }
        
        res.json({ success: true, message: 'Booking rejected successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all bookings (admin)
// @route   GET /api/admin/bookings/all
const getAllBookings = async (req, res) => {
    try {
        const [bookings] = await pool.execute(
            `SELECT b.id, b.booking_date, b.start_time, b.end_time, b.purpose, b.attendee_count, 
                    b.status, b.rejection_reason, b.created_at,
                    f.name as facility_name,
                    u.email as user_email, u.full_name as user_name
             FROM bookings b
             JOIN facilities f ON b.facility_id = f.id
             JOIN users u ON b.user_id = u.id
             ORDER BY b.created_at DESC`,
            []
        );
        
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getPendingBookings,
    approveBooking,
    rejectBooking,
    getAllBookings
};