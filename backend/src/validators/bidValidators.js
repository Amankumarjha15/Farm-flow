const { body } = require('express-validator');
const { validate } = require('./authValidators');

const createBidRules = [
  body('produceId').notEmpty().withMessage('produceId is required'),
  body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('proposedPrice').isFloat({ gt: 0 }).withMessage('Proposed price must be greater than 0'),
  body('message').optional().isLength({ max: 500 }),
  validate,
];

const counterBidRules = [
  body('counterPrice').isFloat({ gt: 0 }).withMessage('Counter price must be greater than 0'),
  validate,
];

const negotiateBidRules = [
  body('proposedPrice').isFloat({ gt: 0 }).withMessage('Proposed price must be greater than 0'),
  body('message').optional().isLength({ max: 500 }),
  validate,
];

module.exports = { createBidRules, counterBidRules, negotiateBidRules };
