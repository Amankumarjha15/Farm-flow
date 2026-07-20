const { body, query } = require('express-validator');
const { validate } = require('./authValidators');

const createProduceRules = [
  body('cropName').trim().notEmpty().withMessage('Crop name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('harvestDate').isISO8601().withMessage('Valid harvest date is required'),
  body('qualityGrade').optional().isIn(['A', 'B', 'C', 'Premium', 'Standard']),
  body('isOrganic').optional().isBoolean(),
  body('unit').optional().isIn(['kg', 'quintal', 'ton', 'dozen', 'piece']),
  validate,
];

const updateProduceRules = [
  body('quantity').optional().isFloat({ gt: 0 }),
  body('availableQuantity').optional().isFloat({ min: 0 }),
  body('price').optional().isFloat({ gt: 0 }),
  body('qualityGrade').optional().isIn(['A', 'B', 'C', 'Premium', 'Standard']),
  validate,
];

const searchProduceRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  validate,
];

module.exports = { createProduceRules, updateProduceRules, searchProduceRules };
