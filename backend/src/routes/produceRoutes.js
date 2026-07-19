const express = require('express');
const {
  createProduce,
  updateProduce,
  deleteProduce,
  deleteProduceImage,
  getProduceById,
  getMyProduce,
  searchProduce,
  getCategories,
} = require('../controllers/produceController');
const { createProduceRules, updateProduceRules, searchProduceRules } = require('../validators/produceValidators');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.get('/', searchProduceRules, searchProduce);
router.get('/categories', getCategories);
router.get('/my-listings', protect, authorize('farmer'), getMyProduce);
router.get('/:id', getProduceById);

router.post('/', protect, authorize('farmer'), upload.array('images', 8), createProduceRules, createProduce);
router.put('/:id', protect, authorize('farmer'), upload.array('images', 8), updateProduceRules, updateProduce);
router.delete('/:id/images/:publicId', protect, authorize('farmer'), deleteProduceImage);
router.delete('/:id', protect, authorize('farmer', 'admin'), deleteProduce);

module.exports = router;
