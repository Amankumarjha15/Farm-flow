const express = require('express');
const {
  updateProfile, updateAvatar, getWishlist, addToWishlist, removeFromWishlist,
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.use(protect);

router.put('/profile', updateProfile);
router.post('/profile/avatar', upload.single('avatar'), updateAvatar);

router.get('/wishlist', authorize('retailer'), getWishlist);
router.post('/wishlist', authorize('retailer'), addToWishlist);
router.delete('/wishlist/:produceId', authorize('retailer'), removeFromWishlist);

module.exports = router;
