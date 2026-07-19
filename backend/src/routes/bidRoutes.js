const express = require('express');
const {
  createBid, acceptBid, rejectBid, counterBid,
  acceptCounter, rejectCounter, negotiateBid,
  getBidsForProduce, getMyBids,
} = require('../controllers/bidController');
const { createBidRules, counterBidRules, negotiateBidRules } = require('../validators/bidValidators');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.post('/', protect, authorize('retailer'), createBidRules, createBid);
router.get('/my-bids', protect, authorize('retailer'), getMyBids);
router.get('/produce/:produceId', protect, authorize('farmer', 'admin'), getBidsForProduce);

// Farmer-side responses to a retailer's bid
router.patch('/:id/accept', protect, authorize('farmer'), acceptBid);
router.patch('/:id/reject', protect, authorize('farmer'), rejectBid);
router.patch('/:id/counter', protect, authorize('farmer'), counterBidRules, counterBid);

// Retailer-side responses to a farmer's counter-offer — this is what allows the negotiation to
// go more than one round instead of dead-ending after a single counter.
router.patch('/:id/accept-counter', protect, authorize('retailer'), acceptCounter);
router.patch('/:id/reject-counter', protect, authorize('retailer'), rejectCounter);
router.patch('/:id/negotiate', protect, authorize('retailer'), negotiateBidRules, negotiateBid);

module.exports = router;
