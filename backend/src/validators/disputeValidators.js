const { body } = require('express-validator');
const { validate } = require('./authValidators');

const createDisputeRules = [
  body('orderId').notEmpty().withMessage('orderId is required'),
  body('complaint').trim().notEmpty().withMessage('Complaint description is required').isLength({ max: 2000 }),
  validate,
];

const resolveDisputeRules = [
  body('action').isIn(['refund', 'partial_refund', 'reject', 'replacement']).withMessage('Invalid action'),
  body('resolutionNote').optional().isLength({ max: 1000 }),
  body('refundAmount').if(body('action').equals('partial_refund')).isFloat({ gt: 0 }).withMessage('refundAmount required for partial refund'),
  validate,
];

module.exports = { createDisputeRules, resolveDisputeRules };
