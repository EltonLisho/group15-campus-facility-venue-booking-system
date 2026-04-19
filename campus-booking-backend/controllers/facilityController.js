const pool = require('../config/db');

// @desc    Get all facilities
// @route   GET /api/facilities
const getFacilities = async (req, res) => {
    try {
        const [facilities] = await pool.execute(
            'SELECT id, name, capacity, location, equipment, image_url, created_at FROM facilities ORDER BY name'
        );
        
        res.json({ success: true, data: facilities });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single facility
// @route   GET /api/facilities/:id
const getFacilityById = async (req, res) => {
    try {
        const [facilities] = await pool.execute(
            'SELECT id, name, capacity, location, equipment, image_url FROM facilities WHERE id = ?',
            [req.params.id]
        );
        
        if (facilities.length === 0) {
            return res.status(404).json({ success: false, message: 'Facility not found' });
        }
        
        res.json({ success: true, data: facilities[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Check availability for a facility on a specific date
// @route   GET /api/facilities/:id/availability
const checkAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        const facilityId = req.params.id;
        
        // Get all bookings for this facility on the given date that are approved
        const [bookings] = await pool.execute(
            `SELECT start_time, end_time 
             FROM bookings 
             WHERE facility_id = ? 
             AND booking_date = ? 
             AND status IN ('approved', 'pending')`,
            [facilityId, date]
        );
        
        // Define standard time slots (9 AM to 9 PM)
        const allSlots = [
            '09:00:00', '10:00:00', '11:00:00', '12:00:00',
            '13:00:00', '14:00:00', '15:00:00', '16:00:00',
            '17:00:00', '18:00:00', '19:00:00', '20:00:00'
        ];
        
        // Filter out booked slots
        const bookedTimes = new Set();
        bookings.forEach(booking => {
            let current = booking.start_time;
            while (current < booking.end_time) {
                bookedTimes.add(current);
                // Increment by 1 hour
                const [hour] = current.split(':');
                current = `${String(parseInt(hour) + 1).padStart(2, '0')}:00:00`;
            }
        });
        
        const availableSlots = allSlots
            .filter(slot => !bookedTimes.has(slot))
            .map(start => ({
                start_time: start,
                end_time: `${String(parseInt(start.split(':')[0]) + 1).padStart(2, '0')}:00:00`
            }));
        
        res.json({ success: true, data: availableSlots });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create facility (Admin only)
// @route   POST /api/facilities
const createFacility = async (req, res) => {
    try {
        const { name, capacity, location, equipment, image_url } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO facilities (name, capacity, location, equipment, image_url) VALUES (?, ?, ?, ?, ?)',
            [name, capacity, location, equipment || null, image_url || null]
        );
        
        res.status(201).json({
            success: true,
            message: 'Facility created successfully',
            facility: { id: result.insertId, name, capacity, location, equipment, image_url }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update facility (Admin only)
// @route   PUT /api/facilities/:id
const updateFacility = async (req, res) => {
    try {
        const { name, capacity, location, equipment, image_url } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE facilities SET name = ?, capacity = ?, location = ?, equipment = ?, image_url = ? WHERE id = ?',
            [name, capacity, location, equipment || null, image_url || null, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Facility not found' });
        }
        
        res.json({ success: true, message: 'Facility updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete facility (Admin only)
// @route   DELETE /api/facilities/:id
const deleteFacility = async (req, res) => {
    try {
        // Check if facility has future bookings
        const [bookings] = await pool.execute(
            'SELECT id FROM bookings WHERE facility_id = ? AND booking_date >= CURDATE() AND status IN ("approved", "pending")',
            [req.params.id]
        );
        
        if (bookings.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete facility with future bookings' 
            });
        }
        
        const [result] = await pool.execute(
            'DELETE FROM facilities WHERE id = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Facility not found' });
        }
        
        res.json({ success: true, message: 'Facility deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getFacilities,
    getFacilityById,
    checkAvailability,
    createFacility,
    updateFacility,
    deleteFacility
};