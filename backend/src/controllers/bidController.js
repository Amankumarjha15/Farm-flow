const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const Bid = require('../models/Bid');
const Produce = require('../models/Produce');
const { notify } = require('../services/notificationService');

// @desc    Retailer places a bid on a produce listing
// @route   POST /api/v1/bids
// @access  Private (retailer)
const createBid = asyncHandler(async (req, res) => {
  const { produceId, quantity, proposedPrice, message } = req.body;

  const produce = await Produce.findOne({ _id: produceId, isDeleted: false });
  if (!produce) throw new ApiError(404, 'Produce not found');
  if (produce.availableQuantity < quantity) {
    throw new ApiError(400, `Only ${produce.availableQuantity} ${produce.unit} available`);
  }

  const bid = await Bid.create({
    produce: produce._id,
    farmer: produce.farmer,
    retailer: req.user._id,
    quantity,
    proposedPrice,
    message,
  });

  await notify(req, {
    userId: produce.farmer,
    type: 'bid_received',
    title: 'New bid received',
    message: `${req.user.name} offered ₹${proposedPrice}/${produce.unit} for ${quantity} ${produce.unit} of ${produce.cropName}`,
    link: `/farmer/bids/${bid._id}`,
  });

  res.status(201).json({ success: true, message: 'Bid placed successfully', data: bid });
});

// @desc    Farmer accepts a bid
// @route   PATCH /api/v1/bids/:id/accept
// @access  Private (farmer, owner of produce)
const acceptBid = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id).populate('produce');
  if (!bid) throw new ApiError(404, 'Bid not found');
  if (String(bid.farmer) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');
  if (bid.status !== 'pending' && bid.status !== 'countered') {
    throw new ApiError(400, `Bid already ${bid.status}`);
  }
  if (bid.produce.availableQuantity < bid.quantity) {
    throw new ApiError(400, 'Insufficient available quantity to accept this bid');
  }

  bid.status = 'accepted';
  await bid.save();

  await notify(req, {
    userId: bid.retailer,
    type: 'bid_accepted',
    title: 'Your bid was accepted',
    message: `Your offer for ${bid.produce.cropName} was accepted. Proceed to checkout.`,
    link: `/retailer/bids/${bid._id}`,
  });

  res.json({ success: true, message: 'Bid accepted', data: bid });
});

// @desc    Farmer rejects a bid
// @route   PATCH /api/v1/bids/:id/reject
// @access  Private (farmer, owner)
const rejectBid = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id).populate('produce');
  if (!bid) throw new ApiError(404, 'Bid not found');
  if (String(bid.farmer) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');
  if (bid.status !== 'pending' && bid.status !== 'countered') {
    throw new ApiError(400, `Bid already ${bid.status}`);
  }

  bid.status = 'rejected';
  await bid.save();

  await notify(req, {
    userId: bid.retailer,
    type: 'bid_rejected',
    title: 'Your bid was rejected',
    message: `Your offer for ${bid.produce.cropName} was declined by the farmer.`,
    link: `/retailer/bids/${bid._id}`,
  });

  res.json({ success: true, message: 'Bid rejected', data: bid });
});

// @desc    Farmer counters a bid with a different price
// @route   PATCH /api/v1/bids/:id/counter
// @access  Private (farmer, owner)
const counterBid = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id).populate('produce');
  if (!bid) throw new ApiError(404, 'Bid not found');
  if (String(bid.farmer) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');
  if (bid.status !== 'pending') throw new ApiError(400, `Bid already ${bid.status}`);

  bid.status = 'countered';
  bid.counterPrice = req.body.counterPrice;
  await bid.save();

  await notify(req, {
    userId: bid.retailer,
    type: 'bid_received',
    title: 'Farmer countered your bid',
    message: `Farmer proposed ₹${bid.counterPrice}/${bid.produce.unit} for ${bid.produce.cropName}`,
    link: `/retailer/bids/${bid._id}`,
  });

  res.json({ success: true, message: 'Counter offer sent', data: bid });
});

// @desc    Retailer accepts the farmer's counter-offer
// @route   PATCH /api/v1/bids/:id/accept-counter
// @access  Private (retailer, owner of the bid)
const acceptCounter = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id).populate('produce');
  if (!bid) throw new ApiError(404, 'Bid not found');
  if (String(bid.retailer) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');
  if (bid.status !== 'countered') throw new ApiError(400, `Bid is '${bid.status}', not awaiting your response`);
  if (bid.produce.availableQuantity < bid.quantity) {
    throw new ApiError(400, 'Insufficient available quantity to accept this offer');
  }

  bid.status = 'accepted';
  await bid.save();

  await notify(req, {
    userId: bid.farmer,
    type: 'bid_accepted',
    title: 'Retailer accepted your counter-offer',
    message: `${req.user.name} accepted your price of ₹${bid.counterPrice} for ${bid.produce.cropName}`,
    link: `/farmer/bids/${bid._id}`,
  });

  res.json({ success: true, message: 'Counter-offer accepted. Proceed to checkout.', data: bid });
});

// @desc    Retailer rejects the farmer's counter-offer (ends this round of negotiation)
// @route   PATCH /api/v1/bids/:id/reject-counter
// @access  Private (retailer, owner of the bid)
const rejectCounter = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id).populate('produce');
  if (!bid) throw new ApiError(404, 'Bid not found');
  if (String(bid.retailer) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');
  if (bid.status !== 'countered') throw new ApiError(400, `Bid is '${bid.status}', not awaiting your response`);

  bid.status = 'rejected';
  await bid.save();

  await notify(req, {
    userId: bid.farmer,
    type: 'bid_rejected',
    title: 'Retailer declined your counter-offer',
    message: `${req.user.name} declined your counter-offer for ${bid.produce.cropName}`,
    link: `/farmer/bids/${bid._id}`,
  });

  res.json({ success: true, message: 'Counter-offer declined', data: bid });
});

// @desc    Retailer responds to a counter-offer with a new price of their own — reopens
//          negotiation (moves the bid back to 'pending' so the farmer can accept/reject/counter
//          again). This is what makes multi-round back-and-forth negotiation possible, not just
//          a single offer → single counter → dead end.
// @route   PATCH /api/v1/bids/:id/negotiate
// @access  Private (retailer, owner of the bid)
const negotiateBid = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id).populate('produce');
  if (!bid) throw new ApiError(404, 'Bid not found');
  if (String(bid.retailer) !== String(req.user._id)) throw new ApiError(403, 'Not authorized');
  if (bid.status !== 'countered') throw new ApiError(400, `Bid is '${bid.status}', not awaiting your response`);

  bid.proposedPrice = req.body.proposedPrice;
  bid.counterPrice = undefined;
  bid.status = 'pending';
  if (req.body.message) bid.message = req.body.message;
  await bid.save();

  await notify(req, {
    userId: bid.farmer,
    type: 'bid_received',
    title: 'Retailer sent a new offer',
    message: `${req.user.name} proposed ₹${bid.proposedPrice}/${bid.produce.unit} for ${bid.produce.cropName}`,
    link: `/farmer/bids/${bid._id}`,
  });

  res.json({ success: true, message: 'Your new offer was sent to the farmer', data: bid });
});

// @desc    Get bids for a produce listing (farmer) or by retailer (their own)
// @route   GET /api/v1/bids/produce/:produceId
// @route   GET /api/v1/bids/my-bids
// @access  Private
const getBidsForProduce = asyncHandler(async (req, res) => {
  const produce = await Produce.findById(req.params.produceId);
  if (!produce) throw new ApiError(404, 'Produce not found');
  if (String(produce.farmer) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized');
  }

  const bids = await Bid.find({ produce: req.params.produceId })
    .populate('retailer', 'name email phone')
    .sort('-createdAt');

  res.json({ success: true, data: bids });
});

const getMyBids = asyncHandler(async (req, res) => {
  const bids = await Bid.find({ retailer: req.user._id })
    .populate('produce', 'cropName images price unit')
    .populate('farmer', 'name')
    .sort('-createdAt');

  res.json({ success: true, data: bids });
});

module.exports = {
  createBid, acceptBid, rejectBid, counterBid,
  acceptCounter, rejectCounter, negotiateBid,
  getBidsForProduce, getMyBids,
};
