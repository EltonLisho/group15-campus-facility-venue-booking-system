const pool = require('../config/db');

// @desc    Create a booking
// @route   POST /api/bookings
const createBooking = async (req, res) => {
    try {
        const { facility_id, booking_date, start_time, end_time, purpose, attendee_count, notes } = req.body;
        const user_id = req.user.id;
        
        // Validate date is not in the past
        const today = new Date().toISOString().split('T')[0];
        if (booking_date < today) {
            return res.status(400).json({ success: false, message: 'Cannot book past dates' });
        }
        
        // Check for double booking
        const [conflicts] = await pool.execute(
            `SELECT id FROM bookings 
             WHERE facility_id = ? 
             AND booking_date = ? 
             AND status IN ('approved', 'pending')
             AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
            [facility_id, booking_date, end_time, start_time, end_time, start_time]
        );
        
        if (conflicts.length > 0) {
            return res.status(400).json({ success: false, message: 'Time slot is already booked' });
        }
        
        // Get facility capacity
        const [facilities] = await pool.execute(
            'SELECT capacity FROM facilities WHERE id = ?',
            [facility_id]
        );
        
        if (facilities.length === 0) {
            return res.status(404).json({ success: false, message: 'Facility not found' });
        }
        
        if (attendee_count > facilities[0].capacity) {
            return res.status(400).json({ success: false, message: 'Attendee count exceeds facility capacity' });
        }
        
        // Create booking
        const [result] = await pool.execute(
            `INSERT INTO bookings (user_id, facility_id, booking_date, start_time, end_time, purpose, attendee_count, notes, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [user_id, facility_id, booking_date, start_time, end_time, purpose, attendee_count, notes || null]
        );
        
        res.status(201).json({
            success: true,
            message: 'Booking request submitted successfully',
            booking: { id: result.insertId, status: 'pending' }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get my bookings
// @route   GET /api/bookings/my
const getMyBookings = async (req, res) => {
    try {
        const [bookings] = await pool.execute(
            `SELECT b.id, b.booking_date, b.start_time, b.end_time, b.purpose, b.attendee_count, 
                    b.status, b.rejection_reason, b.created_at,
                    f.id as facility_id, f.name as facility_name, f.location
             FROM bookings b
             JOIN facilities f ON b.facility_id = f.id
             WHERE b.user_id = ?
             ORDER BY b.booking_date DESC, b.start_time ASC`,
            [req.user.id]
        );
        
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.id;
        
        // Check if booking exists and belongs to user
        const [bookings] = await pool.execute(
            'SELECT id, status, booking_date FROM bookings WHERE id = ? AND user_id = ?',
            [bookingId, userId]
        );
        
        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        const booking = bookings[0];
        
        if (booking.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Booking already cancelled' });
        }
        
        if (booking.status === 'rejected') {
            return res.status(400).json({ success: false, message: 'Cannot cancel a rejected booking' });
        }
        
        // Check if booking date is in the past
        const today = new Date().toISOString().split('T')[0];
        if (booking.booking_date < today) {
            return res.status(400).json({ success: false, message: 'Cannot cancel past bookings' });
        }
        
        await pool.execute(
            'UPDATE bookings SET status = "cancelled" WHERE id = ?',
            [bookingId]
        );
        
        res.json({ success: true, message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { createBooking, getMyBookings, cancelBooking };