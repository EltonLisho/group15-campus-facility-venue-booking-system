const express = require('express');
const {
    getFacilities,
    getFacilityById,
    checkAvailability,
    createFacility,
    updateFacility,
    deleteFacility
} = require('../controllers/facilityController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getFacilities);
router.get('/:id', protect, getFacilityById);
router.get('/:id/availability', protect, checkAvailability);
router.post('/', protect, adminOnly, createFacility);
router.put('/:id', protect, adminOnly, updateFacility);
router.delete('/:id', protect, adminOnly, deleteFacility);

module.exports = router;