const express = require('express');
const { getActiveCategories } = require('../controllers/categoryController');
const { getPublicSettings } = require('../controllers/settingsController');

const router = express.Router();

router.get('/categories', getActiveCategories);
router.get('/settings', getPublicSettings);

module.exports = router;
