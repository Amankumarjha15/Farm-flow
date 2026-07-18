const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const Category = require('../models/Category');

// @desc    List active categories (used to populate dropdowns app-wide)
// @route   GET /api/v1/categories
// @access  Public
const getActiveCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('name');
  res.json({ success: true, data: categories });
});

// @desc    Admin: list all categories (including inactive)
// @route   GET /api/v1/admin/categories
// @access  Private (admin)
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('name');
  res.json({ success: true, data: categories });
});

// @desc    Admin: create a category
// @route   POST /api/v1/admin/categories
// @access  Private (admin)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim()) throw new ApiError(400, 'Category name is required');

  const exists = await Category.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
  if (exists) throw new ApiError(409, 'A category with this name already exists');

  const category = await Category.create({ name: name.trim(), description });
  res.status(201).json({ success: true, message: 'Category created', data: category });
});

// @desc    Admin: update a category (rename, description, active toggle)
// @route   PUT /api/v1/admin/categories/:id
// @access  Private (admin)
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  ['name', 'description', 'isActive'].forEach((field) => {
    if (req.body[field] !== undefined) category[field] = req.body[field];
  });

  await category.save();
  res.json({ success: true, message: 'Category updated', data: category });
});

// @desc    Admin: delete a category
// @route   DELETE /api/v1/admin/categories/:id
// @access  Private (admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = { getActiveCategories, getAllCategories, createCategory, updateCategory, deleteCategory };
