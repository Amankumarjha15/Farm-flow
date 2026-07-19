const express = require('express');
const {
  createOrder, getOrderById, getMyOrders, getFarmerOrders, cancelOrder,
} = require('../controllers/orderController');
const { createOrderRules } = require('../validators/orderValidators');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.post('/', protect, authorize('retailer'), createOrderRules, createOrder);
router.get('/my-orders', protect, authorize('retailer'), getMyOrders);
router.get('/farmer-orders', protect, authorize('farmer'), getFarmerOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/cancel', protect, authorize('retailer'), cancelOrder);

module.exports = router;
