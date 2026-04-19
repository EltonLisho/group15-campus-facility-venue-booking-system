const express = require('express');
const {
    getPendingBookings,
    approveBooking,
    rejectBooking,
    getAllBookings
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/bookings/pending', getPendingBookings);
router.get('/bookings/all', getAllBookings);
router.put('/bookings/:id/approve', approveBooking);
router.put('/bookings/:id/reject', rejectBooking);

module.exports = router;