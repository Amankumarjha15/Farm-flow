const express = require('express');
const { getMyPayouts, getAllPayouts, completePayout } = require('../controllers/payoutController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/my-payouts', protect, authorize('farmer'), getMyPayouts);
router.get('/admin', protect, authorize('admin'), getAllPayouts);
router.patch('/:id/complete', protect, authorize('admin'), completePayout);

module.exports = router;
