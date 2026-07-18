const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Wishlist = require('../models/Wishlist');
const { uploadSingleImage, deleteImage } = require('../services/cloudinaryService');

// @desc    Update own profile (name, phone, address, farm/vehicle details by role)
// @route   PUT /api/v1/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const editable = ['name', 'phone', 'address'];
  if (req.user.role === 'farmer') editable.push('farmDetails');
  if (req.user.role === 'logistics') editable.push('vehicleDetails');

  editable.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });

  await req.user.save();
  res.json({ success: true, message: 'Profile updated', data: req.user });
});

// @desc    Upload/replace profile photo
// @route   POST /api/v1/users/profile/avatar
// @access  Private
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image file provided');

  if (req.user.avatar?.publicId) await deleteImage(req.user.avatar.publicId);

  const uploaded = await uploadSingleImage(req.file, 'farmflow/avatars');
  req.user.avatar = uploaded;
  await req.user.save();

  res.json({ success: true, message: 'Profile photo updated', data: req.user });
});

// @desc    Get/add/remove wishlist items (retailer)
// @route   GET/POST/DELETE /api/v1/users/wishlist
// @access  Private (retailer)
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ retailer: req.user._id }).populate('produce');
  res.json({ success: true, data: wishlist?.produce || [] });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { retailer: req.user._id },
    { $addToSet: { produce: req.body.produceId } },
    { new: true, upsert: true }
  ).populate('produce');
  res.json({ success: true, data: wishlist.produce });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { retailer: req.user._id },
    { $pull: { produce: req.params.produceId } },
    { new: true }
  ).populate('produce');
  res.json({ success: true, data: wishlist?.produce || [] });
});

module.exports = { updateProfile, updateAvatar, getWishlist, addToWishlist, removeFromWishlist };
