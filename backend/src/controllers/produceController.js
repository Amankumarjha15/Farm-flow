const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const Produce = require('../models/Produce');
const { uploadImages, deleteImages } = require('../services/cloudinaryService');

// @desc    Create produce listing
// @route   POST /api/v1/produce
// @access  Private (farmer)
const createProduce = asyncHandler(async (req, res) => {
  const images = req.files?.length ? await uploadImages(req.files, 'farmflow/produce') : [];

  const produce = await Produce.create({
    ...req.body,
    farmer: req.user._id,
    availableQuantity: req.body.availableQuantity ?? req.body.quantity,
    images,
  });

  res.status(201).json({ success: true, message: 'Produce listed successfully', data: produce });
});

// @desc    Update produce listing (owner only)
// @route   PUT /api/v1/produce/:id
// @access  Private (farmer, owner)
const updateProduce = asyncHandler(async (req, res) => {
  const produce = await Produce.findOne({ _id: req.params.id, isDeleted: false });
  if (!produce) throw new ApiError(404, 'Produce not found');
  if (String(produce.farmer) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only edit your own produce listings');
  }

  if (req.files?.length) {
    const newImages = await uploadImages(req.files, 'farmflow/produce');
    produce.images = [...produce.images, ...newImages];
  }

  const editableFields = [
    'cropName', 'category', 'description', 'quantity', 'availableQuantity',
    'unit', 'price', 'location', 'harvestDate', 'isOrganic', 'qualityGrade', 'status',
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) produce[field] = req.body[field];
  });

  await produce.save();
  res.json({ success: true, message: 'Produce updated successfully', data: produce });
});

// @desc    Remove a specific image from a produce listing
// @route   DELETE /api/v1/produce/:id/images/:publicId
// @access  Private (farmer, owner)
const deleteProduceImage = asyncHandler(async (req, res) => {
  const produce = await Produce.findOne({ _id: req.params.id, isDeleted: false });
  if (!produce) throw new ApiError(404, 'Produce not found');
  if (String(produce.farmer) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only edit your own produce listings');
  }

  const { publicId } = req.params;
  await deleteImages([publicId]);
  produce.images = produce.images.filter((img) => img.publicId !== publicId);
  await produce.save();

  res.json({ success: true, message: 'Image removed', data: produce });
});

// @desc    Soft delete produce listing
// @route   DELETE /api/v1/produce/:id
// @access  Private (farmer, owner)
const deleteProduce = asyncHandler(async (req, res) => {
  const produce = await Produce.findOne({ _id: req.params.id, isDeleted: false });
  if (!produce) throw new ApiError(404, 'Produce not found');
  if (String(produce.farmer) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only delete your own produce listings');
  }

  produce.isDeleted = true;
  produce.status = 'inactive';
  await produce.save();

  res.json({ success: true, message: 'Produce listing removed' });
});

// @desc    Get single produce by id
// @route   GET /api/v1/produce/:id
// @access  Public
const getProduceById = asyncHandler(async (req, res) => {
  const produce = await Produce.findOne({ _id: req.params.id, isDeleted: false }).populate(
    'farmer',
    'name email phone farmDetails avatar'
  );
  if (!produce) throw new ApiError(404, 'Produce not found');
  res.json({ success: true, data: produce });
});

// @desc    Get logged-in farmer's own produce listings
// @route   GET /api/v1/produce/my-listings
// @access  Private (farmer)
const getMyProduce = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const [items, total] = await Promise.all([
    Produce.find({ farmer: req.user._id, isDeleted: false })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Produce.countDocuments({ farmer: req.user._id, isDeleted: false }),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Search/browse produce with advanced filters, sorting, pagination
// @route   GET /api/v1/produce
// @access  Public
const searchProduce = asyncHandler(async (req, res) => {
  const {
    q, category, location, minPrice, maxPrice, qualityGrade, isOrganic,
    farmer, minQuantity, sort = '-createdAt', page = 1, limit = 20,
  } = req.query;

  const filter = { isDeleted: false, status: { $ne: 'inactive' } };

  if (q) filter.$text = { $search: q };
  if (category) filter.category = category;
  if (location) filter.location = new RegExp(location, 'i');
  if (qualityGrade) filter.qualityGrade = qualityGrade;
  if (farmer) filter.farmer = farmer;
  if (isOrganic !== undefined) filter.isOrganic = isOrganic === 'true';
  if (minQuantity) filter.availableQuantity = { $gte: Number(minQuantity) };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const pageNum = Number(page);
  const limitNum = Number(limit);

  const [items, total] = await Promise.all([
    Produce.find(filter)
      .populate('farmer', 'name farmDetails avatar')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Produce.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// @desc    Get distinct categories (for filter dropdowns)
// @route   GET /api/v1/produce/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Produce.distinct('category', { isDeleted: false });
  res.json({ success: true, data: categories });
});

module.exports = {
  createProduce,
  updateProduce,
  deleteProduce,
  deleteProduceImage,
  getProduceById,
  getMyProduce,
  searchProduce,
  getCategories,
};
