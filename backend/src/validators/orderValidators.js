const { body } = require('express-validator');
const { validate } = require('./authValidators');

const createOrderRules = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.produceId').notEmpty().withMessage('produceId is required for each item'),
  body('items.*.quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('shippingAddress.line1').notEmpty().withMessage('Address line is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.pincode').notEmpty().withMessage('Pincode is required'),
  validate,
];

module.exports = { createOrderRules };
