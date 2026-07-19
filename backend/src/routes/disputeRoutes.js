const express = require('express');
const { createDispute, getAllDisputes, resolveDispute, getMyDisputes } = require('../controllers/disputeController');
const { createDisputeRules, resolveDisputeRules } = require('../validators/disputeValidators');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.post('/', protect, authorize('retailer'), upload.array('images', 5), createDisputeRules, createDispute);
router.get('/my-disputes', protect, authorize('retailer', 'farmer'), getMyDisputes);
router.get('/admin', protect, authorize('admin'), getAllDisputes);
router.patch('/:id/resolve', protect, authorize('admin'), resolveDisputeRules, resolveDispute);

module.exports = router;
