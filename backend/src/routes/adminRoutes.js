const express = require('express');
const {
  getDashboardStats, manageUsers, verifyUser, toggleUserActive, deleteUser,
  manageProduce, moderateProduce, managePayments, exportOrdersCsv,
} = require('../controllers/adminController');
const { getAllCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', manageUsers);
router.patch('/users/:id/verify', verifyUser);
router.patch('/users/:id/toggle-active', toggleUserActive);
router.delete('/users/:id', deleteUser);
router.get('/produce', manageProduce);
router.patch('/produce/:id/moderate', moderateProduce);
router.get('/payments', managePayments);
router.get('/export/orders', exportOrdersCsv);

router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
