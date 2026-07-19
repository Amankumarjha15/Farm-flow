const express = require('express');
const {
  getAvailableDeliveries, acceptDelivery, updateDeliveryStatus, addLocationUpdate, getAssignedDeliveries, getDeliveryHistory,
} = require('../controllers/logisticsController');
const { acceptDeliveryRules, updateStatusRules, locationUpdateRules } = require('../validators/logisticsValidators');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect, authorize('logistics'));

router.get('/available', getAvailableDeliveries);
router.get('/assigned', getAssignedDeliveries);
router.get('/history', getDeliveryHistory);
router.patch('/:orderId/accept', acceptDeliveryRules, acceptDelivery);
router.patch('/:orderId/status', updateStatusRules, updateDeliveryStatus);
router.patch('/:orderId/location', locationUpdateRules, addLocationUpdate);

module.exports = router;
