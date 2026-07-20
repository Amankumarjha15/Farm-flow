const { body } = require('express-validator');
const { validate } = require('./authValidators');

const acceptDeliveryRules = [
  body('expectedDeliveryDate').isISO8601().withMessage('Valid expected delivery date is required'),
  body('expectedDeliveryTime').notEmpty().withMessage('Expected delivery time is required'),
  body('pickupMessage').optional().isLength({ max: 500 }),
  validate,
];

const updateStatusRules = [
  body('status')
    .isIn(['ready_to_ship', 'shipped', 'on_the_way', 'delivered'])
    .withMessage('Invalid status'),
  body('currentLocation').if(body('status').equals('on_the_way')).notEmpty().withMessage('Current location required for On The Way status'),
  body('eta').if(body('status').equals('on_the_way')).notEmpty().withMessage('ETA required for On The Way status'),
  body('message').optional().isLength({ max: 500 }),
  validate,
];

const locationUpdateRules = [
  body('currentLocation').notEmpty().withMessage('Current location is required'),
  body('eta').notEmpty().withMessage('ETA is required'),
  body('message').optional().isLength({ max: 500 }),
  validate,
];

module.exports = { acceptDeliveryRules, updateStatusRules, locationUpdateRules };
